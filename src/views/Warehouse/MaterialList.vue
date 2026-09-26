<!-- resources/js/views/inventory/MaterialList.vue -->
<template>
  <div class="material-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-title">
        <i class="pi pi-box text-2xl text-primary" />
        <h1>مدیریت کالاها</h1>
        <span class="badge">{{ totalRecords }}</span>
      </div>

      <div class="header-actions">
        <Button
            label="کالا جدید"
            icon="pi pi-plus"
            severity="success"
            @click="openCreateDialog"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            @click="loadMaterials"
            v-tooltip.top="'بروزرسانی'"
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
              placeholder="جستجوی کالا..."
              @input="debouncedSearch"
          />
        </div>

        <Select
            v-model="filters.category_id"
            :options="categories"
            option-label="name"
            option-value="id"
            placeholder="دسته‌بندی"
            class="filter-select"
            @change="applyFilters"
            showClear
        />

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

        <Button
            :label="filters.low_stock ? 'همه' : 'موجودی کم'"
            :severity="filters.low_stock ? 'primary' : 'secondary'"
            size="small"
            @click="toggleLowStock"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-header" />
        <div class="skeleton-body" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="materials.length === 0" class="empty-state">
      <i class="pi pi-box text-5xl text-muted-color" />
      <h3>هیچ کالایی یافت نشد</h3>
      <p>اولین کالا را ثبت کنید</p>
      <Button label="ثبت کالا" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Materials Grid -->
    <div v-else class="materials-grid">
      <div
          v-for="material in materials"
          :key="material.id"
          class="material-card"
          :class="{ 'low-stock': material.current_stock <= material.min_stock }"
      >
        <!-- Status Badge -->
        <div class="card-badge" :class="material.status === 'active' ? 'status-active' : 'status-inactive'">
          {{ material.status === 'active' ? 'فعال' : 'غیرفعال' }}
        </div>

        <!-- Low Stock Warning -->
        <div v-if="material.current_stock <= material.min_stock" class="low-stock-warning">
          <i class="pi pi-exclamation-triangle" />
          موجودی کم
        </div>

        <!-- Card Content -->
        <div class="card-header">
          <div class="material-info">
            <span class="material-code">{{ material.code }}</span>
            <h3 class="material-name">{{ material.name }}</h3>
          </div>
          <Tag :value="material.category?.name || 'بدون دسته'" severity="info" size="small" />
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">واحد:</span>
            <span class="value">{{ material.unit || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">قیمت واحد:</span>
            <span class="value">{{ formatMoney(material.unit_price) }}</span>
          </div>
          <div class="info-row stock-row">
            <span class="label">موجودی:</span>
            <span class="value stock-value" :class="getStockClass(material)">
              {{ material.current_stock }} {{ material.unit || '' }}
            </span>
          </div>
          <div class="stock-bar">
            <div
                class="stock-fill"
                :style="{ width: getStockPercentage(material) + '%' }"
                :class="getStockClass(material)"
            />
          </div>
          <div class="stock-limits">
            <span>حداقل: {{ material.min_stock }}</span>
            <span>حداکثر: {{ material.max_stock }}</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="card-actions">
            <Button
                icon="pi pi-plus"
                text
                rounded
                severity="success"
                @click="openTransactionDialog(material)"
                v-tooltip.top="'ثبت تراکنش'"
            />
            <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="warning"
                @click="openEditDialog(material)"
                v-tooltip.top="'ویرایش'"
            />
            <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                @click="confirmDelete(material)"
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

    <!-- Dialogs -->
    <MaterialForm
        v-model:visible="formDialogVisible"
        :material-id="editingId"
        @saved="onFormSuccess"
    />

    <TransactionForm
        v-model:visible="transactionDialogVisible"
        :material="selectedMaterial"
        @saved="onTransactionSuccess"
    />

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import MaterialForm from './MaterialForm.vue'
import TransactionForm from './TransactionForm.vue'

const confirm = useConfirm()
const toast = useToast()

// State
const materials = ref([])
const categories = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const formDialogVisible = ref(false)
const transactionDialogVisible = ref(false)
const editingId = ref(null)
const selectedMaterial = ref(null)

const filters = reactive({
  search: '',
  category_id: null,
  status: null,
  low_stock: false
})

const lazyParams = reactive({
  first: 0,
  rows: 12
})

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
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
const loadCategories = async () => {
  try {
    const response = await inventoryService.getCategories({ per_page: 100 })
    categories.value = response.data.data || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: lazyParams.rows,
      search: filters.search || undefined,
      category_id: filters.category_id || undefined,
      status: filters.status || undefined,
      low_stock: filters.low_stock || undefined
    }

    const response = await inventoryService.getMaterials(params)
    materials.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری کالاها با خطا مواجه شد',
      life: 3000
    })
    console.log(error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  lazyParams.first = 0
  loadMaterials()
}

const toggleLowStock = () => {
  filters.low_stock = !filters.low_stock
  applyFilters()
}

const openCreateDialog = () => {
  editingId.value = null
  formDialogVisible.value = true
}

const openEditDialog = (material) => {
  editingId.value = material.id
  formDialogVisible.value = true
}

const openTransactionDialog = (material) => {
  selectedMaterial.value = material
  transactionDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadMaterials()
}

const onTransactionSuccess = () => {
  transactionDialogVisible.value = false
  loadMaterials()
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  lazyParams.first = (page - 1) * lazyParams.rows
  loadMaterials()
}

const confirmDelete = (material) => {
  confirm.require({
    message: `آیا از حذف کالا "${material.name}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await inventoryService.deleteMaterial(material.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'کالا با موفقیت حذف شد',
          life: 3000
        })
        loadMaterials()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف کالا با خطا مواجه شد',
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
    loadMaterials()
  }, 500)
}

// Helpers
const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' ریال'
}

const getStockClass = (material) => {
  const ratio = (material.current_stock / material.max_stock) * 100
  if (ratio <= 20) return 'stock-critical'
  if (ratio <= 50) return 'stock-warning'
  return 'stock-good'
}

const getStockPercentage = (material) => {
  if (material.max_stock === 0) return 0
  const percentage = (material.current_stock / material.max_stock) * 100
  return Math.min(percentage, 100)
}

// Lifecycle
onMounted(() => {
  loadCategories()
  loadMaterials()
})
</script>

<style scoped>
.material-list {
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

.header-actions {
  display: flex;
  gap: 0.5rem;
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

.filter-select {
  min-width: 140px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.material-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
  position: relative;
  border: 2px solid transparent;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
}

.material-card.low-stock {
  border-color: #ef4444;
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

.status-active {
  background: #d1fae5;
  color: #059669;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.low-stock-warning {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  margin-top: 0.5rem;
}

.material-code {
  font-size: 0.75rem;
  color: #6b7280;
  display: block;
}

.material-name {
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

.stock-row .stock-value {
  font-weight: 600;
}

.stock-good { color: #22c55e; }
.stock-warning { color: #f59e0b; }
.stock-critical { color: #ef4444; }

.stock-bar {
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.stock-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.stock-fill.stock-good { background: #22c55e; }
.stock-fill.stock-warning { background: #f59e0b; }
.stock-fill.stock-critical { background: #ef4444; }

.stock-limits {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #9ca3af;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.card-actions {
  display: flex;
  gap: 0.25rem;
}

/* Loading */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  height: 60px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-body {
  height: 80px;
  background: #f3f4f6;
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
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

  .filter-select {
    min-width: 100%;
  }

  .materials-grid {
    grid-template-columns: 1fr;
  }
}
</style>