<!-- resources/js/Modules/Library/Views/BookDetails.vue -->
<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto">
    <!-- دکمه بازگشت -->
    <Button
        label="بازگشت به کتابخانه"
        icon="pi pi-arrow-right"
        severity="secondary"
        text
        class="mb-4"
        @click="$router.push('/library')"
    />

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else-if="book" class="space-y-6">
      <!-- کارت اصلی کتاب -->
      <Card class="shadow-sm">
        <template #content>
          <div class="flex flex-col md:flex-row gap-6">
            <!-- تصویر جلد -->
            <div class="w-full md:w-56 h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                  v-if="coverUrl"
                  :src="coverUrl"
                  :alt="book.title"
                  class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-book text-7xl text-blue-300"></i>
            </div>

            <!-- اطلاعات -->
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h1 class="text-2xl font-bold text-gray-800 mb-2">{{ book.title }}</h1>
                  <p class="text-gray-600 mb-4">{{ book.author }}</p>
                </div>
                <Tag
                    v-if="book.category"
                    :value="book.category.name"
                    severity="info"
                />
              </div>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">ناشر</div>
                  <div class="font-medium text-gray-800">{{ book.publisher || '-' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">شابک (ISBN)</div>
                  <div class="font-medium text-gray-800 font-mono" dir="ltr">{{ book.isbn || '-' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">سال انتشار</div>
                  <div class="font-medium text-gray-800">{{ book.publish_year || '-' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">تعداد صفحات</div>
                  <div class="font-medium text-gray-800">{{ book.pages || '-' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">زبان</div>
                  <div class="font-medium text-gray-800">{{ book.language || '-' }}</div>
                </div>
                <div class="p-3 bg-gray-50 rounded-lg">
                  <div class="text-xs text-gray-500 mb-1">مترجم</div>
                  <div class="font-medium text-gray-800">{{ book.translator || '-' }}</div>
                </div>
              </div>

              <!-- توضیحات -->
              <div v-if="book.description" class="mb-6">
                <h3 class="font-bold text-gray-700 mb-2">درباره کتاب</h3>
                <p class="text-gray-600 text-sm leading-6">{{ book.description }}</p>
              </div>

              <!-- دکمه رزرو -->
              <div class="flex items-center gap-4">
                <Button
                    v-if="canReserve"
                    label="رزرو این کتاب"
                    icon="pi pi-bookmark"
                    class="bg-blue-600 hover:bg-blue-700"
                    @click="openReserveDialog"
                />
                <Message
                    v-else
                    severity="warn"
                    :closable="false"
                    class="flex-1"
                >
                  {{ reserveBlockReason }}
                </Message>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- نسخه‌های کتاب -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-copy text-blue-600"></i>
            <span>نسخه‌های کتاب</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
                v-for="copy in book.copies"
                :key="copy.id"
                class="p-4 border rounded-xl flex items-center justify-between"
                :class="copy.status === 'available' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'"
            >
              <div>
                <div class="font-mono font-bold text-gray-800" dir="ltr">{{ copy.copy_code }}</div>
                <div class="text-xs text-gray-500 mt-1">{{ copy.condition_note || 'وضعیت سالم' }}</div>
              </div>
              <Tag
                  :value="getCopyStatus(copy.status).label"
                  :severity="getCopyStatus(copy.status).severity"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Dialog رزرو -->
    <Dialog
        v-model:visible="reserveDialog"
        header="رزرو کتاب"
        :style="{ width: '450px' }"
        :modal="true"
    >
      <div class="space-y-4">
        <div class="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <i class="pi pi-info-circle ml-1"></i>
          شما در حال رزرو کتاب «{{ book?.title }}» هستید.
        </div>

        <!-- انتخاب نسخه -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">انتخاب نسخه</label>
          <Select
              v-model="reserveForm.book_copy_id"
              :options="availableCopies"
              optionLabel="copy_code"
              optionValue="id"
              placeholder="یک نسخه انتخاب کنید"
              class="w-full"
          />
        </div>

        <!-- تاریخ تحویل -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-700">
            تاریخ مراجعه برای تحویل <span class="text-red-500">*</span>
          </label>
          <VuePersianDateTimePicker
              v-model="reserveForm.pickupDate"
              type="date"
              format="YYYY/MM/DD"
              display-format="jYYYY/jMM/jDD"
              placeholder="انتخاب تاریخ"
              input-class="w-full p-3 border border-gray-300 rounded-lg text-right"
              :min-date="minPickupDate"
              :editable="false"
              :auto-submit="false"
          />
          <small class="text-gray-500">
            پس از تایید مدیر، در این تاریخ به کتابخانه مراجعه کنید.
          </small>
        </div>

        <Message v-if="reserveError" severity="error" :closable="false">
          {{ reserveError }}
        </Message>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="انصراف" icon="pi pi-times" class="p-button-text" @click="reserveDialog = false" />
          <Button
              label="ثبت رزرو"
              icon="pi pi-check"
              :loading="reserving"
              class="bg-blue-600 hover:bg-blue-700"
              @click="submitReserve"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
//import Badge from 'primevue/badge';
import Message from 'primevue/message';
import Select from 'primevue/select';
//import DatePicker from 'primevue/datepicker';
import VuePersianDateTimePicker from 'vue3-persian-datetime-picker';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { libraryApi } from '@/services/libraryApi.js';
import { useLibraryStatus } from '@/composables/useLibraryStatus.js';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { getCopyStatus } = useLibraryStatus();

const book = ref(null);
const loading = ref(false);
const hasActiveReservation = ref(false);

const reserveDialog = ref(false);
const reserving = ref(false);
const reserveError = ref('');

const reserveForm = ref({
  book_copy_id: null,
  pickupDate: null,
});

const coverUrl = computed(() => {
  if (!book.value?.cover_image) return null;
  const baseUrl = "http://127.0.0.1:8000" ;
  return `${baseUrl}/storage/${book.value.cover_image}`;
});

const availableCopies = computed(() => {
  return (book.value?.copies || []).filter(c => c.status === 'available');
});

const canReserve = computed(() => {
  return availableCopies.value.length > 0 && !hasActiveReservation.value;
});

const reserveBlockReason = computed(() => {
  if (hasActiveReservation.value) {
    return 'شما در حال حاضر یک رزرو فعال دارید. لطفاً ابتدا کتاب فعلی را بازگردانید.';
  }
  if (availableCopies.value.length === 0) {
    return 'متاسفانه هیچ نسخه آزادی از این کتاب موجود نیست.';
  }
  return '';
});

const minPickupDate = computed(() => new Date());

const loadBook = async () => {
  loading.value = true;
  try {
    const response = await libraryApi.getBook(route.params.id);
    book.value = response.data.data;
  } catch (error) {
    console.error('خطا در دریافت کتاب:', error);
  } finally {
    loading.value = false;
  }
};

const checkActiveReservation = async () => {
  try {
    const response = await libraryApi.getMyReservations();
    const reservations = response.data.data || [];
    hasActiveReservation.value = reservations.some(r =>
        ['pending', 'approved', 'picked_up'].includes(r.status)
    );
  } catch (error) {
    console.error('خطا در بررسی رزروها:', error);
  }
};


const openReserveDialog = () => {
  reserveError.value = '';
  reserveForm.value = {
    book_copy_id: availableCopies.value[0]?.id || null,
    pickupDate: null,
  };
  reserveDialog.value = true;
};

const submitReserve = async () => {
  reserveError.value = '';

  if (!reserveForm.value.book_copy_id) {
    reserveError.value = 'لطفاً یک نسخه انتخاب کنید.';
    return;
  }

  if (!reserveForm.value.pickupDate) {
    reserveError.value = 'لطفاً تاریخ مراجعه را انتخاب کنید.';
    return;
  }

  reserving.value = true;
  try {
    // فرمت تاریخ به YYYY-MM-DD
    const date = new Date(reserveForm.value.pickupDate);
    const formattedDate = date.toISOString().split('T')[0];

    await libraryApi.createReservation({
      book_copy_id: reserveForm.value.book_copy_id,
      expected_pickup_date: formattedDate,
    });

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'رزرو با موفقیت ثبت شد. در انتظار تایید مدیر.',
      life: 4000,
    });

    reserveDialog.value = false;
    router.push('/library/my-reservations');
  } catch (error) {
    const errors = error.response?.data?.errors;

    // 🔑 نمایش اولین پیام خطای ولیدیشن (فارسی و واضح)
    reserveError.value = errors
        ? Object.values(errors).flat()[0]
        : (error.response?.data?.message || 'خطا در ثبت رزرو.');
  } finally {
    reserving.value = false;
  }
};

onMounted(() => {
  loadBook();
  checkActiveReservation();
});
</script>

<style>
/*  استایل سفارشی برای DatePicker شمسی */
.vpd-input-wrapper input {
  direction: rtl !important;
  text-align: right !important;
}
</style>