<!-- resources/js/Modules/Library/Views/Admin/LibraryDashboard.vue -->
<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <i class="pi pi-chart-bar text-purple-600"></i>
          داشبورد کتابخانه
        </h1>
        <p class="text-gray-500 mt-1">نمای کلی وضعیت کتابخانه</p>
      </div>
      <Button
          label="بروزرسانی"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="loading"
          @click="loadStatistics"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- کارت‌های آمار اصلی -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
            icon="pi pi-book"
            label="کل کتاب‌ها"
            :value="stats.total_books"
            color="blue"
        />
        <StatCard
            icon="pi pi-copy"
            label="کل نسخه‌ها"
            :value="stats.total_copies"
            color="purple"
        />
        <StatCard
            icon="pi pi-check-circle"
            label="نسخه‌های موجود"
            :value="stats.available_copies"
            color="green"
        />
        <StatCard
            icon="pi pi-send"
            label="امانت داده شده"
            :value="stats.lent_copies"
            color="orange"
        />
      </div>

      <!-- کارت‌های رزرو -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i class="pi pi-clock text-yellow-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.pending_reservations }}</div>
              <div class="text-sm text-gray-500">در انتظار تایید</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i class="pi pi-bookmark text-blue-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-gray-800">{{ stats.active_reservations }}</div>
              <div class="text-sm text-gray-500">رزروهای فعال</div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <i class="pi pi-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-700">{{ stats.overdue_reservations }}</div>
              <div class="text-sm text-gray-500">تاخیر در بازگشت</div>
            </div>
          </div>
        </div>
      </div>

      <!-- نمودار وضعیت نسخه‌ها -->
      <Card class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie text-purple-600"></i>
            <span>توزیع وضعیت نسخه‌ها</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <DistributionBar
                label="موجود"
                :value="stats.available_copies"
                :total="stats.total_copies"
                color="bg-green-500"
            />
            <DistributionBar
                label="امانت داده شده"
                :value="stats.lent_copies"
                :total="stats.total_copies"
                color="bg-orange-500"
            />
            <DistributionBar
                label="رزرو شده"
                :value="stats.reserved_copies"
                :total="stats.total_copies"
                color="bg-blue-500"
            />
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import StatCard from './StatCard.vue';
import DistributionBar from './DistributionBar.vue';
import { libraryAdminApi } from '@/services/libraryAdminApi.js';

const loading = ref(false);
const stats = reactive({
  total_books: 0,
  total_copies: 0,
  available_copies: 0,
  lent_copies: 0,
  reserved_copies: 0,
  active_reservations: 0,
  pending_reservations: 0,
  overdue_reservations: 0,
});

const loadStatistics = async () => {
  loading.value = true;
  try {
    const response = await libraryAdminApi.getStatistics();
    Object.assign(stats, response.data.data);
  } catch (error) {
    console.error('خطا در دریافت آمار:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStatistics();
});
</script>