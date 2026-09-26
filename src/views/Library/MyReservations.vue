<!-- resources/js/Modules/Library/Views/MyReservations.vue -->
<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-bookmark text-blue-600"></i>
          رزروهای من
        </h1>
        <p class="text-gray-500 mt-1">مدیریت رزروهای کتاب شما</p>
      </div>
      <Button
          label="مشاهده کتابخانه"
          icon="pi pi-book"
          severity="secondary"
          outlined
          @click="$router.push('/library')"
      />
    </div>

    <!-- فیلتر وضعیت -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <Button
          v-for="(status, key) in filterOptions"
          :key="key"
          :label="status.label"
          :severity="activeFilter === key ? 'primary' : 'secondary'"
          :outlined="activeFilter !== key"
          size="small"
          @click="setFilter(key)"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <div v-else-if="reservations.length > 0" class="space-y-4">
      <Card
          v-for="reservation in reservations"
          :key="reservation.id"
          class="shadow-sm"
      >
        <template #content>
          <div class="flex flex-col md:flex-row gap-4">
            <!-- تصویر کتاب -->
            <div class="w-20 h-28 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                  v-if="getCoverUrl(reservation)"
                  :src="getCoverUrl(reservation)"
                  class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-book text-3xl text-blue-300"></i>
            </div>

            <!-- اطلاعات -->
            <div class="flex-1">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 class="font-bold text-gray-800">
                    {{ reservation.book_copy?.book?.title }}
                  </h3>
                  <p class="text-sm text-gray-500">
                    {{ reservation.book_copy?.book?.author }}
                  </p>
                </div>
                <Tag
                    :value="getReservationStatus(reservation.status).label"
                    :severity="getReservationStatus(reservation.status).severity"
                    :icon="getReservationStatus(reservation.status).icon"
                />
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div class="text-sm">
                  <div class="text-gray-500 text-xs">تاریخ رزرو</div>
                  <div class="font-medium">{{ formatDate(reservation.reservation_date) }}</div>
                </div>
                <div class="text-sm">
                  <div class="text-gray-500 text-xs">تحویل مقرر</div>
                  <div class="font-medium">{{ formatDate(reservation.expected_pickup_date) }}</div>
                </div>
                <div class="text-sm">
                  <div class="text-gray-500 text-xs">بازگشت مقرر</div>
                  <div class="font-medium" :class="isOverdue(reservation) ? 'text-red-600 font-bold' : ''">
                    {{ formatDate(reservation.expected_return_date) }}
                  </div>
                </div>
                <div class="text-sm">
                  <div class="text-gray-500 text-xs">کد نسخه</div>
                  <div class="font-mono" dir="ltr">{{ reservation.book_copy?.copy_code }}</div>
                </div>
              </div>

              <!-- اخطار سررسید -->
              <Message
                  v-if="isOverdue(reservation)"
                  severity="error"
                  :closable="false"
                  class="mt-3"
              >
                مهلت بازگشت این کتاب به پایان رسیده است. لطفاً در اسرع وقت به کتابخانه مراجعه کنید.
              </Message>
            </div>

            <!-- عملیات -->
            <div class="flex md:flex-col gap-2 justify-end">
              <Button
                  v-if="isCancellable(reservation.status)"
                  label="لغو رزرو"
                  icon="pi pi-times"
                  severity="danger"
                  outlined
                  size="small"
                  @click="confirmCancel(reservation)"
              />
              <Button
                  label="جزئیات کتاب"
                  icon="pi pi-eye"
                  severity="secondary"
                  text
                  size="small"
                  @click="$router.push(`/library/books/${reservation.book_copy?.book?.id}`)"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- حالت خالی -->
    <div v-else class="text-center py-20">
      <i class="pi pi-bookmark text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg mb-4">هنوز رزروی ثبت نکرده‌اید</p>
      <Button
          label="مشاهده کتاب‌ها"
          icon="pi pi-book"
          @click="$router.push('/library')"
      />
    </div>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { libraryApi } from '@/services/libraryApi.js';
import { useLibraryStatus } from '@/composables/useLibraryStatus.js';

const toast = useToast();
const confirm = useConfirm();
const { getReservationStatus, isCancellable } = useLibraryStatus();

const reservations = ref([]);
const loading = ref(false);
const activeFilter = ref('all');

const filterOptions = {
  all: { label: 'همه' },
  active: { label: 'فعال' },
  returned: { label: 'بازگشت داده شده' },
  cancelled: { label: 'لغو/منقضی' },
};

const setFilter = (key) => {
  activeFilter.value = key;
  loadReservations();
};

const loadReservations = async () => {
  loading.value = true;
  try {
    let status = null;
    if (activeFilter.value === 'active') {
      // فیلتر سمت کلاینت برای چند وضعیت
      status = null;
    }

    const response = await libraryApi.getMyReservations(status);
    let data = response.data.data || [];

    // فیلتر سمت کلاینت
    if (activeFilter.value === 'active') {
      data = data.filter(r => ['pending', 'approved', 'picked_up'].includes(r.status));
    } else if (activeFilter.value === 'returned') {
      data = data.filter(r => r.status === 'returned');
    } else if (activeFilter.value === 'cancelled') {
      data = data.filter(r => ['cancelled', 'expired'].includes(r.status));
    }

    reservations.value = data;
  } catch (error) {
    console.error('خطا در دریافت رزروها:', error);
  } finally {
    loading.value = false;
  }
};

const getCoverUrl = (reservation) => {
  const image = reservation.book_copy?.book?.cover_image;
  if (!image) return null;
  const baseUrl = "http://127.0.0.1:8000" || window.location.origin;
  return `${baseUrl}/storage/${image}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fa-IR');
};

const isOverdue = (reservation) => {
  if (reservation.status !== 'picked_up') return false;
  return new Date(reservation.expected_return_date) < new Date();
};

const confirmCancel = (reservation) => {
  confirm.require({
    message: `آیا از لغو رزرو کتاب «${reservation.book_copy?.book?.title}» اطمینان دارید؟`,
    header: 'تایید لغو رزرو',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، لغو کن',
    rejectLabel: 'خیر',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await libraryApi.cancelReservation(reservation.id);
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'رزرو با موفقیت لغو شد.',
          life: 3000,
        });
        loadReservations();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'خطا در لغو رزرو.',
          life: 4000,
        });
      }
    },
  });
};

onMounted(() => {
  loadReservations();
});
</script>