<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto">
    <!-- هدر -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <i class="pi pi-users text-primary"></i>
          مدیریت تردد پرسنل
        </h1>
        <p class="text-gray-500 mt-1">مشاهده و بررسی تردد تمام پرسنل</p>
      </div>
    </div>

    <!-- جستجو -->
    <Card class="shadow-md mb-6">
      <template #content>
        <div class="flex flex-col md:flex-row gap-4">
          <InputText v-model="searchQuery" placeholder="جستجو با نام، کد پرسنلی یا کد ملی..." class="flex-1" @keyup.enter="searchEmployees" :disabled="loading" />
          <Button label="جستجو" icon="pi pi-search" :loading="loading" @click="searchEmployees" />
          <Button v-if="employees.length > 0" label="پاک کردن" icon="pi pi-times" severity="secondary" outlined @click="clearSearch" />
        </div>
      </template>
    </Card>

    <!-- پیام راهنما -->
    <div v-if="!hasSearched && !loading" class="text-center py-20">
      <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg mb-2">برای مشاهده اطلاعات پرسنل، جستجو کنید</p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-20"><ProgressSpinner /></div>
    <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

    <!-- جدول پرسنل -->
    <div v-if="hasSearched && !loading">
      <DataTable v-if="employees.length > 0" :value="employees" paginator :rows="15" :rowsPerPageOptions="[10, 15, 25, 50]" class="shadow-md" emptyMessage="پرسنلی یافت نشد">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold">نتایج جستجو ({{ totalEmployees }} نفر)</span>
          </div>
        </template>

        <Column field="personnel_code" header="کد پرسنلی" sortable style="width: 100px">
          <template #body="slotProps"><Badge :value="slotProps.data.personnel_code" severity="secondary" /></template>
        </Column>
        <Column field="employee_name" header="نام و نام خانوادگی" sortable>
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <Avatar :label="slotProps.data.employee_name.charAt(0)" shape="circle" size="small" class="bg-primary text-white" />
              <span class="font-medium">{{ slotProps.data.employee_name }}</span>
            </div>
          </template>
        </Column>
        <Column field="national_code" header="کد ملی" sortable style="width: 120px" />

        <!-- ✅ اصلاح ستون‌ها بر اساس ساختار بک‌اند -->
        <Column header="حضور" sortable style="width: 80px">
          <template #body="slotProps"><span class="text-green-700 font-bold">{{ slotProps.data.summary.presenceDays }}</span></template>
        </Column>
        <Column header="غیبت" sortable style="width: 80px">
          <template #body="slotProps"><span class="text-red-700 font-bold">{{ slotProps.data.summary.absenceDays }}</span></template>
        </Column>
        <Column header="مرخصی" sortable style="width: 80px">
          <template #body="slotProps"><span class="text-orange-700 font-bold">{{ slotProps.data.summary.leaveDays }}</span></template>
        </Column>
        <Column header="مأموریت" sortable style="width: 80px">
          <template #body="slotProps"><span class="text-blue-700 font-bold">{{ slotProps.data.summary.missionDays }}</span></template>
        </Column>
        <Column header="اضافه کاری" sortable style="width: 100px">
          <template #body="slotProps"><span class="font-mono text-green-700">{{ formatMinutes(slotProps.data.summary.totalOvertimeMinutes) }}</span></template>
        </Column>
        <Column header="کسر حضور" sortable style="width: 100px">
          <template #body="slotProps"><span class="font-mono text-red-700">{{ formatMinutes(slotProps.data.summary.totalShortageMinutes) }}</span></template>
        </Column>
        <Column header="نرخ حضور" sortable style="width: 150px">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <ProgressBar :value="slotProps.data.summary.attendanceRate" :showValue="false" style="width: 80px; height: 6px" />
              <span class="text-sm font-bold" :class="rateClass(slotProps.data.summary.attendanceRate)">{{ slotProps.data.summary.attendanceRate }}%</span>
            </div>
          </template>
        </Column>
        <Column header="عملیات" style="width: 120px">
          <template #body="slotProps"><Button label="جزئیات" icon="pi pi-eye" size="small" @click="viewDailyDetails(slotProps.data)" /></template>
        </Column>
      </DataTable>
      <div v-else class="text-center py-20">
        <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">پرسنلی با این مشخصات یافت نشد</p>
      </div>
    </div>

    <!-- ✅ دیالوگ جزئیات (حذف لایه تودرتو) -->
    <Dialog v-model:visible="showDailyDialog" :header="`جزئیات تردد - ${selectedEmployee?.employee_name}`" :style="{ width: '95vw', maxWidth: '1200px' }" modal :maximizable="true">
      <div v-if="dailyDetails.length > 0">
        <div class="mb-4 flex items-center gap-3">
          <label class="text-gray-600 font-medium">انتخاب ماه:</label>
          <Select v-model="selectedMonth" :options="availableMonths" optionLabel="label" optionValue="value" placeholder="یک ماه انتخاب کنید" class="w-48" @change="onMonthChange" />
        </div>

        <Card class="shadow-sm mb-4">
          <template #content>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div class="bg-green-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-700">{{ selectedSummary?.presenceDays }}</div>
                <div class="text-xs text-gray-600">روز حضور</div>
              </div>
              <div class="bg-red-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-red-700">{{ selectedSummary?.absenceDays }}</div>
                <div class="text-xs text-gray-600">روز غیبت</div>
              </div>
              <div class="bg-purple-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-700">{{ formatMinutes(selectedSummary?.totalOvertimeMinutes) }}</div>
                <div class="text-xs text-gray-600">اضافه کاری</div>
              </div>
              <div class="bg-orange-50 p-3 rounded-lg text-center">
                <div class="text-2xl font-bold text-orange-700">{{ formatMinutes(selectedSummary?.totalShortageMinutes) }}</div>
                <div class="text-xs text-gray-600">کسر حضور</div>
              </div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-gray-700">نرخ حضور</span>
                <span class="text-2xl font-bold" :class="rateClass(selectedSummary?.attendanceRate)">{{ selectedSummary?.attendanceRate }}%</span>
              </div>
              <ProgressBar :value="selectedSummary?.attendanceRate" :showValue="false" style="height: 12px" />
              <div class="flex justify-between text-xs text-gray-600 mt-2">
                <span>روزهای کاری: {{ selectedSummary?.workDays }}</span>
                <span>حضور: {{ selectedSummary?.presenceDays }} / {{ selectedSummary?.workDays }}</span>
              </div>
            </div>
          </template>
        </Card>

        <!-- جدول روزانه -->
        <DataTable :value="dailyDetails" :rows="31" paginator size="small" stripedRows class="text-sm">
          <Column field="date" header="تاریخ" sortable style="width: 100px" />
          <Column field="weekday" header="روز" sortable style="width: 90px" />
          <Column field="first_time" header="ورود" style="width: 80px" />
          <Column field="last_time" header="خروج" style="width: 80px" />
          <Column field="punch_count" header="تردد" style="width: 70px" />
          <Column field="status" header="وضعیت" style="width: 120px">
            <template #body="slotProps"><Tag :value="slotProps.data.status" :severity="statusSeverity(slotProps.data.status)" :icon="statusIcon(slotProps.data.status)" /></template>
          </Column>
          <Column field="required_formatted" header="الزامی" style="width: 90px" />
          <Column field="presence_formatted" header="حضور" style="width: 90px" />
          <Column field="overtime_formatted" header="اضافه" style="width: 90px" />
          <Column field="shortage_formatted" header="کسر" style="width: 90px" />
          <Column field="late_formatted" header="تأخیر" style="width: 90px" />
          <Column field="leave_formatted" header="مرخصی" style="width: 90px" />
          <Column field="mission_formatted" header="مأموریت" style="width: 90px" />
        </DataTable>
      </div>
      <div v-else-if="loadingDaily" class="flex justify-center py-10"><ProgressSpinner /></div>
      <div v-else class="text-center py-10 text-gray-500">
        <i class="pi pi-inbox text-5xl mb-3"></i>
        <p>اطلاعاتی یافت نشد</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/api/axios.js';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button'; // ✅ اصلاح fr om
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Badge from 'primevue/badge';
import Avatar from 'primevue/avatar'; // ✅ اصلاح im port
import ProgressBar from 'primevue/progressbar';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message'; // ✅ اصلاح M essage
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const searchQuery = ref('');
const employees = ref([]); // ✅ اصلاح e mployees
const loading = ref(false);
const loadingDaily = ref(false);
const error = ref(null);
const totalEmployees = ref(0);
const hasSearched = ref(false);

