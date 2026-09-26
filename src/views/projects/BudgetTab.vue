<template>
  <div  class="budget-management">
    <!-- Header Toolbar -->
    <div class="toolbar">
      <Button
          v-if="canCreateBudget"
          label="بودجه جدید"
          icon="pi pi-plus"
          @click="openCreateDialog"
          severity="success"
          size="small"
      />

      <div class="filters">
        <Select
            v-model="filters.type"
            :options="budgetTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="نوع بودجه"
            class="filter-dropdown"
            @change="onFilterChange"
            showClear
        />

        <Select
            v-model="filters.fiscal_year"
            :options="fiscalYears"
            placeholder="سال مالی"
            class="filter-dropdown"
            @change="onFilterChange"
            showClear
        />

        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText
              v-model="filters.search"
              placeholder="جستجو..."
              @input="debouncedSearch"
          />
        </IconField>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card total">
        <i class="pi pi-wallet"></i>
        <div class="card-content">
          <span class="card-label">کل بودجه</span>
          <span class="card-value">{{ formatMoney(summary.total) }}</span>
        </div>
      </div>

      <div class="summary-card spent">
        <i class="pi pi-chart-line"></i>
        <div class="card-content">
          <span class="card-label">مصرف شده</span>
          <span class="card-value">{{ formatMoney(summary.spent) }}</span>
        </div>
      </div>

      <div class="summary-card remaining">
        <i class="pi pi-money-bill"></i>
        <div class="card-content">
          <span class="card-label">باقی‌مانده</span>
          <span class="card-value">{{ formatMoney(summary.remaining) }}</span>
        </div>
      </div>

      <div class="summary-card percentage">
        <i class="pi pi-percentage"></i>
        <div class="card-content">
          <span class="card-label">درصد مصرف</span>
          <span class="card-value">{{ summary.percentage }}%</span>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
        :value="budgets"
        :loading="loading"
        :lazy="true"
        :totalRecords="totalRecords"
        :rows="lazyParams.rows"
        :first="lazyParams.first"
        @page="onPage"
        stripedRows
        rowHover
        paginator
        :rowsPerPageOptions="[10, 25, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="نمایش {first} تا {last} از {totalRecords} رکورد"
        class="budget-table"
    >
      <Column field="title" header="عنوان" >
        <template #body="{ data }">
          <strong>{{ data.title }}</strong>
        </template>
      </Column>

      <Column field="type" header="نوع" >
        <template #body="{ data }">
          <Tag :value="getBudgetTypeLabel(data.type)" :severity="getBudgetTypeSeverity(data.type)" />
        </template>
      </Column>

      <Column field="fiscal_year" header="سال مالی"  />

      <Column field="amount" header="مبلغ (ریال)"    >
        <template #body="{ data }">
          {{ formatMoney(data.amount) }}
        </template>
      </Column>

      <Column header="مصرف شده">
        <template #body="{ data }">
          {{ formatMoney(data.spent || 0) }}
        </template>
      </Column>

      <Column header="باقی‌مانده">
        <template #body="{ data }">
          <span :class="getRemainingClass(data)">
            {{ formatMoney(calculateRemaining(data)) }}
          </span>
        </template>
      </Column>

      <Column header="پیشرفت">
        <template #body="{ data }">
          <ProgressBar
              :value="calculateProgress(data)"
              :showValue="true"
              :class="getProgressClass(data)"
          >
            <template #default="{ value }">
              {{ value }}%
            </template>
          </ProgressBar>
        </template>
      </Column>

      <Column header="عملیات" :frozen="true" alignFrozen="left">
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
                v-if="canUpdateBudget"
                icon="pi pi-pencil"
                text
                rounded
                severity="info"
                @click="editBudget(data.id)"
            />
            <Button
                v-if="canDeleteBudget"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <BudgetForm
      v-model:visible="dialogVisible"
      :project-id="projectId"
      :budget-id="editingBudgetId"
      @saved="onFormSuccess"
  />

  <!-- Delete Confirmation -->
  <ConfirmDialog />
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import BudgetForm from './BudgetForm.vue';
import api from "@/api/axios.js";
import budgetService from "@/services/budgetService.js";
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const confirm = useConfirm();
const toast = useToast();

// State
const budgets = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const totalRecords = ref(0);
const editingBudgetId = ref(null);

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdateBudget = computed(() => can('budget.update'))
const canDeleteBudget = computed(() => can('budget.delete'))
const canCreateBudget = computed(() => can('budget.create'))


const filters = reactive({
  type: null,
  fiscal_year: null,
  search: ''
});

const lazyParams = reactive({
  first: 0,
  rows: 10,
  sortField: null,
  sortOrder: null
});

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
});

const budgetTypes = [
  { label: 'اولیه', value: 'initial' },
  { label: 'تجدیدنظر', value: 'revised' },
  { label: 'اضطراری', value: 'contingency' }
];

const fiscalYears = computed(() => {
  const currentYear = 1405;
  return Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());
});

// Summary computed
const summary = computed(() => {
  const total = budgets.value.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const spent = budgets.value.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);
  const remaining = total - spent;
  const percentage = total > 0 ? Math.round((spent / total) * 100) : 0;

  return { total, spent, remaining, percentage };
});

// ✅ اصلاح ۱: تابع جداگانه برای تغییر فیلترها
const onFilterChange = () => {
  lazyParams.first = 0; // ریست کردن صفحه به اول
  loadBudgets();
};

