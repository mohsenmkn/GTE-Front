<!-- resources/js/views/inventory/TransactionList.vue -->
<template>
  <div class="transaction-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-title">
        <i class="pi pi-history text-2xl text-primary" />
        <h1>تراکنش‌های انبار</h1>
        <span class="badge">{{ totalRecords }}</span>
      </div>

      <div class="header-actions">
        <Button
            label="تراکنش جدید"
            icon="pi pi-plus"
            severity="success"
            @click="openCreateDialog"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            @click="loadTransactions"
            v-tooltip.top="'بروزرسانی'"
        />
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="summary-stats">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="pi pi-box" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalTransactions }}</span>
          <span class="stat-label">کل تراکنش‌ها</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="pi pi-arrow-up" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ incomingCount }}</span>
          <span class="stat-label">ورود به انبار</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <i class="pi pi-arrow-down" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ outgoingCount }}</span>
          <span class="stat-label">خروج از انبار</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="pi pi-dollar" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ formatMoney(totalValue) }}</span>
          <span class="stat-label">کل مبلغ</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-box">
          <i class="pi pi-search" />
          <input
              v-model="filters.search"
              placeholder="جستجوی تراکنش..."
              @input="debouncedSearch"
          />
        </div>

        <Select
            v-model="filters.type"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            placeholder="نوع تراکنش"
            class="filter-select"
            @change="applyFilters"
            show-clear
        />

        <Select
            v-model="filters.material_id"
            :options="materials"
            option-label="name"
            option-value="id"
            placeholder="کالا"
            class="filter-select"
            @change="applyFilters"
            filter
            show-clear
        />

        <Select
            v-model="filters.project_id"
            :options="projects"
            option-label="name"
            option-value="id"
            placeholder="پروژه"
            class="filter-select"
            @change="applyFilters"
            filter
            show-clear
        />
      </div>

      <div class="filters-right">
        <div class="date-filters">
          <DatePicker
              v-model="filters.date_from"
              date-format="yy-mm-dd"
              placeholder="از تاریخ"
              class="date-picker"
              @date-select="applyFilters"
              show-icon
          />
          <span class="date-separator">تا</span>
          <DatePicker
              v-model="filters.date_to"
              date-format="yy-mm-dd"
              placeholder="تا تاریخ"
              class="date-picker"
              @date-select="applyFilters"
              show-icon
          />
        </div>
        <Button
            icon="pi pi-filter-slash"
            text
            rounded
            @click="clearFilters"
            v-tooltip.top="'پاک کردن فیلترها'"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="skeleton-row">
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="transactions.length === 0" class="empty-state">
      <i class="pi pi-history text-5xl text-muted-color" />
      <h3>هیچ تراکنشی یافت نشد</h3>
      <p>اولین تراکنش انبار را ثبت کنید</p>
      <Button label="ثبت تراکنش" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Transactions Table -->
    <div v-else class="table-container">
      <DataTable
          :value="transactions"
          stripedRows
          rowHover
          paginator
          :rows="lazyParams.rows"
          :totalRecords="totalRecords"
          :first="lazyParams.first"
          @page="onPage"
          @sort="onSort"
          class="transactions-table"
          sortField="transaction_date"
          :sortOrder="-1"
      >
        <Column field="transaction_date" header="تاریخ" sortable style="min-width: 100px;">
          <template #body="{ data }">
            {{ formatDate(data.transaction_date) }}
          </template>
        </Column>

        <Column field="type" header="نوع تراکنش" style="min-width: 120px;">
          <template #body="{ data }">
            <div class="type-badge" :class="`type-${data.type}`">
              <i :class="data.type_icon" />
              {{ data.type_label }}
            </div>
          </template>
        </Column>

        <Column field="material" header="کالا" style="min-width: 150px;">
          <template #body="{ data }">
            <div class="material-info">
              <span class="material-name">{{ data.material?.name || '-' }}</span>
              <span class="material-code">{{ data.material?.code || '' }}</span>
            </div>
          </template>
        </Column>

        <Column field="quantity" header="تعداد" style="min-width: 100px;">
          <template #body="{ data }">
            <span :class="data.type === 'purchase' || data.type === 'return' ? 'text-green-600' : 'text-red-500'">
              {{ data.type === 'purchase' || data.type === 'return' ? '+' : '-' }}
              {{ data.quantity }} {{ data.material?.unit || '' }}
            </span>
          </template>
        </Column>

        <Column field="unit_price" header="قیمت واحد" style="min-width: 120px;">
          <template #body="{ data }">
            {{ formatMoney(data.unit_price) }}
          </template>
        </Column>

        <Column field="total_price" header="مبلغ کل" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <span class="total-price">{{ formatMoney(data.total_price) }}</span>
          </template>
        </Column>

        <Column field="project" header="پروژه" style="min-width: 120px;">
          <template #body="{ data }">
            {{ data.project?.name || '-' }}
          </template>
        </Column>

        <Column field="wbs_item" header="WBS" style="min-width: 120px;">
          <template #body="{ data }">
            {{ data.wbs_item?.name || '-' }}
          </template>
        </Column>

        <Column field="creator" header="ثبت کننده" style="min-width: 100px;">
          <template #body="{ data }">
            {{ data.creator?.name || '-' }}
          </template>
        </Column>

        <Column header="عملیات" style="min-width: 100px;" :frozen="true" alignFrozen="right">
          <template #body="{ data }">
            <Button
                icon="pi pi-eye"
                text
                rounded
                severity="info"
                size="small"
                @click="viewTransaction(data)"
                v-tooltip.top="'جزئیات'"
            />
            <Button
                v-if="canDelete(data)"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                @click="confirmDelete(data)"
                v-tooltip.top="'حذف'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Transaction Form Dialog -->
    <TransactionForm
        v-model:visible="formDialogVisible"
        :material="selectedMaterial"
        @saved="onFormSuccess"
    />

    <!-- Transaction Detail Dialog -->
    <Dialog
        v-model:visible="detailDialogVisible"
        header="جزئیات تراکنش"
        modal
        :style="{ width: '600px' }"
    >
      <div v-if="selectedTransaction" class="transaction-detail">
        <div class="detail-row">
          <span class="label">تاریخ:</span>
          <span class="value">{{ formatDate(selectedTransaction.transaction_date) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">نوع:</span>
          <span class="value">
            <span class="type-badge" :class="`type-${selectedTransaction.type}`">
              <i :class="selectedTransaction.type_icon" />
              {{ selectedTransaction.type_label }}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="label">کالا:</span>
          <span class="value">{{ selectedTransaction.material?.name }} ({{ selectedTransaction.material?.code }})</span>
        </div>
        <div class="detail-row">
          <span class="label">تعداد:</span>
          <span class="value">{{ selectedTransaction.quantity }} {{ selectedTransaction.material?.unit || '' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">قیمت واحد:</span>
          <span class="value">{{ formatMoney(selectedTransaction.unit_price) }}</span>
        </div>
        <div class="detail-row highlight">
          <span class="label">مبلغ کل:</span>
          <span class="value">{{ formatMoney(selectedTransaction.total_price) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">پروژه:</span>
          <span class="value">{{ selectedTransaction.project?.name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">WBS:</span>
          <span class="value">{{ selectedTransaction.wbs_item?.name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">شماره مرجع:</span>
          <span class="value">{{ selectedTransaction.reference_number || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">توضیحات:</span>
          <span class="value">{{ selectedTransaction.description || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">ثبت کننده:</span>
          <span class="value">{{ selectedTransaction.creator?.name || '-' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">تاریخ ثبت:</span>
          <span class="value">{{ formatDate(selectedTransaction.created_at) }}</span>
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import { projectService } from '@/services/projectService'
import TransactionForm from './TransactionForm.vue'

const confirm = useConfirm()
const toast = useToast()

// ============ State ============
const transactions = ref([])
const materials = ref([])
const projects = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const totalTransactions = ref(0)
const incomingCount = ref(0)
const outgoingCount = ref(0)
const totalValue = ref(0)

const formDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedTransaction = ref(null)
const selectedMaterial = ref(null)

const filters = reactive({
  search: '',
  type: null,
  material_id: null,
  project_id: null,
  date_from: null,
  date_to: null
})

const lazyParams = reactive({
  first: 0,
  rows: 15,
  sortField: 'transaction_date',
  sortOrder: -1
})

const typeOptions = [
  { label: 'همه', value: null },
  { label: 'خرید', value: 'purchase' },
  { label: 'فروش', value: 'sale' },
  { label: 'انتقال', value: 'transfer' },
  { label: 'تعدیل', value: 'adjustment' },
  { label: 'بازگشت', value: 'return' },
  { label: 'ضایعات', value: 'damage' }
]

// ============ Computed ============
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)

// ============ Methods ============
const loadTransactions = async () => {
  loading.value = true
  try {
    const formatDate = (date) => {
      if (!date) return undefined
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
      return date
    }

    const params = {
      page: currentPage.value,
      per_page: lazyParams.rows,
      search: filters.search || undefined,
      type: filters.type || undefined,
      material_id: filters.material_id || undefined,
      project_id: filters.project_id || undefined,
      date_from: formatDate(filters.date_from),
      date_to: formatDate(filters.date_to),
      sort_by: lazyParams.sortField,
      sort_order: lazyParams.sortOrder === 1 ? 'asc' : 'desc'
    }

    const response = await inventoryService.getTransactions(params)
    transactions.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0

    // محاسبه آمار
    totalTransactions.value = transactions.value.length
    incomingCount.value = transactions.value.filter(t =>
        ['purchase', 'return'].includes(t.type)
    ).length
    outgoingCount.value = transactions.value.filter(t =>
        ['sale', 'transfer', 'damage'].includes(t.type)
    ).length
    totalValue.value = transactions.value.reduce((sum, t) => sum + (t.total_price || 0), 0)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری تراکنش‌ها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadMaterials = async () => {
  try {
    const response = await inventoryService.getMaterials({
      status: 'active',
      per_page: 100
    })
    materials.value = response.data.data || []
  } catch (error) {
    console.error('Error loading materials:', error)
  }
}

const loadProjects = async () => {
  try {
    const response = await projectService.list({ all: 1 })
    projects.value = response.data.data || []
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

const applyFilters = () => {
  lazyParams.first = 0
  loadTransactions()
}

const clearFilters = () => {
  filters.search = ''
  filters.type = null
  filters.material_id = null
  filters.project_id = null
  filters.date_from = null
  filters.date_to = null
  applyFilters()
}

const openCreateDialog = () => {
  selectedMaterial.value = null
  formDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadTransactions()
}

const viewTransaction = (transaction) => {
  selectedTransaction.value = transaction
  detailDialogVisible.value = true
}

const canDelete = (transaction) => {
  // فقط تراکنش‌های ۲۴ ساعت اخیر قابل حذف هستند
  const created = new Date(transaction.created_at)
  const now = new Date()
  const diff = (now - created) / (1000 * 60 * 60)
  return diff <= 24
}

const confirmDelete = (transaction) => {
  confirm.require({
    message: `آیا از حذف این تراکنش اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await inventoryService.deleteTransaction(transaction.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تراکنش با موفقیت حذف شد',
          life: 3000
        })
        loadTransactions()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف تراکنش با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
  loadTransactions()
}

const onSort = (event) => {
  lazyParams.sortField = event.sortField
  lazyParams.sortOrder = event.sortOrder
  lazyParams.first = 0
  loadTransactions()
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    lazyParams.first = 0
    loadTransactions()
  }, 500)
}

// ============ Helpers ============
const formatMoney = (value) => {
  if (!value) return '۰ ریال'
  return new Intl.NumberFormat('fa-IR').format(value) + ' ریال'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

// ============ Lifecycle ============
onMounted(() => {
  loadMaterials()
  loadProjects()
  loadTransactions()
})
</script>

<style scoped>
.transaction-list {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.badge {
  background: #e5e7eb;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
}

.stat-icon.blue { background: #3b82f6; }
.stat-icon.green { background: #22c55e; }
.stat-icon.red { background: #ef4444; }
.stat-icon.orange { background: #f59e0b; }

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Filters */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: #4f46e5;
  outline: none;
}

.search-box .pi-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.filter-select {
  min-width: 150px;
}

.filters-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-picker {
  max-width: 140px;
}

.date-separator {
  color: #6b7280;
  font-size: 0.85rem;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.transactions-table {
  width: 100%;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-purchase {
  background: #d1fae5;
  color: #059669;
}

.type-sale {
  background: #fee2e2;
  color: #dc2626;
}

.type-transfer {
  background: #fef3c7;
  color: #d97706;
}

.type-adjustment {
  background: #dbeafe;
  color: #2563eb;
}

.type-return {
  background: #e0e7ff;
  color: #4f46e5;
}

.type-damage {
  background: #fce4ec;
  color: #db2777;
}

.material-info {
  display: flex;
  flex-direction: column;
}

.material-name {
  font-weight: 500;
  color: #1f2937;
}

.material-code {
  font-size: 0.7rem;
  color: #6b7280;
}

.text-green-600 { color: #16a34a; font-weight: 600; }
.text-red-500 { color: #ef4444; font-weight: 600; }

.total-price {
  font-weight: 600;
  color: #1f2937;
}

/* Loading */
.loading-state {
  background: white;
  border-radius: 12px;
  padding: 1rem;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-cell {
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Transaction Detail */
.transaction-detail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row.highlight {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 600;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
}

.detail-row .value {
  color: #1f2937;
}

/* Responsive */
@media (max-width: 1024px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-left {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }

  .filters-right {
    flex-wrap: wrap;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .summary-stats {
    grid-template-columns: 1fr 1fr;
  }

  .date-filters {
    flex-wrap: wrap;
  }

  .date-picker {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }
}
</style>