const showDailyDialog = ref(false);
const selectedEmployee = ref(null);
const selectedSummary = ref(null);
const dailyDetails = ref([]);
const availableMonths = ref([]); // ✅ اصلاح availableMont hs
const selectedMonth = ref('');

// ✅ تابع فرمت کردن دقیقه به ساعت
const formatMinutes = (minutes) => {
  if (!minutes) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const loadEmployees = async () => {
  loading.value = true;
  error.value = null;
  hasSearched.value = true;
  try {
    const response = await axios.get('/attendance/employees', {
      params: { search: searchQuery.value }, // ✅ اصلاح par ams
    });
    employees.value = response.data.data || [];
    totalEmployees.value = response.data.meta?.total || 0;
  } catch (err) {
    error.value = err.response?.data?.message || 'خطا در دریافت اطلاعات'; // ✅ اصلاح respons e
    employees.value = [];
  } finally {
    loading.value = false;
  }
};

const searchEmployees = () => {
  if (searchQuery.value.trim()) {
    loadEmployees();
  } else {
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'لطفاً عبارت جستجو را وارد کنید', life: 3000 });
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  employees.value = [];
  hasSearched.value = false;
  totalEmployees.value = 0;
};

const viewDailyDetails = async (employee) => {
  selectedEmployee.value = employee;
  selectedSummary.value = employee.summary;
  showDailyDialog.value = true;
  loadingDaily.value = true;
  dailyDetails.value = [];
  availableMonths.value = [];

  try {
    const monthsResponse = await axios.get(`/attendance/employees/${employee.personnel_code}/months`);
    const months = monthsResponse.data.data || [];
    availableMonths.value = months.map(m => ({ value: m.MonthKey, label: formatMonthLabel(m.MonthKey) }));

    if (availableMonths.value.length > 0) {
      selectedMonth.value = availableMonths.value[0].value;
      await loadDailyDetails(employee.personnel_code, selectedMonth.value);
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات', life: 3000 });
  } finally {
    loadingDaily.value = false;
  }
};

const loadDailyDetails = async (personnelCode, month) => {
  loadingDaily.value = true;
  try {
    const response = await axios.get(`/attendance/employees/${personnelCode}/daily`, { params: { month } });
    dailyDetails.value = response.data.daily || []; // ✅ اصلاح da ta
    if (response.data.summary) selectedSummary.value = response.data.summary;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت جزئیات', life: 3000 });
  } finally {
    loadingDaily.value = false;
  }
};

const onMonthChange = async () => {
  if (selectedMonth.value && selectedEmployee.value) {
    await loadDailyDetails(selectedEmployee.value.personnel_code, selectedMonth.value);
  }
};

const formatMonthLabel = (monthKey) => {
  const monthNames = {
    '01': 'فروردین', '02': 'اردیبهشت', '03': 'خرداد', '04': 'تیر', '05': 'مرداد', '06': 'شهریور',
    '07': 'مهر', '08': 'آبان', '09': 'آذر', '10': 'دی', '11': 'بهمن', '12': 'اسفند', // ✅ اصلاح به من
  };
  const [year, month] = monthKey.split('/');
  return `${monthNames[month] || month} ${year}`;
};

const rateClass = (rate) => {
  if (rate >= 90) return 'text-green-700';
  if (rate >= 75) return 'text-yellow-700';
  return 'text-red-700';
};

const statusSeverity = (status) => {
  const map = { 'حضور': 'success', 'غیبت': 'danger', 'مرخصی': 'warning', 'مأموریت': 'info', 'تعطیل': 'secondary', 'استراحت': 'secondary', 'حضور در تعطیل': 'success', 'بدون ثبت': 'secondary' };
  return map[status] || 'secondary';
};

const statusIcon = (status) => {
  const map = { 'حضور': 'pi pi-check', 'غیبت': 'pi pi-times', 'مرخصی': 'pi pi-calendar', 'مأموریت': 'pi pi-briefcase' };
  return map[status] || '';
};
</script>