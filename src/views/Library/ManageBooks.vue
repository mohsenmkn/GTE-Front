<!-- resources/js/Modules/Library/Views/Admin/ManageBooks.vue -->
<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-book text-blue-600"></i>
          مدیریت کتاب‌ها
        </h1>
        <p class="text-gray-500 mt-1">ثبت، ویرایش و مدیریت کتاب‌های کتابخانه</p>
      </div>
      <div class="flex gap-2">
        <Button
            label="دسته‌بندی‌ها"
            icon="pi pi-tags"
            severity="secondary"
            outlined
            @click="openCategoriesDialog"
        />
        <Button
            label="کتاب جدید"
            icon="pi pi-plus"
            class="bg-blue-600 hover:bg-blue-700"
            @click="openBookDialog(null)"
        />
      </div>
    </div>

    <!-- جستجو -->
    <Card class="shadow-sm mb-6">
      <template #content>
        <div class="relative">
          <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <InputText
              v-model="searchQuery"
              placeholder="جستجو بر اساس عنوان، نویسنده یا شابک..."
              class="w-full pr-10"
              @input="debouncedSearch"
          />
        </div>
      </template>
    </Card>

    <!-- جدول کتاب‌ها -->
    <DataTable
        :value="books"
        :loading="loading"
        paginator
        :rows="10"
        stripedRows
        class="shadow-sm"
        emptyMessage="کتابی یافت نشد"
    >
      <Column header="کتاب" style="min-width: 250px">
        <template #body="slotProps">
          <div class="flex items-center gap-3">
            <div class="w-12 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                  v-if="getCoverUrl(slotProps.data)"
                  :src="getCoverUrl(slotProps.data)"
                  class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-book text-blue-300"></i>
            </div>
            <div>
              <div class="font-bold text-gray-800">{{ slotProps.data.title }}</div>
              <div class="text-sm text-gray-500">{{ slotProps.data.author }}</div>
            </div>
          </div>
        </template>
      </Column>

      <Column header="دسته‌بندی" style="min-width: 120px">
        <template #body="slotProps">
          <Tag
              v-if="slotProps.data.category"
              :value="slotProps.data.category.name"
              severity="info"
          />
          <span v-else class="text-gray-400">-</span>
        </template>
      </Column>

      <Column header="نسخه‌ها" style="min-width: 150px">
        <template #body="slotProps">
          <div class="flex items-center gap-2">
            <Badge
                :value="`${slotProps.data.available_copies_count} / ${slotProps.data.total_copies_count}`"
                severity="success"
            />
            <span class="text-xs text-gray-500">موجود / کل</span>
          </div>
        </template>
      </Column>

      <Column header="شابک" style="min-width: 130px">
        <template #body="slotProps">
          <span class="font-mono text-sm" dir="ltr">{{ slotProps.data.isbn || '-' }}</span>
        </template>
      </Column>

      <Column header="عملیات" style="min-width: 200px" frozen alignFrozen="left">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button
                icon="pi pi-copy"
                class="p-button-rounded p-button-info p-button-text"
                tooltip="مدیریت نسخه‌ها"
                @click="openCopiesDialog(slotProps.data)"
            />
            <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success p-button-text"
                tooltip="ویرایش"
                @click="openBookDialog(slotProps.data)"
            />
            <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-text"
                tooltip="حذف"
                @click="confirmDeleteBook(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog کتاب (ایجاد/ویرایش) -->
    <Dialog
        v-model:visible="bookDialog"
        :header="isEdit ? 'ویرایش کتاب' : 'کتاب جدید'"
        :style="{ width: '600px' }"
        :modal="true"
    >
      <!-- 🔑 خلاصه خطاهای سرور (همیشه قابل دیدن) -->
      <Message v-if="serverErrors.length" severity="error" :closable="false" class="mb-4">
        <div class="font-bold mb-1">لطفاً موارد زیر را اصلاح کنید:</div>
        <ul class="list-disc pr-5 space-y-1 text-sm">
          <li v-for="(err, i) in serverErrors" :key="i">{{ err }}</li>
        </ul>
      </Message>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium">عنوان کتاب <span class="text-red-500">*</span></label>
          <InputText v-model="bookForm.title" :class="{ 'p-invalid': formErrors.title }" />
          <small class="p-error" v-if="firstError('title')">{{ firstError('title') }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">نویسنده <span class="text-red-500">*</span></label>
          <InputText v-model="bookForm.author" :class="{ 'p-invalid': formErrors.author }" />
          <small class="p-error" v-if="firstError('author')">{{ firstError('author') }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">مترجم</label>
          <InputText v-model="bookForm.translator" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">ناشر</label>
          <InputText v-model="bookForm.publisher" />
        </div>

        <!-- 🔑 فیلد ISBN با نمایش خطا (مثلاً تکراری بودن) -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">شابک (ISBN)</label>
          <InputText v-model="bookForm.isbn" dir="ltr" :class="{ 'p-invalid': formErrors.isbn }" />
          <small class="p-error" v-if="firstError('isbn')">{{ firstError('isbn') }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">دسته‌بندی <span class="text-red-500">*</span></label>
          <Select
              v-model="bookForm.category_id"
              :options="categories"
              optionLabel="name"
              optionValue="id"
              placeholder="انتخاب دسته"
              :class="{ 'p-invalid': formErrors.category_id }"
          />
          <small class="p-error" v-if="firstError('category_id')">{{ firstError('category_id') }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">سال انتشار</label>
          <InputNumber v-model="bookForm.publish_year" :useGrouping="false" :class="{ 'p-invalid': formErrors.publish_year }" />
          <small class="p-error" v-if="firstError('publish_year')">{{ firstError('publish_year') }}</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">تعداد صفحات</label>
          <InputNumber v-model="bookForm.pages" :useGrouping="false" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">زبان</label>
          <InputText v-model="bookForm.language" />
        </div>

        <div class="md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium">توضیحات</label>
          <Textarea v-model="bookForm.description" rows="3" />
        </div>

        <!-- آپلود تصویر جلد با نمایش خطا -->
        <div class="md:col-span-2 flex flex-col gap-2">
          <label class="text-sm font-medium">تصویر جلد</label>
          <div class="flex items-center gap-4">
            <div class="w-20 h-28 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
              <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" />
              <i v-else class="pi pi-image text-3xl text-gray-300"></i>
            </div>
            <div>
              <input type="file" accept="image/*" @change="onCoverChange" class="text-sm" />
              <small class="text-gray-500 block mt-1">حداکثر 2MB - فرمت‌های jpg, png</small>
            </div>
          </div>
          <small class="p-error" v-if="firstError('cover_image')">{{ firstError('cover_image') }}</small>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="انصراف" icon="pi pi-times" class="p-button-text" @click="bookDialog = false" />
          <Button
              label="ذخیره"
              icon="pi pi-check"
              :loading="saving"
              class="bg-blue-600 hover:bg-blue-700"
              @click="saveBook"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog مدیریت نسخه‌ها -->
    <Dialog
        v-model:visible="copiesDialog"
        :header="`نسخه‌های کتاب: ${currentBook?.title}`"
        :style="{ width: '550px' }"
        :modal="true"
    >
      <!-- لیست نسخه‌ها -->
      <div class="space-y-3 mb-6">
        <div
            v-for="copy in currentBook?.copies"
            :key="copy.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
        >
          <div>
            <div class="font-mono font-bold" dir="ltr">{{ copy.copy_code }}</div>
            <div class="text-xs text-gray-500">{{ copy.condition_note || 'سالم' }}</div>
          </div>
          <div class="flex items-center gap-2">
            <Tag
                :value="getCopyStatus(copy.status).label"
                :severity="getCopyStatus(copy.status).severity"
            />
            <Button
                v-if="copy.status === 'available'"
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-text"
                @click="confirmDeleteCopy(copy)"
            />
          </div>
        </div>
        <div v-if="!currentBook?.copies?.length" class="text-center text-gray-500 py-4">
          نسخه‌ای ثبت نشده است
        </div>
      </div>

      <!-- فرم افزودن نسخه -->
      <div class="border-t pt-4">
        <h4 class="font-bold text-gray-700 mb-3">افزودن نسخه جدید</h4>
        <div class="flex gap-3">
          <InputText
              v-model="copyForm.copy_code"
              placeholder="کد نسخه (بارکد)"
              class="flex-1"
              dir="ltr"
          />
          <Button
              label="افزودن"
              icon="pi pi-plus"
              :loading="savingCopy"
              @click="addCopy"
          />
        </div>
      </div>
    </Dialog>

    <!-- Dialog دسته‌بندی‌ها -->
    <Dialog
        v-model:visible="categoriesDialog"
        header="مدیریت دسته‌بندی‌ها"
        :style="{ width: '500px' }"
        :modal="true"
    >
      <div class="space-y-3 mb-6">
        <div
            v-for="category in categories"
            :key="category.id"
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: category.color }"></span>
            <span class="font-medium">{{ category.name }}</span>
            <Badge :value="`${category.books_count} کتاب`" severity="secondary" />
          </div>
          <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger p-button-text"
              @click="confirmDeleteCategory(category)"
          />
        </div>
      </div>

      <div class="border-t pt-4">
        <h4 class="font-bold text-gray-700 mb-3">دسته‌بندی جدید</h4>
        <div class="flex gap-3">
          <InputText v-model="categoryForm.name" placeholder="نام دسته‌بندی" class="flex-1" />
          <InputText v-model="categoryForm.color" placeholder="#3b82f6" class="w-28" dir="ltr" />
          <Button label="افزودن" icon="pi pi-plus" @click="addCategory" />
        </div>
      </div>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { libraryApi } from '@/services/libraryApi.js';
import { libraryAdminApi } from '@/services/libraryAdminApi.js';
import { useLibraryStatus } from '@/composables/useLibraryStatus.js';

const toast = useToast();
const confirm = useConfirm();
const { getCopyStatus } = useLibraryStatus();

const books = ref([]);
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const savingCopy = ref(false);
const searchQuery = ref('');

const bookDialog = ref(false);
const copiesDialog = ref(false);
const categoriesDialog = ref(false);
const isEdit = ref(false);
const currentBook = ref(null);
const coverPreview = ref(null);
const coverFile = ref(null);
const formErrors = ref({});

const bookForm = ref({});
const copyForm = ref({ copy_code: '' });
const categoryForm = ref({ name: '', color: '#3b82f6' });

let searchTimeout = null;

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadBooks(), 400);
};
// 🔑 متغیر جدید برای نمایش خلاصه خطاها
const serverErrors = ref([]);

// 🔑 helper برای نمایش اولین خطای هر فیلد
const firstError = (field) => {
  const err = formErrors.value[field];
  if (!err) return '';
  return Array.isArray(err) ? err[0] : err;
};

const openBookDialog = (book) => {
  formErrors.value = {};
  serverErrors.value = [];   // 🔑 پاک کردن خطاها
  coverPreview.value = null;
  coverFile.value = null;

  if (book) {
    isEdit.value = true;
    currentBook.value = book;
    bookForm.value = { ...book };
    coverPreview.value = getCoverUrl(book);
  } else {
    isEdit.value = false;
    currentBook.value = null;
    bookForm.value = {
      title: '', author: '', translator: '', publisher: '',
      isbn: '', publish_year: null, category_id: null,
      pages: null, language: 'فارسی', description: '',
    };
  }
  bookDialog.value = true;
};

const saveBook = async () => {
  saving.value = true;
  formErrors.value = {};
  serverErrors.value = [];   // 🔑 ریست خطاها

  try {
    const formData = new FormData();

    // 🔑 فقط فیلدهای مجاز ارسال شوند (جلوگیری از ارسال آبجکت‌های اضافه مثل category و copies)
    const allowedFields = [
      'title', 'author', 'translator', 'publisher', 'isbn',
      'publish_year', 'category_id', 'pages', 'language', 'description',
    ];

    allowedFields.forEach(key => {
      const value = bookForm.value[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    if (coverFile.value) {
      formData.append('cover_image', coverFile.value);
    }

    if (isEdit.value) {
      await libraryAdminApi.updateBook(currentBook.value.id, formData);
      toast.add({ severity: 'success', summary: 'موفق', detail: 'کتاب ویرایش شد.', life: 3000 });
    } else {
      await libraryAdminApi.createBook(formData);
      toast.add({ severity: 'success', summary: 'موفق', detail: 'کتاب ثبت شد.', life: 3000 });
    }

    bookDialog.value = false;
    loadBooks();
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 422 && data?.errors) {
      // 🔑 خطاهای ولیدیشن: هم روی فیلد، هم در خلاصه
      formErrors.value = data.errors;
      serverErrors.value = Object.values(data.errors).flat();

      toast.add({
        severity: 'warn',
        summary: 'خطای اعتبارسنجی',
        detail: 'لطفاً خطاهای فرم را برطرف کنید.',
        life: 4000,
      });
    } else {
      // 🔑 سایر خطاها (500، 403، خطای شبکه و...)
      const detail = data?.message || 'خطایی در ذخیره کتاب رخ داد. لطفاً دوباره تلاش کنید.';
      serverErrors.value = [detail];

      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail,
        life: 5000,
      });
    }
  } finally {
    saving.value = false;
  }
};

const loadBooks = async () => {
  loading.value = true;
  try {
    const params = searchQuery.value ? { search: searchQuery.value } : {};
    const response = await libraryApi.getBooks(params);
    books.value = response.data.data || [];
  } catch (error) {
    console.error('خطا:', error);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await libraryApi.getCategories();
    categories.value = response.data.data || [];
  } catch (error) {
    console.error('خطا:', error);
  }
};

const getCoverUrl = (book) => {
  if (!book.cover_image) return null;
  const baseUrl = "http://127.0.0.1:8000";
  return `${baseUrl}/storage/${book.cover_image}`;
};



const onCoverChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    coverFile.value = file;
    coverPreview.value = URL.createObjectURL(file);
  }
};



