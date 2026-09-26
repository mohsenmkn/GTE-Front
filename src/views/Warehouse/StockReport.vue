<!-- resources/js/views/inventory/StockReport.vue -->
<template>
  <div class="stock-report" :class="{ 'compact': compact }">
    <!-- ============ HEADER ============ -->
    <div v-if="!compact" class="report-header">
      <div class="header-title">
        <i class="pi pi-warehouse text-2xl text-primary" />
        <h1>گزارش موجودی انبار</h1>
        <span class="badge">{{ totalMaterials }} کالا</span>
        <Tag v-if="lastUpdate" severity="secondary" size="small">
          بروزرسانی: {{ lastUpdate }}
        </Tag>
      </div>

      <div class="header-actions">
        <Button
            icon="pi pi-file-pdf"
            label="خروجی PDF"
            severity="danger"
            outlined
            size="small"
            @click="exportPDF"
            :loading="exporting"
        />
        <Button
            icon="pi pi-file-excel"
            label="خروجی Excel"
            severity="success"
            outlined
            size="small"
            @click="exportExcel"
            :loading="exporting"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            @click="loadData"
            :loading="loading"
            v-tooltip.top="'بروزرسانی'"
        />
      </div>
    </div>

    <!-- ============ SUMMARY CARDS ============ -->
    <div class="summary-cards" :class="{ 'compact-summary': compact }">
      <div class="summary-card">
        <div class="card-icon blue">
          <i class="pi pi-box" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatNumber(totalMaterials) }}</span>
          <span class="card-label">کل کالاها</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon green">
          <i class="pi pi-dollar" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatMoney(totalStockValue) }}</span>
          <span class="card-label">ارزش کل موجودی</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon orange">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ lowStockCount }}</span>
          <span class="card-label">کالاهای با موجودی کم</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon purple">
          <i class="pi pi-chart-bar" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatMoney(averageStockValue) }}</span>
          <span class="card-label">میانگین ارزش هر کالا</span>
        </div>
      </div>
    </div>

    <!-- ============ FILTERS ============ -->
    <div class="filters-bar" :class="{ 'compact-filters': compact }">
      <div class="filters-left">
        <div class="search-box">
          <i class="pi pi-search" />
          <input
              v-model="localFilters.search"
              :placeholder="compact ? 'جستجو...' : 'جستجوی کالا...'"
              @input="debouncedSearch"
          />
          <i
              v-if="localFilters.search"
              class="pi pi-times clear-btn"
              @click="clearSearch"
          />
        </div>

        <Select
            v-model="localFilters.category_id"
            :options="categories"
            option-label="name"
            option-value="id"
            placeholder="دسته‌بندی"
            class="filter-select"
            @change="applyFilters"
            show-clear
            :style="{ minWidth: compact ? '120px' : '150px' }"
        />

        <Select
            v-model="localFilters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="وضعیت"
            class="filter-select"
            @change="applyFilters"
            show-clear
            :style="{ minWidth: compact ? '100px' : '150px' }"
        />

        <Button
            :label="localFilters.low_stock ? 'همه' : 'موجودی کم'"
            :severity="localFilters.low_stock ? 'primary' : 'secondary'"
            size="small"
            @click="toggleLowStock"
            icon="pi pi-filter"
        />
      </div>

      <div class="filters-right">
        <Select
            v-model="localFilters.sort_by"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            placeholder="مرتب‌سازی"
            class="sort-select"
            @change="applyFilters"
            :style="{ minWidth: compact ? '100px' : '140px' }"
        />

        <Select
            v-if="!compact"
            v-model="lazyParams.rows"
            :options="pageSizeOptions"
            option-label="label"
            option-value="value"
            placeholder="تعداد"
            class="page-size-select"
            @change="onPageSizeChange"
        />
      </div>
    </div>

    <!-- ============ LOADING ============ -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in (compact ? 3 : 6)" :key="i" class="skeleton-row">
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
        <div class="skeleton-cell" />
      </div>
    </div>

    <!-- ============ EMPTY STATE ============ -->
    <div v-else-if="materials.length === 0" class="empty-state">
      <i class="pi pi-warehouse text-5xl text-muted-color" />
      <h3>هیچ کالایی یافت نشد</h3>
      <p>برای مشاهده گزارش، کالاها را در انبار ثبت کنید</p>
      <Button
          v-if="!compact"
          label="ثبت کالا"
          icon="pi pi-plus"
          @click="$router.push({ name: 'inventory.index' })"
      />
    </div>

    <!-- ============ STOCK TABLE ============ -->
    <div v-else class="table-container">
      <DataTable
          :value="materials"
          stripedRows
          rowHover
          paginator
          :rows="lazyParams.rows"
          :totalRecords="totalRecords"
          :first="lazyParams.first"
          @page="onPage"
          @sort="onSort"
          class="stock-table"
          :paginatorTemplate="compact ? 'PrevPageLink PageLinks NextPageLink' : 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown'"
          :rowsPerPageOptions="compact ? [] : [10, 15, 25, 50]"
      >
        <Column field="code" header="کد" style="min-width: 100px;" sortable>
          <template #body="{ data }">
            <span class="code">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" header="نام کالا" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <div class="material-info">
              <span class="name">{{ data.name }}</span>
              <Tag
                  v-if="data.category"
                  :value="data.category.name"
                  severity="info"
                  size="small"
              />
            </div>
          </template>
        </Column>

        <Column field="category" header="دسته‌بندی" style="min-width: 120px;" :hidden="compact">
          <template #body="{ data }">
            {{ data.category?.name || '-' }}
          </template>
        </Column>

        <Column field="unit" header="واحد" style="min-width: 80px;" :hidden="compact">
          <template #body="{ data }">
            {{ data.unit || '-' }}
          </template>
        </Column>

        <Column field="current_stock" header="موجودی فعلی" style="min-width: 120px;" sortable>
          <template #body="{ data }">
            <span :class="getStockClass(data)">
              {{ formatNumber(data.current_stock) }}
            </span>
          </template>
        </Column>

        <Column field="min_stock" header="حداقل" style="min-width: 80px;" sortable :hidden="compact">
          <template #body="{ data }">
            {{ formatNumber(data.min_stock) }}
          </template>
        </Column>

        <Column field="max_stock" header="حداکثر" style="min-width: 80px;" sortable :hidden="compact">
          <template #body="{ data }">
            {{ formatNumber(data.max_stock) }}
          </template>
        </Column>

        <Column header="وضعیت موجودی" style="min-width: 150px;">
          <template #body="{ data }">
            <div class="stock-status">
              <div class="status-bar">
                <div
                    class="status-fill"
                    :style="{ width: getStockPercentage(data) + '%' }"
                    :class="getProgressClass(data)"
                />
              </div>
              <span class="status-label">{{ getStockStatusLabel(data) }}</span>
            </div>
          </template>
        </Column>

        <Column field="unit_price" header="قیمت واحد" style="min-width: 120px;" sortable :hidden="compact">
          <template #body="{ data }">
            {{ formatMoney(data.unit_price) }}
          </template>
        </Column>

        <Column header="ارزش کل" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <span class="total-value">{{ formatMoney(data.current_stock * data.unit_price) }}</span>
          </template>
        </Column>

        <Column field="status" header="وضعیت" style="min-width: 100px;" :hidden="compact">
          <template #body="{ data }">
            <Tag :value="data.status_label" :severity="data.status_severity" />
          </template>
        </Column>

        <Column header="عملیات" style="min-width: 100px;" :hidden="compact">
          <template #body="{ data }">
            <Button
                icon="pi pi-eye"
                text
                rounded
                severity="info"
                size="small"
                @click="viewMaterial(data)"
                v-tooltip.top="'مشاهده'"
            />
            <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="warning"
                size="small"
                @click="editMaterial(data)"
                v-tooltip.top="'ویرایش'"
            />
            <Button
                icon="pi pi-shopping-cart"
                text
                rounded
                severity="success"
                size="small"
                @click="purchaseMaterial(data)"
                v-tooltip.top="'ثبت سفارش'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ============ FOOTER ============ -->
    <div v-if="!compact && materials.length > 0" class="report-footer">
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="label">تعداد کل کالاها:</span>
          <span class="value">{{ totalMaterials }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">ارزش کل موجودی:</span>
          <span class="value">{{ formatMoney(totalStockValue) }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">کالاهای با موجودی کم:</span>
          <span class="value text-danger">{{ lowStockCount }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">میانگین قیمت:</span>
          <span class="value">{{ formatMoney(averagePrice) }}</span>
        </div>
      </div>

      <div class="footer-export">
        <span class="update-time">آخرین بروزرسانی: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- ============ PURCHASE DIALOG ============ -->
    <Dialog
        v-model:visible="purchaseDialogVisible"
        header="ثبت سفارش خرید"
        modal
        :style="{ width: compact ? '90vw' : '500px', maxWidth: '500px' }"
    >
      <div v-if="selectedMaterial" class="purchase-form">
        <div class="material-summary">
          <h4>{{ selectedMaterial.name }}</h4>
          <div class="summary-row">
            <span>موجودی فعلی:</span>
            <span class="text-danger">{{ formatNumber(selectedMaterial.current_stock) }} {{ selectedMaterial.unit || '' }}</span>
          </div>
          <div class="summary-row">
            <span>حداقل موجودی:</span>
            <span>{{ formatNumber(selectedMaterial.min_stock) }} {{ selectedMaterial.unit || '' }}</span>
          </div>
          <div class="summary-row highlight">
            <span>مقدار پیشنهادی:</span>
            <span class="text-primary">{{ getSuggestedQuantity(selectedMaterial) }} {{ selectedMaterial.unit || '' }}</span>
          </div>
        </div>

        <form @submit.prevent="submitPurchase" class="form">
          <div class="form-field">
            <label for="quantity" class="required">تعداد سفارش</label>
            <InputNumber
                id="quantity"
                v-model="purchaseForm.quantity"
                placeholder="تعداد مورد نیاز"
                :min="1"
                :invalid="!!errors.quantity"
                @input="clearFieldError('quantity')"
                class="w-full"
                :use-grouping="true"
            />
            <small v-if="errors.quantity" class="error-text">{{ errors.quantity[0] }}</small>
            <small class="helper-text">
              حداقل مقدار پیشنهادی: {{ getSuggestedQuantity(selectedMaterial) }}
            </small>
          </div>

          <div class="form-field">
            <label for="unit_price">قیمت واحد (ریال)</label>
            <InputNumber
                id="unit_price"
                v-model="purchaseForm.unit_price"
                placeholder="قیمت واحد"
                :min="0"
                :invalid="!!errors.unit_price"
                @input="clearFieldError('unit_price')"
                class="w-full"
                :use-grouping="true"
                locale="fa-IR"
            />
            <small v-if="errors.unit_price" class="error-text">{{ errors.unit_price[0] }}</small>
          </div>

          <div class="form-field">
            <label for="description" class="required">توضیحات</label>
            <Textarea
                id="description"
                v-model="purchaseForm.description"
                rows="3"
                placeholder="توضیحات سفارش..."
                :invalid="!!errors.description"
                @input="clearFieldError('description')"
                class="w-full"
                auto-resize
            />
            <small v-if="errors.description" class="error-text">{{ errors.description[0] }}</small>
          </div>

          <div class="form-actions">
            <Button
                label="انصراف"
                icon="pi pi-times"
                severity="secondary"
                outlined
                @click="purchaseDialogVisible = false"
                type="button"
                :disabled="submitting"
            />
            <Button
                label="ثبت سفارش"
                :icon="submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                type="submit"
                :loading="submitting"
            />
          </div>
        </form>
      </div>
    </Dialog>

    <!-- ============ CONFIRM ============ -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'

// ============================================
// PROPS
// ============================================
const props = defineProps({
  // حالت فشرده برای استفاده در داشبورد یا ویجت‌ها
  compact: {
    type: Boolean,
    default: false
  },
  // فیلترهای ورودی
  filters: {
    type: Object,
    default: () => ({})
  },
  // عنوان سفارشی
  title: {
    type: String,
    default: null
  },
  // مخفی کردن هدر
  hideHeader: {
    type: Boolean,
    default: false
  },
  // مخفی کردن فوتر
  hideFooter: {
    type: Boolean,
    default: false
  }
})

// ============================================
// EMITS
// ============================================
const emit = defineEmits(['loaded', 'error', 'export'])

// ============================================
// COMPOSABLES
// ============================================
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// ============================================
// STATE
// ============================================
const materials = ref([])
const categories = ref([])
const loading = ref(false)
const exporting = ref(false)
const totalRecords = ref(0)
const totalMaterials = ref(0)
const totalStockValue = ref(0)
const lowStockCount = ref(0)
const averageStockValue = ref(0)
const averagePrice = ref(0)
const lastUpdate = ref(null)
const purchaseDialogVisible = ref(false)
const selectedMaterial = ref(null)
const submitting = ref(false)
const errors = ref({})

const localFilters = reactive({
  search: '',
  category_id: null,
  status: null,
  low_stock: false,
  sort_by: 'name'
})

const lazyParams = reactive({
  first: 0,
  rows: 15,
  sortField: 'name',
  sortOrder: 1
})

const purchaseForm = reactive({
  quantity: null,
  unit_price: null,
  description: ''
})

// ============================================
// OPTIONS
// ============================================
const statusOptions = [
  { label: 'همه', value: null },
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
]

const sortOptions = [
  { label: 'نام', value: 'name' },
  { label: 'کد', value: 'code' },
  { label: 'موجودی', value: 'current_stock' },
  { label: 'قیمت', value: 'unit_price' },
  { label: 'ارزش کل', value: 'total_value' }
]

const pageSizeOptions = [
  { label: '۱۰', value: 10 },
  { label: '۱۵', value: 15 },
  { label: '۲۵', value: 25 },
  { label: '۵۰', value: 50 }
]

// ============================================
// COMPUTED
// ============================================
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)

// ============================================
// METHODS - DATA LOADING
// ============================================
const loadCategories = async () => {
  try {
    const response = await inventoryService.getCategories({
      status: 'active',
      per_page: 100
    })
    categories.value = response.data.data || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: lazyParams.rows,
      search: localFilters.search || undefined,
      category_id: localFilters.category_id || undefined,
      status: localFilters.status || undefined,
      low_stock: localFilters.low_stock || undefined,
      sort_by: localFilters.sort_by,
      ...props.filters // فیلترهای ورودی
    }

    const response = await inventoryService.getStockReport(params)

    // پردازش داده‌ها
    const reportData = response.data
    materials.value = reportData.materials || []
    totalRecords.value = materials.value.length

    // محاسبه آمار
    totalMaterials.value = reportData.total_materials || 0
    totalStockValue.value = reportData.total_stock_value || 0
    lowStockCount.value = materials.value.filter(m => m.current_stock <= m.min_stock).length

    const total = materials.value.reduce((sum, m) => sum + (m.current_stock * m.unit_price), 0)
    averageStockValue.value = materials.value.length > 0 ? total / materials.value.length : 0
    averagePrice.value = materials.value.length > 0
        ? materials.value.reduce((sum, m) => sum + m.unit_price, 0) / materials.value.length
        : 0

    lastUpdate.value = new Date().toLocaleTimeString('fa-IR')

    emit('loaded', { data: materials.value, total: totalRecords.value })
  } catch (error) {
    console.error('Error loading stock report:', error)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری گزارش موجودی با خطا مواجه شد',
      life: 3000
    })
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// ============================================
// METHODS - FILTERS
// ============================================
const applyFilters = () => {
  lazyParams.first = 0
  loadData()
}

const toggleLowStock = () => {
  localFilters.low_stock = !localFilters.low_stock
  applyFilters()
}

const clearSearch = () => {
  localFilters.search = ''
  applyFilters()
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// ============================================
// METHODS - TABLE
// ============================================
const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
  loadData()
}

const onPageSizeChange = () => {
  lazyParams.first = 0
  loadData()
}

const onSort = (event) => {
  lazyParams.sortField = event.sortField
  lazyParams.sortOrder = event.sortOrder
  lazyParams.first = 0
  loadData()
}

// ============================================
// METHODS - ACTIONS
// ============================================
const viewMaterial = (material) => {
  router.push({
    name: 'inventory.index',
    query: { view: material.id }
  })
}

const editMaterial = (material) => {
  router.push({
    name: 'inventory.index',
    query: { edit: material.id }
  })
}

const purchaseMaterial = (material) => {
  selectedMaterial.value = material
  purchaseForm.quantity = getSuggestedQuantity(material)
  purchaseForm.unit_price = material.unit_price || 0
  purchaseForm.description = `تامین کالا ${material.name} - موجودی کم`
  errors.value = {}
  purchaseDialogVisible.value = true
}

const getSuggestedQuantity = (material) => {
  // پیشنهاد: حداقل موجودی - موجودی فعلی + 10%
  const shortage = Math.max(0, material.min_stock - material.current_stock)
  const buffer = Math.ceil(material.min_stock * 0.1)
  return Math.max(1, shortage + buffer)
}

// ============================================
// METHODS - PURCHASE
// ============================================
const submitPurchase = async () => {
  errors.value = {}
  submitting.value = true

  try {
    const payload = {
      material_id: selectedMaterial.value.id,
      type: 'purchase',
      quantity: purchaseForm.quantity,
      unit_price: purchaseForm.unit_price || 0,
      total_price: purchaseForm.quantity * (purchaseForm.unit_price || 0),
      transaction_date: new Date().toISOString().split('T')[0],
      description: purchaseForm.description
    }

    await inventoryService.createTransaction(payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'سفارش خرید با موفقیت ثبت شد',
      life: 3000
    })

    purchaseDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
    } else {
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: error.response?.data?.message || 'ثبت سفارش با خطا مواجه شد',
        life: 3000
      })
    }
  } finally {
    submitting.value = false
  }
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

