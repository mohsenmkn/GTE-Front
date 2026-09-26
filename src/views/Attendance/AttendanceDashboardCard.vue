<template>
  <div class="space-y-6">
    <!-- عنوان بخش -->
    <div class="flex items-center gap-2 mb-4">
      <i class="pi pi-clock text-primary text-2xl"></i>
      <h2 class="text-xl font-bold text-gray-800">خلاصه تردد پرسنل</h2>
    </div>

    <!-- کارت‌ها -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AttendanceMonthCard
          v-if="currentMonth"
          :summary="currentMonth"
          :loading="loading"
          :error="error"
      />

      <AttendanceMonthCard
          v-if="previousMonth"
          :summary="previousMonth"
          :loading="loading"
          :error="error"
      />
    </div>

    <!-- پیام خطا -->
    <div v-if="error && !currentMonth && !previousMonth" class="text-center py-8 text-red-600">
      <i class="pi pi-exclamation-triangle text-3xl mb-2"></i>
      <p>{{ error }}</p>
    </div>

    <!-- وضعیت بارگذاری -->
    <div v-if="loading && !currentMonth && !previousMonth" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <!-- ✅ جدید: حالت خالی -->
    <div v-if="!loading && !error && !currentMonth && !previousMonth" class="text-center py-8 text-gray-400">
      <i class="pi pi-clock text-4xl mb-3 block"></i>
      <p>اطلاعات ترددی یافت نشد.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';
import AttendanceMonthCard from './AttendanceMonthCard.vue';
import api from "@/api/axios.js";

const loading = ref(false);
const error = ref(null);
const summaries = ref([]);

const currentMonth = computed(() => {
  return summaries.value.find(s => s.month_title === 'ماه جاری') || null;
});

const previousMonth = computed(() => {
  return summaries.value.find(s => s.month_title === 'ماه قبل') || null;
});

const loadAttendance = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/attendance/summary');
    summaries.value = response.data.data || [];
  } catch (err) {
    console.error('Attendance load error:', err);
    error.value = err.response?.data?.message || 'خطا در دریافت اطلاعات تردد';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAttendance();
});
</script>