const confirmDeleteBook = (book) => {
  confirm.require({
    message: `آیا از حذف کتاب «${book.title}» اطمینان دارید؟`,
    acceptLabel: 'بله، حذف کن',   // ← این نمایش داده می‌شود
    rejectLabel: 'خیر',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await libraryAdminApi.deleteBook(book.id);
      toast.add({ severity: 'success', summary: 'موفق', detail: 'کتاب حذف شد.', life: 3000 });
      loadBooks();
    },
  });
};

// ========== نسخه‌ها ==========

const openCopiesDialog = async (book) => {
  // دریافت جزئیات به‌روز کتاب (با نسخه‌ها)
  try {
    const response = await libraryApi.getBook(book.id);
    currentBook.value = response.data.data;
  } catch {
    currentBook.value = book;
  }
  copyForm.value = { copy_code: '' };
  copiesDialog.value = true;
};

const addCopy = async () => {
  if (!copyForm.value.copy_code) return;
  savingCopy.value = true;
  try {
    await libraryAdminApi.addCopy(currentBook.value.id, {
      copy_code: copyForm.value.copy_code,
      status: 'available',
    });
    toast.add({ severity: 'success', summary: 'موفق', detail: 'نسخه اضافه شد.', life: 3000 });
    copyForm.value = { copy_code: '' };
    openCopiesDialog(currentBook.value);
    loadBooks();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا.', life: 4000 });
  } finally {
    savingCopy.value = false;
  }
};

