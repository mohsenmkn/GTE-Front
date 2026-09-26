<!-- resources/js/Modules/Library/Views/Admin/ManageReservations.vue -->
<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-bookmark text-green-600"></i>
          مدیریت رزروها
        </h1>
        <p class="text-gray-500 mt-1">تایید، تحویل و بازگشت کتاب‌ها</p>
      </div>
    </div>

    <!-- فیلترها -->
    <Card class="shadow-sm mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <div class="relative">
              <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <InputText
                  v-model="filters.search"
                  placeholder="جستجو بر اساس نام کاربر یا موبایل..."
                  class="w-full pr-10"
                  @input="debouncedSearch"
              />
            </div>
          </div>
          <Select
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="همه وضعیت‌ها"
              showClear
              @change="loadReservations(1)"
          />
        </div>
      </template>
    </Card>

    <!-- جدول رزروها -->
    <DataTable
        :value="reservations"
        :loading="loading"
        paginator
        :rows="15"
        stripedRows
        class="shadow-sm"
        emptyMessage="رزروی یافت نشد"
    >
      <Column header="کاربر" style="min-width: 180px">
        <template #body="slotProps">
          <div>
            <div class="font-bold text-gray-800">{{ slotProps.data.user?.name }}</div>
            <div class="text-xs text-gray-500 font-mono" dir="ltr">{{ slotProps.data.user?.mobile }}</div>
          </div>
        </template>
      </Column>

      <Column header="کتاب" style="min-width: 200px">
        <template #body="slotProps">
          <div>
            <div class="font-medium text-gray-800">{{ slotProps.data.book_copy?.book?.title }}</div>
            <div class="text-xs text-gray-500 font-mono" dir="ltr">
              {{ slotProps.data.book_copy?.copy_code }}
            </div>
          </div>
        </template>
      </Column>

      <Column header="تحویل مقرر" style="min-width: 110px">
        <template #body="slotProps">
          <span class="text-sm">{{ formatDate(slotProps.data.expected_pickup_date) }}</span>
        </template>
      </Column>

      <Column header="بازگشت مقرر" style="min-width: 110px">
        <template #body="slotProps">
                    <span
                        class="text-sm"
                        :class="isOverdue(slotProps.data) ? 'text-red-600 font-bold' : ''"
                    >
                        {{ formatDate(slotProps.data.expected_return_date) }}
                    </span>
          <Tag v-if="isOverdue(slotProps.data)" value="تاخیر" severity="danger" class="mr-1" />
        </template>
      </Column>

      <Column header="وضعیت" style="min-width: 140px">
        <template #body="slotProps">
          <Tag
              :value="getReservationStatus(slotProps.data.status).label"
              :severity="getReservationStatus(slotProps.data.status).severity"
              :icon="getReservationStatus(slotProps.data.status).icon"
          />
        </template>
      </Column>

      <Column header="عملیات" style="min-width: 220px" frozen alignFrozen="left">
        <template #body="slotProps">
          <div class="flex gap-2">
            <!-- در انتظار تایید -->
            <template v-if="slotProps.data.status === 'pending'">
              <Button
                  label="تایید"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  @click="approve(slotProps.data)"
              />
              <Button
                  label="رد"
                  icon="pi pi-times"
                  size="small"
                  severity="danger"
                  outlined
                  @click="reject(slotProps.data)"
              />
            </template>

            <!-- تایید شده → تحویل -->
            <Button
                v-else-if="slotProps.data.status === 'approved'"
                label="ثبت تحویل"
                icon="pi pi-send"
                size="small"
                severity="info"
                @click="pickup(slotProps.data)"
            />

            <!-- تحویل داده شده → بازگشت -->
            <Button
                v-else-if="slotProps.data.status === 'picked_up'"
                label="ثبت بازگشت"
                icon="pi pi-undo"
                size="small"
                severity="success"
                @click="returnBook(slotProps.data)"
            />

            <span v-else class="text-gray-400 text-sm">پایان یافته</span>
          </div>
        </template>
      </Column>
    </DataTable>

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
import Select from 'primevue/select';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { libraryAdminApi } from '@/services/libraryAdminApi.js';
import { useLibraryStatus } from '@/composables/useLibraryStatus.js';

const toast = useToast();
const confirm = useConfirm();
const { getReservationStatus } = useLibraryStatus();

const reservations = ref([]);
const loading = ref(false);
const filters = ref({ search: '', status: null });

const statusOptions = [
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'تحویل داده شده', value: 'picked_up' },
  { label: 'بازگشت داده شده', value: 'returned' },
  { label: 'لغو شده', value: 'cancelled' },
  { label: 'منقضی شده', value: 'expired' },
];

let searchTimeout = null;

const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadReservations(1), 400);
};

const loadReservations = async (page = 1) => {
  loading.value = true;
  try {
    const params = { page };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.status) params.status = filters.value.status;

    const response = await libraryAdminApi.getReservations(params);
    reservations.value = response.data.data || [];
  } catch (error) {
    console.error('خطا:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fa-IR');
};

const isOverdue = (reservation) => {
  if (reservation.status !== 'picked_up') return false;
  return new Date(reservation.expected_return_date) < new Date();
};

const approve = (reservation) => {
  confirm.require({
    message: `رزرو کتاب «${reservation.book_copy?.book?.title}» برای ${reservation.user?.name} تایید شود؟`,
    header: 'تایید رزرو',
    icon: 'pi pi-check-circle',
    accept: async () => {
      try {
        await libraryAdminApi.approveReservation(reservation.id);
        toast.add({ severity: 'success', summary: 'موفق', detail: 'رزرو تایید شد و پیامک ارسال گردید.', life: 3000 });
        loadReservations();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا.', life: 4000 });
      }
    },
  });
};

const reject = (reservation) => {
  confirm.require({
    message: `رزرو کتاب «${reservation.book_copy?.book?.title}» رد شود؟`,
    header: 'رد رزرو',
    icon: 'pi pi-times-circle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await libraryAdminApi.rejectReservation(reservation.id);
        toast.add({ severity: 'success', summary: 'موفق', detail: 'رزرو رد شد.', life: 3000 });
        loadReservations();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا.', life: 4000 });
      }
    },
  });
};

const pickup = (reservation) => {
  confirm.require({
    message: `تحویل کتاب «${reservation.book_copy?.book?.title}» به ${reservation.user?.name} ثبت شود؟`,
    header: 'ثبت تحویل',
    icon: 'pi pi-send',
    accept: async () => {
      try {
        await libraryAdminApi.pickupReservation(reservation.id);
        toast.add({ severity: 'success', summary: 'موفق', detail: 'تحویل ثبت شد. دوره امانت آغاز شد.', life: 3000 });
        loadReservations();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا.', life: 4000 });
      }
    },
  });
};

const returnBook = (reservation) => {
  confirm.require({
    message: `بازگشت کتاب «${reservation.book_copy?.book?.title}» ثبت شود؟`,
    header: 'ثبت بازگشت',
    icon: 'pi pi-undo',
    accept: async () => {
      try {
        await libraryAdminApi.returnReservation(reservation.id);
        toast.add({ severity: 'success', summary: 'موفق', detail: 'بازگشت ثبت شد و نسخه آزاد گردید.', life: 3000 });
        loadReservations();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'خطا', detail: error.response?.data?.message || 'خطا.', life: 4000 });
      }
    },
  });
};

onMounted(() => {
  loadReservations();
});
</script>