<!-- resources/js/views/contracts/ContractList.vue -->
<template>
  <div class="contract-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-title">
        <i class="pi pi-file-pdf text-2xl text-primary" />
        <h1>قراردادها</h1>
        <span class="badge">{{ totalRecords }}</span>
      </div>

      <div class="header-actions">
        <Button
            label="قرارداد جدید"
            icon="pi pi-plus"
            severity="success"
            @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-box">
          <i class="pi pi-search" />
          <input
              v-model="filters.search"
              placeholder="جستجوی قرارداد..."
              @input="debouncedSearch"
          />
        </div>

        <Select
            v-model="filters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="وضعیت"
            class="filter-select"
            @change="applyFilters"
            showClear
        />

        <Select
            v-model="filters.type"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            placeholder="نوع قرارداد"
            class="filter-select"
            @change="applyFilters"
            showClear
        />
      </div>

      <div class="filters-right">
        <Select
            v-model="filters.sort"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            placeholder="مرتب‌سازی"
            class="sort-select"
            @change="applyFilters"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-header" />
        <div class="skeleton-body" />
        <div class="skeleton-footer" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="contracts.length === 0" class="empty-state">
      <i class="pi pi-file-pdf text-5xl text-muted-color" />
      <h3>هیچ قراردادی یافت نشد</h3>
      <p>اولین قرارداد خود را ثبت کنید</p>
      <Button label="ثبت قرارداد" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Contracts Grid -->
    <div v-else class="contracts-grid">
      <div
          v-for="contract in contracts"
          :key="contract.id"
          class="contract-card"
          @click="viewContract(contract.id)"
      >
        <!-- Status Badge -->
        <div class="card-badge" :class="`status-${contract.status}`">
          {{ contract.status_label }}
        </div>

        <!-- Card Header -->
        <div class="card-header">
          <div class="contract-info">
            <span class="contract-number">#{{ contract.contract_number }}</span>
            <h3 class="contract-title">{{ contract.title }}</h3>
          </div>
          <Tag :value="contract.type_label" :severity="getTypeSeverity(contract.type)" />
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <div class="info-row">
            <span class="label">پیمانکار:</span>
            <span class="value">{{ contract.contractor?.name || 'نامشخص' }}</span>
          </div>
          <div class="info-row">
            <span class="label">پروژه:</span>
            <span class="value">{{ contract.project?.name || 'نامشخص' }}</span>
          </div>
          <div class="info-row">
            <span class="label">مبلغ:</span>
            <span class="value amount">{{ formatMoney(contract.amount) }}</span>
          </div>
          <div class="info-row">
            <span class="label">پرداخت شده:</span>
            <span class="value paid">{{ formatMoney(contract.paid_amount) }}</span>
          </div>
        </div>

        <!-- Progress -->
        <div class="card-progress">
          <div class="progress-header">
            <span>پیشرفت مالی</span>
            <span class="progress-value">{{ contract.progress_percent || 0 }}%</span>
          </div>
          <ProgressBar
              :value="contract.progress_percent || 0"
              :class="getProgressClass(contract.progress_percent)"
          />
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="dates">
            <span v-if="contract.start_date">
              <i class="pi pi-calendar" />
              {{ formatDate(contract.start_date) }}
            </span>
            <span v-if="contract.end_date">
              <i class="pi pi-calendar-times" />
              {{ formatDate(contract.end_date) }}
            </span>
          </div>
          <div class="card-actions" @click.stop>
            <Button
                icon="pi pi-eye"
                text
                rounded
                severity="info"
                @click="viewContract(contract.id)"
                v-tooltip.top="'مشاهده جزئیات'"
            />
            <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="warning"
                @click="openEditDialog(contract)"
                v-tooltip.top="'ویرایش'"
            />
            <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="confirmDelete(contract)"
                v-tooltip.top="'حذف'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="custom-pagination">
      <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
      >
        <i class="pi pi-chevron-right" />
      </button>

      <div class="page-numbers">
        <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
      >
        <i class="pi pi-chevron-left" />
      </button>
    </div>

    <!-- Contract Form Dialog -->
    <ContractForm
        v-model:visible="formDialogVisible"
        :contract-id="editingId"
        @saved="onFormSuccess"
    />


  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { contractService } from '@/services/ContractService.js'