// ✅ اصلاح ۲: تابع loadBudgets با مدیریت بهتر null
const loadBudgets = async () => {
  loading.value = true;
  try {
    // حذف فیلدهای null یا undefined از پارامترها
    const params = {
      page: Math.floor(lazyParams.first / lazyParams.rows) + 1,
      project_id: props.projectId,
      per_page: lazyParams.rows,
      sort_by: lazyParams.sortField,
      sort_order: lazyParams.sortOrder === 1 ? 'asc' : 'desc'
    };

    // فقط فیلدهایی که مقدار دارند را اضافه کن
    if (filters.type) params.type = filters.type;
    if (filters.fiscal_year) params.fiscal_year = filters.fiscal_year;
    if (filters.search) params.search = filters.search;

    const { data } = await budgetService.getAll(params);
    budgets.value = data.data;
    totalRecords.value = data.total;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات با خطا مواجه شد',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// ✅ اصلاح ۳: استفاده از watch برای تغییرات فیلترها (به جای debounced جداگانه)
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    lazyParams.first = 0;
    loadBudgets();
  }, 500);
};

// ✅ اصلاح ۴: واتچ برای تغییرات lazyParams (به جز first که خودش handle می‌شود)
watch(
    () => ({ ...lazyParams }),
    (newVal, oldVal) => {
      // اگر تغییر مربوط به first نبود، بارگذاری مجدد
      if (newVal.first !== oldVal.first) return;
      if (newVal.rows !== oldVal.rows ||
          newVal.sortField !== oldVal.sortField ||
          newVal.sortOrder !== oldVal.sortOrder) {
        loadBudgets();
      }
    },
    { deep: true }
);

const onPage = (event) => {
  lazyParams.first = event.first;
  lazyParams.rows = event.rows;
  loadBudgets();
};

// const onSort = (event) => {
//   lazyParams.sortField = event.sortField;
//   lazyParams.sortOrder = event.sortOrder;
//   lazyParams.first = 0; // ریست به صفحه اول هنگام سورت
//   console.log(lazyParams.sortField, lazyParams.sortOrder)
//   loadBudgets();
// };

const selectedBudgetId = ref(null);

const openCreateDialog = () => {
  selectedBudgetId.value = null;
  editingBudgetId.value = null;
  dialogVisible.value = true;
};

const editBudget = (id) => {
  selectedBudgetId.value = id;
  editingBudgetId.value = id;
  dialogVisible.value = true;
};

const onFormSuccess = () => {
  dialogVisible.value = false;
  loadBudgets();
};

const confirmDelete = (budget) => {
  confirm.require({
    message: `آیا از حذف بودجه "${budget.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: () => deleteBudget(budget.id)
  });
};

const deleteBudget = async (id) => {
  try {
    await api.delete(`/budgets/${id}`);
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'بودجه با موفقیت حذف شد',
      life: 3000
    });
    await loadBudgets();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'حذف بودجه با خطا مواجه شد',
      life: 3000
    });
  }
};

// Helpers
const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0);
};

const calculateRemaining = (budget) => {
  return parseFloat(budget.amount || 0) - parseFloat(budget.spent || 0);
};

const calculateProgress = (budget) => {
  const amount = parseFloat(budget.amount || 0);
  const spent = parseFloat(budget.spent || 0);
  return amount > 0 ? Math.round((spent / amount) * 100) : 0;
};

const getRemainingClass = (budget) => {
  const remaining = calculateRemaining(budget);
  if (remaining < 0) return 'text-red-600 font-bold';
  if (remaining < budget.amount * 0.2) return 'text-orange-500';
  return 'text-green-600';
};

const getProgressClass = (budget) => {
  const progress = calculateProgress(budget);
  if (progress >= 90) return 'progress-danger';
  if (progress >= 70) return 'progress-warning';
  return 'progress-success';
};

const getBudgetTypeLabel = (type) => {
  const typeMap = {
    initial: 'اولیه',
    revised: 'تجدیدنظر',
    contingency: 'اضطراری'
  };
  return typeMap[type] || type;
};

const getBudgetTypeSeverity = (type) => {
  const severityMap = {
    initial: 'success',
    revised: 'info',
    contingency: 'warning'
  };
  return severityMap[type] || 'secondary';
};

const onBudgetSaved = () => {
  loadBudgets();
  dialogVisible.value = false;
};

onMounted(() => {
  loadBudgets();
});
</script>

<style scoped>

.budget-management {
  padding: 1.5rem;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.filters {
  display: contents;
  flex: 1;
  gap: 0.74rem;
}

.filter-dropdown{
  /*max-width: 140px;*/
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-right: 4px solid;
}

.summary-card.total { border-right-color: #3b82f6; }
.summary-card.spent { border-right-color: #ef4444; }
.summary-card.remaining { border-right-color: #22c55e; }
.summary-card.percentage { border-right-color: #f59e0b; }

.summary-card i {
  font-size: 1.75rem;
  opacity: 0.7;
}

.summary-card.total i { color: #3b82f6; }
.summary-card.spent i { color: #ef4444; }
.summary-card.remaining i { color: #22c55e; }
.summary-card.percentage i { color: #f59e0b; }

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.card-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

/* Table */
.budget-table {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

/* Progress Colors */
:deep(.progress-success .p-progressbar-value) {
  background: #22c55e;
}

:deep(.progress-warning .p-progressbar-value) {
  background: #f59e0b;
}

:deep(.progress-danger .p-progressbar-value) {
  background: #ef4444;
}

/* Responsive */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filters {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>