const confirmDeleteCopy = (copy) => {
  confirm.require({
    message: `آیا از حذف نسخه «${copy.copy_code}» اطمینان دارید؟`,
    acceptLabel: 'بله، حذف کن',   // ← این نمایش داده می‌شود
    rejectLabel: 'خیر',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await libraryAdminApi.deleteCopy(copy.id);
      toast.add({ severity: 'success', summary: 'موفق', detail: 'نسخه حذف شد.', life: 3000 });
      openCopiesDialog(currentBook.value);
      loadBooks();
    },
  });
};

// ========== دسته‌بندی‌ها ==========

const openCategoriesDialog = () => {
  loadCategories();
  categoriesDialog.value = true;
};

const addCategory = async () => {
  if (!categoryForm.value.name) return;
  try {
    await libraryAdminApi.createCategory(categoryForm.value);
    toast.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی اضافه شد.', life: 3000 });
    categoryForm.value = { name: '', color: '#3b82f6' };
    loadCategories();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در ثبت دسته‌بندی.', life: 4000 });
  }
};

const confirmDeleteCategory = (category) => {
  confirm.require({
    message: `آیا از حذف دسته‌بندی «${category.name}» اطمینان دارید؟`,
    acceptLabel: 'بله، حذف کن',   // ← این نمایش داده می‌شود
    rejectLabel: 'خیر',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await libraryAdminApi.deleteCategory(category.id);
      toast.add({ severity: 'success', summary: 'موفق', detail: 'دسته‌بندی حذف شد.', life: 3000 });
      loadCategories();
    },
  });
};

onMounted(() => {
  loadBooks();
  loadCategories();
});
</script>