// ============================================
// METHODS - EXPORT
// ============================================
const exportPDF = async () => {
  exporting.value = true
  try {
    // پیاده‌سازی خروجی PDF با استفاده از jsPDF یا کتابخانه مشابه
    const pdfData = {
      title: 'گزارش موجودی انبار',
      data: materials.value,
      total: totalMaterials.value,
      value: totalStockValue.value
    }
    emit('export', { type: 'pdf', data: pdfData })

    toast.add({
      severity: 'info',
      summary: 'در حال آماده‌سازی',
      detail: 'گزارش PDF در حال تولید است...',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'تولید PDF با خطا مواجه شد',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}

const exportExcel = async () => {
  exporting.value = true
  try {
    const excelData = {
      title: 'گزارش موجودی انبار',
      data: materials.value,
      total: totalMaterials.value,
      value: totalStockValue.value
    }
    emit('export', { type: 'excel', data: excelData })

    toast.add({
      severity: 'info',
      summary: 'در حال آماده‌سازی',
      detail: 'گزارش Excel در حال تولید است...',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'تولید Excel با خطا مواجه شد',
      life: 3000
    })
  } finally {
    exporting.value = false
  }
}

// ============================================
// HELPERS
// ============================================
const formatMoney = (value) => {
  if (!value) return '۰ ریال'
  return new Intl.NumberFormat('fa-IR').format(value) + ' ریال'
}

const formatNumber = (value) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('fa-IR').format(value)
}

const getStockClass = (material) => {
  if (material.current_stock <= material.min_stock) return 'stock-critical'
  if (material.current_stock <= material.max_stock * 0.3) return 'stock-warning'
  return 'stock-good'
}

const getStockPercentage = (material) => {
  if (material.max_stock === 0) return 0
  const percent = (material.current_stock / material.max_stock) * 100
  return Math.min(percent, 100)
}

const getProgressClass = (material) => {
  const percent = getStockPercentage(material)
  if (percent <= 20) return 'progress-critical'
  if (percent <= 50) return 'progress-warning'
  return 'progress-success'
}

const getStockStatusLabel = (material) => {
  const percent = getStockPercentage(material)
  if (percent <= 20) return 'بحرانی'
  if (percent <= 50) return 'کم'
  if (percent <= 80) return 'متوسط'
  return 'خوب'
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.filters, () => {
  lazyParams.first = 0
  loadData()
}, { deep: true })

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  loadCategories()
  loadData()
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>

<style scoped>
.stock-report {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* ============ COMPACT MODE ============ */
.stock-report.compact {
  padding: 0.5rem;
  background: transparent;
}

.stock-report.compact .report-header {
  display: none;
}

.stock-report.compact .summary-cards {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stock-report.compact .summary-card {
  padding: 0.5rem 0.75rem;
}

.stock-report.compact .card-icon {
  width: 32px;
  height: 32px;
  font-size: 0.8rem;
}

.stock-report.compact .card-value {
  font-size: 0.9rem;
}

.stock-report.compact .card-label {
  font-size: 0.65rem;
}

.stock-report.compact .filters-bar {
  padding: 0.5rem;
  margin-bottom: 0.75rem;
}

.stock-report.compact .search-box input {
  padding: 0.3rem 2rem 0.3rem 0.5rem;
  font-size: 0.8rem;
}

.stock-report.compact .filter-select {
  min-width: 100px !important;
}

.stock-report.compact .sort-select {
  min-width: 100px !important;
}

.stock-report.compact .table-container {
  border-radius: 6px;
}

.stock-report.compact .stock-table :deep(.p-datatable-header) {
  padding: 0.5rem;
}

.stock-report.compact .stock-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
}

.stock-report.compact .report-footer {
  display: none;
}

/* ============ HEADER ============ */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
}

/* ============ SUMMARY CARDS ============ */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.card-icon.blue { background: #3b82f6; }
.card-icon.green { background: #22c55e; }
.card-icon.orange { background: #f59e0b; }
.card-icon.purple { background: #8b5cf6; }

.card-content {
  flex: 1;
  min-width: 0;
}

.card-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.card-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* ============ FILTERS ============ */
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

.filters-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  background: white;
}

.search-box input:focus {
  border-color: #4f46e5;
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-box .pi-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-box .clear-btn {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.2rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.search-box .clear-btn:hover {
  background: #f3f4f6;
}

.filter-select {
  min-width: 150px;
}

.sort-select {
  min-width: 140px;
}

.page-size-select {
  min-width: 80px;
}

/* ============ TABLE ============ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.stock-table {
  width: 100%;
}

.code {
  font-weight: 600;
  color: #4f46e5;
  font-size: 0.85rem;
}

.material-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.material-info .name {
  font-weight: 500;
  color: #1f2937;
}

.stock-critical { color: #ef4444; font-weight: 600; }
.stock-warning { color: #f59e0b; font-weight: 600; }
.stock-good { color: #22c55e; font-weight: 600; }

.stock-status {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-critical { background: #ef4444; }
.progress-warning { background: #f59e0b; }
.progress-success { background: #22c55e; }

.status-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.total-value {
  font-weight: 600;
  color: #1f2937;
}

/* ============ LOADING ============ */
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

/* ============ EMPTY STATE ============ */
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

/* ============ FOOTER ============ */
.report-footer {
  margin-top: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.875rem;
}

.footer-stat .label {
  color: #6b7280;
}

.footer-stat .value {
  font-weight: 600;
  color: #1f2937;
}

.footer-stat .value.text-danger {
  color: #ef4444;
}

.update-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ============ PURCHASE FORM ============ */
.purchase-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.material-summary {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
}

.material-summary h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.9rem;
}

.summary-row.highlight {
  background: #dbeafe;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.summary-row .text-primary {
  color: #4f46e5;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
}

.form-field label.required::after {
  content: ' *';
  color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 0.8rem;
}

.helper-text {
  font-size: 0.7rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1024px) {
  .summary-cards {
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
    min-width: 100% !important;
  }

  .sort-select {
    min-width: 100% !important;
  }

  .filters-right {
    flex-direction: column;
  }

  .footer-stats {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .stock-report {
    padding: 0.75rem;
  }

  .report-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .summary-cards {
    grid-template-columns: 1fr 1fr;
  }

  .report-footer {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .stock-report.compact .summary-cards {
    grid-template-columns: 1fr 1fr;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>