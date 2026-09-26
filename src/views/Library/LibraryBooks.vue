<!-- resources/js/Modules/Library/Views/LibraryBooks.vue -->
<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-book text-blue-600"></i>
          کتابخانه گهرترابر
        </h1>
        <p class="text-gray-500 mt-1">مشاهده و رزرو کتاب‌های کتابخانه شرکت</p>
      </div>
      <div class="flex gap-2">
        <Button
            label="رزروهای من"
            icon="pi pi-bookmark"
            severity="secondary"
            outlined
            @click="$router.push('/library/my-reservations')"
        />
      </div>
    </div>

    <!-- جستجو و فیلتر -->
    <Card class="shadow-sm mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">جستجو</label>
            <div class="relative">
              <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <InputText
                  v-model="filters.search"
                  placeholder="جستجو بر اساس عنوان، نویسنده یا شابک..."
                  class="w-full pr-10"
                  @input="debouncedSearch"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
            <Select
                v-model="filters.category_id"
                :options="categories"
                optionLabel="name"
                optionValue="id"
                placeholder="همه دسته‌ها"
                class="w-full"
                showClear
                @change="loadBooks(1)"
            />
          </div>

          <div class="flex items-end">
            <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg w-full cursor-pointer hover:bg-gray-50" @click="toggleAvailability">
              <input
                  type="checkbox"
                  v-model="filters.onlyAvailable"
                  class="w-4 h-4 text-blue-600 rounded"
                  @change="loadBooks(1)"
              />
              <span class="text-sm text-gray-700">فقط کتاب‌های موجود</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- لیست کتاب‌ها -->
    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else-if="books.length > 0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
            v-for="book in books"
            :key="book.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
            @click="openBook(book.id)"
        >
          <!-- تصویر جلد -->
          <div class="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
            <img
                v-if="getCoverUrl(book)"
                :src="getCoverUrl(book)"
                :alt="book.title"
                class="w-full h-full object-cover"
            />
            <i v-else class="pi pi-book text-6xl text-blue-300"></i>
          </div>

          <!-- اطلاعات -->
          <div class="p-4">
            <h3 class="font-bold text-gray-800 mb-1 line-clamp-1">{{ book.title }}</h3>
            <p class="text-sm text-gray-500 mb-3 line-clamp-1">{{ book.author }}</p>

            <div class="flex items-center justify-between">
              <Tag
                  v-if="book.category"
                  :value="book.category.name"
                  severity="info"
                  class="text-xs"
              />
              <Badge
                  :value="getAvailabilityLabel(book)"
                  :severity="getAvailabilitySeverity(book)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- صفحه‌بندی -->
      <div class="flex justify-center mt-6">
        <Paginator
            :rows="meta.per_page"
            :totalRecords="meta.total"
            :first="(meta.current_page - 1) * meta.per_page"
            @page="onPage"
            template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="صفحه {currentPage} از {totalPages}"
        />
      </div>
    </div>

    <!-- حالت خالی -->
    <div v-else class="text-center py-20">
      <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">کتابی یافت نشد</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Badge from 'primevue/badge';
import ProgressSpinner from 'primevue/progressspinner';
import Paginator from 'primevue/paginator';
import { libraryApi } from '@/services/libraryApi.js';

const router = useRouter();

const books = ref([]);
const categories = ref([]);
const loading = ref(false);

const filters = reactive({
  search: '',
  category_id: null,
  onlyAvailable: false,
});

const meta = reactive({
  current_page: 1,
  total: 0,
  per_page: 20,
  last_page: 1,
});

let searchTimeout = null;

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadBooks(1), 400);
};

const toggleAvailability = () => {
  filters.onlyAvailable = !filters.onlyAvailable;
  loadBooks(1);
};

const loadBooks = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (filters.search) params.search = filters.search;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.onlyAvailable) params.availability = 'available';

    const response = await libraryApi.getBooks(params);
    books.value = response.data.data || [];

    if (response.data.meta) {
      Object.assign(meta, response.data.meta);
    }
  } catch (error) {
    console.error('خطا در دریافت کتاب‌ها:', error);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await libraryApi.getCategories();
    categories.value = response.data.data || [];
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی‌ها:', error);
  }
};

const onPage = (event) => {
  loadBooks(event.page + 1);
};

const openBook = (id) => {
  router.push(`/library/books/${id}`);
};

const getCoverUrl = (book) => {
  if (!book.cover_image) return null;
  const baseUrl = "http://127.0.0.1:8000";
  return `${baseUrl}/storage/${book.cover_image}`;
};

const getAvailabilityLabel = (book) => {
  const count = book.available_copies_count ?? 0;
  return count > 0 ? `${count} نسخه موجود` : 'ناموجود';
};

const getAvailabilitySeverity = (book) => {
  return (book.available_copies_count ?? 0) > 0 ? 'success' : 'danger';
};

onMounted(() => {
  loadBooks();
  loadCategories();
});
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>