import ContractForm from './ContractForm.vue'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// State
const contracts = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const formDialogVisible = ref(false)
const editingId = ref(null)

const filters = reactive({
  search: '',
  status: null,
  type: null,
  sort: 'newest'
})

const lazyParams = reactive({
  first: 0,
  rows: 12
})

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'فعال', value: 'active' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'لغو شده', value: 'cancelled' },
  { label: 'متوقف', value: 'suspended' }
]

const typeOptions = [
  { label: 'ساخت و ساز', value: 'construction' },
  { label: 'خدماتی', value: 'service' },
  { label: 'مشاوره', value: 'consulting' },
  { label: 'تامین کالا', value: 'supply' },
  { label: 'سایر', value: 'other' }
]

const sortOptions = [
  { label: 'جدیدترین', value: 'newest' },
  { label: 'قدیمی‌ترین', value: 'oldest' },
  { label: 'بیشترین مبلغ', value: 'highest' },
  { label: 'کمترین مبلغ', value: 'lowest' }
]

// Computed
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)
const totalPages = computed(() => Math.ceil(totalRecords.value / lazyParams.rows))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= delta) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})

// Methods
const loadContracts = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: lazyParams.rows,
      search: filters.search || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
    }

    const response = await contractService.list(params)
    contracts.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری قراردادها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  lazyParams.first = 0
  loadContracts()
}

const openCreateDialog = () => {
  editingId.value = null
  formDialogVisible.value = true
}

const openEditDialog = (contract) => {
  editingId.value = contract.id
  formDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadContracts()
}

const viewContract = (id) => {
  router.push({ name: 'contracts.detail', params: { id } })
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  lazyParams.first = (page - 1) * lazyParams.rows
  loadContracts()
}

const confirmDelete = (contract) => {
  confirm.require({
    message: `آیا از حذف قرارداد "${contract.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await contractService.delete(contract.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'قرارداد با موفقیت حذف شد',
          life: 3000
        })
        loadContracts()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف قرارداد با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    lazyParams.first = 0
    loadContracts()
  }, 500)
}

// Helpers
const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' ریال'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getTypeSeverity = (type) => {
  const severities = {
    construction: 'info',
    service: 'warning',
    consulting: 'secondary',
    supply: 'success',
    other: 'secondary'
  }
  return severities[type] || 'secondary'
}

const getProgressClass = (progress) => {
  if (progress >= 90) return 'progress-success'
  if (progress >= 60) return 'progress-warning'
  return 'progress-danger'
}

// Lifecycle
onMounted(() => {
  loadContracts()
})
</script>

<style scoped>
.contract-list {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

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

.filter-select,
.sort-select {
  min-width: 140px;
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.contract-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
}

.contract-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  border-color: #4f46e5;
}

.card-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
}

.status-draft { background: #f3f4f6; color: #6b7280; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-active { background: #dbeafe; color: #1d4ed8; }
.status-completed { background: #d1fae5; color: #059669; }
.status-cancelled { background: #fee2e2; color: #dc2626; }
.status-suspended { background: #fef3c7; color: #d97706; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  margin-top: 0.5rem;
}

.contract-number {
  font-size: 0.75rem;
  color: #6b7280;
  display: block;
}

.contract-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.card-body {
  margin-bottom: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.info-row .label {
  color: #6b7280;
}

.info-row .value {
  color: #1f2937;
  font-weight: 500;
}

.info-row .amount {
  color: #4f46e5;
  font-weight: 600;
}

.info-row .paid {
  color: #10b981;
}

.card-progress {
  margin-bottom: 0.75rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.progress-value {
  font-weight: 600;
  color: #1f2937;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.dates {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.dates i {
  margin-left: 0.25rem;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

/* Loading Skeleton */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  width: 60%;
}

.skeleton-body {
  height: 80px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-footer {
  height: 30px;
  background: #f3f4f6;
  border-radius: 4px;
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

/* Pagination */
.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #4f46e5;
  color: #4f46e5;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.3rem;
}

.page-number {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
}

.page-number:hover {
  border-color: #e5e7eb;
}

.page-number.active {
  background: #4f46e5;
  color: white;
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
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
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

  .filter-select,
  .sort-select {
    min-width: 100%;
  }

  .contracts-grid {
    grid-template-columns: 1fr;
  }
}
</style>