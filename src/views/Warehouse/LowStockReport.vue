<!-- resources/js/views/inventory/LowStockReport.vue -->
<template>
  <div class="low-stock-report" :class="{ 'compact': compact }">
    <!-- ============ HEADER ============ -->
    <div v-if="!compact && !hideHeader" class="report-header">
      <div class="header-title">
        <i class="pi pi-exclamation-triangle text-2xl text-danger" />
        <h1>گزارش موجودی کم</h1>
        <span class="badge badge-danger">{{ totalLowStock }} کالا</span>
      </div>

      <div class="header-actions">
        <Button
            icon="pi pi-bell"
            label="ارسال هشدار"
            severity="warning"
            outlined
            size="small"
            @click="sendAlerts"
            :loading="sendingAlerts"
        />
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

    <!-- ============ ALERT SUMMARY ============ -->
    <div class="alert-summary" :class="{ 'compact-alert': compact }">
      <div class="alert-card critical">
        <div class="alert-icon">
          <i class="pi pi-times-circle" />
        </div>
        <div class="alert-content">
          <span class="alert-value">{{ criticalCount }}</span>
          <span class="alert-label">بحرانی</span>
          <span class="alert-desc">موجودی صفر یا کمتر از حداقل</span>
        </div>
      </div>
      <div class="alert-card warning">
        <div class="alert-icon">
          <i class="pi pi-exclamation-circle" />
        </div>
        <div class="alert-content">
          <span class="alert-value">{{ warningCount }}</span>
          <span class="alert-label">هشدار</span>
          <span class="alert-desc">موجودی کمتر از ۳۰٪ حداقل</span>
        </div>
      </div>
      <div class="alert-card info">
        <div class="alert-icon">
          <i class="pi pi-info-circle" />
        </div>
        <div class="alert-content">
          <span class="alert-value">{{ attentionCount }}</span>
          <span class="alert-label">توجه</span>
          <span class="alert-desc">موجودی نزدیک به حداقل</span>
        </div>
      </div>
      <div class="alert-card total">
        <div class="alert-icon">
          <i class="pi pi-box" />
        </div>
        <div class="alert-content">
          <span class="alert-value">{{ totalMaterials }}</span>
          <span class="alert-label">کل کالاها</span>
          <span class="alert-desc">{{ Math.round((totalLowStock / totalMaterials) * 100) || 0 }}% در وضعیت هشدار</span>
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
            v-model="localFilters.severity"
            :options="severityOptions"
            option-label="label"
            option-value="value"
            placeholder="سطح هشدار"
            class="filter-select"
            @change="applyFilters"
            show-clear
            :style="{ minWidth: compact ? '100px' : '150px' }"
        />
      </div>

      <div class="filters-right">
        <Button
            icon="pi pi-filter-slash"
            text
            rounded
            @click="clearFilters"
            v-tooltip.top="'پاک کردن فیلترها'"
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
      <div class="empty-icon success">
        <i class="pi pi-check-circle" />
      </div>
      <h3>همه کالاها در وضعیت مطلوب هستند!</h3>
      <p>هیچ کالایی با موجودی کم یافت نشد</p>
      <Button
          v-if="!compact"
          label="مشاهده همه کالاها"
          icon="pi pi-box"
          @click="$router.push({ name: 'inventory.index' })"
      />
    </div>

    <!-- ============ LOW STOCK TABLE ============ -->
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
          class="low-stock-table"
      >
        <Column field="severity" header="سطح هشدار" style="min-width: 100px;">
          <template #body="{ data }">
            <div class="severity-badge" :class="`severity-${data.severity}`">
              <i :class="getSeverityIcon(data.severity)" />
              {{ getSeverityLabel(data.severity) }}
            </div>
          </template>
        </Column>

        <Column field="code" header="کد" style="min-width: 100px;" sortable>
          <template #body="{ data }">
            <span class="code">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" header="نام کالا" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <div class="material-info">
              <span class="name">{{ data.name }}</span>
              <Tag v-if="data.category" :value="data.category.name" severity="info" size="small" />
            </div>
          </template>
        </Column>

        <Column field="category" header="دسته‌بندی" style="min-width: 120px;" :hidden="compact">
          <template #body="{ data }">
            {{ data.category?.name || '-' }}
          </template>
        </Column>

        <Column field="current_stock" header="موجودی فعلی" style="min-width: 120px;" sortable>
          <template #body="{ data }">
            <span class="stock-value stock-critical">
              {{ formatNumber(data.current_stock) }} {{ data.unit || '' }}
            </span>
          </template>
        </Column>

        <Column field="min_stock" header="حداقل موجودی" style="min-width: 100px;" sortable>
          <template #body="{ data }">
            {{ formatNumber(data.min_stock) }} {{ data.unit || '' }}
          </template>
        </Column>

        <Column header="کمبود" style="min-width: 100px;" sortable>
          <template #body="{ data }">
            <span class="shortage" :class="getShortageClass(data)">
              {{ formatNumber(getShortage(data)) }} {{ data.unit || '' }}
            </span>
          </template>
        </Column>

        <Column header="درصد موجودی" style="min-width: 150px;">
          <template #body="{ data }">
            <div class="stock-status">
              <div class="status-bar">
                <div
                    class="status-fill"
                    :style="{ width: getStockPercentage(data) + '%' }"
                    :class="getProgressClass(data)"
                />
              </div>
              <span class="status-label">{{ getStockPercentage(data) }}%</span>
            </div>
          </template>
        </Column>

        <Column field="unit_price" header="قیمت واحد" style="min-width: 120px;" sortable :hidden="compact">
          <template #body="{ data }">
            {{ formatMoney(data.unit_price) }}
          </template>
        </Column>

        <Column field="status" header="وضعیت" style="min-width: 100px;" :hidden="compact">
          <template #body="{ data }">
            <Tag :value="data.status_label" :severity="data.status_severity" />
          </template>
        </Column>

        <Column header="عملیات" style="min-width: 120px;" :hidden="compact">
          <template #body="{ data }">
            <Button
                icon="pi pi-shopping-cart"
                text
                rounded
                severity="success"
                size="small"
                @click="openPurchaseDialog(data)"
                v-tooltip.top="'ثبت سفارش خرید'"
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
                icon="pi pi-eye"
                text
                rounded
                severity="info"
                size="small"
                @click="viewMaterial(data)"
                v-tooltip.top="'مشاهده'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ============ FOOTER ============ -->
    <div v-if="!compact && !hideFooter && materials.length > 0" class="report-footer">
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="label">کالاهای با موجودی کم:</span>
          <span class="value text-danger">{{ totalLowStock }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">کمبود کل:</span>
          <span class="value text-warning">{{ formatNumber(totalShortage) }} واحد</span>
        </div>
        <div class="footer-stat">
          <span class="label">ارزش کمبود:</span>
          <span class="value text-danger">{{ formatMoney(totalShortageValue) }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">نیاز به خرید فوری:</span>
          <span class="value text-critical">{{ criticalCount }} کالا</span>
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
            <span>کمبود:</span>
            <span class="text-danger">{{ formatNumber(getShortage(selectedMaterial)) }} {{ selectedMaterial.unit || '' }}</span>
          </div>
          <div class="summary-row highlight success">
            <span>مقدار پیشنهادی:</span>
            <span class="text-success">{{ formatNumber(getSuggestedQuantity(selectedMaterial)) }} {{ selectedMaterial.unit || '' }}</span>
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
              حداقل مقدار پیشنهادی: {{ formatNumber(getSuggestedQuantity(selectedMaterial)) }}
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
  compact: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Object,
    default: () => ({})
  },
  hideHeader: {
    type: Boolean,
    default: false
  },
  hideFooter: {
    type: Boolean,
    default: false
  }
})

// ============================================
// EMITS
// ============================================
const emit = defineEmits(['loaded', 'error', 'export', 'alert-sent'])

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
const sendingAlerts = ref(false)
const totalRecords = ref(0)
const totalLowStock = ref(0)
const criticalCount = ref(0)
const warningCount = ref(0)
const attentionCount = ref(0)
const totalMaterials = ref(0)
const totalShortage = ref(0)
const totalShortageValue = ref(0)
const lastUpdate = ref(null)

const purchaseDialogVisible = ref(false)
const selectedMaterial = ref(null)
const submitting = ref(false)
const errors = ref({})

const localFilters = reactive({
  search: '',
  category_id: null,
  severity: null
})

const lazyParams = reactive({
  first: 0,
  rows: 15,
  sortField: 'severity',
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
const severityOptions = [
  { label: 'همه', value: null },
  { label: 'بحرانی', value: 'critical' },
  { label: 'هشدار', value: 'warning' },
  { label: 'توجه', value: 'attention' }
]

// ============================================
// COMPUTED
// ============================================
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)

// ============================================
// METHODS
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
      severity: localFilters.severity || undefined,
      ...props.filters
    }

    const response = await inventoryService.getLowStockReport(params)
    const reportData = response.data
    materials.value = reportData.materials || []
    totalRecords.value = materials.value.length

    totalLowStock.value = reportData.total_low_stock_items || 0
    totalMaterials.value = materials.value.length

    criticalCount.value = materials.value.filter(m => m.severity === 'critical').length
    warningCount.value = materials.value.filter(m => m.severity === 'warning').length
    attentionCount.value = materials.value.filter(m => m.severity === 'attention').length

    totalShortage.value = materials.value.reduce((sum, m) => sum + getShortage(m), 0)
    totalShortageValue.value = materials.value.reduce((sum, m) => sum + (getShortage(m) * m.unit_price), 0)

    lastUpdate.value = new Date().toLocaleTimeString('fa-IR')
    emit('loaded', { data: materials.value, total: totalRecords.value })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری گزارش موجودی کم با خطا مواجه شد',
      life: 3000
    })
    emit('error', error)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  lazyParams.first = 0
  loadData()
}

const clearFilters = () => {
  localFilters.search = ''
  localFilters.category_id = null
  localFilters.severity = null
  applyFilters()
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
  loadData()
}

const onSort = (event) => {
  lazyParams.sortField = event.sortField
  lazyParams.sortOrder = event.sortOrder
  lazyParams.first = 0
  loadData()
}

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

const openPurchaseDialog = (material) => {
  selectedMaterial.value = material
  purchaseForm.quantity = getSuggestedQuantity(material)
  purchaseForm.unit_price = material.unit_price || 0
  purchaseForm.description = `تامین کالا ${material.name} - موجودی کم`
  errors.value = {}
  purchaseDialogVisible.value = true
}

const getShortage = (material) => {
  return Math.max(0, material.min_stock - material.current_stock)
}

const getSuggestedQuantity = (material) => {
  const shortage = getShortage(material)
  const buffer = Math.ceil(material.min_stock * 0.15)
  return Math.max(1, shortage + buffer)
}

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

const sendAlerts = async () => {
  const count = materials.value.length
  if (count === 0) {
    toast.add({
      severity: 'info',
      summary: 'توجه',
      detail: 'هیچ کالایی با موجودی کم وجود ندارد',
      life: 3000
    })
    return
  }

  sendingAlerts.value = true
  try {
    // ارسال هشدار از طریق API
    const response = await inventoryService.sendLowStockAlerts({
      material_ids: materials.value.map(m => m.id),
      severity: localFilters.severity || 'all'
    })

    toast.add({
      severity: 'success',
      summary: 'هشدار ارسال شد',
      detail: `${count} هشدار برای کالاهای با موجودی کم ارسال شد`,
      life: 5000
    })
    emit('alert-sent', { count, severity: localFilters.severity || 'all' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'ارسال هشدار با خطا مواجه شد',
      life: 3000
    })
  } finally {
    sendingAlerts.value = false
  }
}

const exportPDF = async () => {
  exporting.value = true
  try {
    emit('export', { type: 'pdf', data: { materials: materials.value, total: totalLowStock.value } })
    toast.add({
      severity: 'info',
      summary: 'در حال آماده‌سازی',
      detail: 'گزارش PDF در حال تولید است...',
      life: 2000
    })
  } finally {
    exporting.value = false
  }
}

const exportExcel = async () => {
  exporting.value = true
  try {
    emit('export', { type: 'excel', data: { materials: materials.value, total: totalLowStock.value } })
    toast.add({
      severity: 'info',
      summary: 'در حال آماده‌سازی',
      detail: 'گزارش Excel در حال تولید است...',
      life: 2000
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

const getShortageClass = (material) => {
  const shortage = getShortage(material)
  if (shortage === 0) return 'text-success'
  if (shortage <= material.min_stock * 0.3) return 'text-warning'
  return 'text-danger'
}

const getStockPercentage = (material) => {
  if (material.min_stock === 0) return 0
  const percent = (material.current_stock / material.min_stock) * 100
  return Math.min(percent, 100)
}

const getProgressClass = (material) => {
  const percent = getStockPercentage(material)
  if (percent <= 30) return 'progress-critical'
  if (percent <= 60) return 'progress-warning'
  return 'progress-success'
}

const getSeverityLabel = (severity) => {
  const labels = {
    critical: 'بحرانی',
    warning: 'هشدار',
    attention: 'توجه'
  }
  return labels[severity] || severity
}

const getSeverityIcon = (severity) => {
  const icons = {
    critical: 'pi pi-times-circle',
    warning: 'pi pi-exclamation-circle',
    attention: 'pi pi-info-circle'
  }
  return icons[severity] || 'pi pi-circle'
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
.low-stock-report {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* ============ COMPACT MODE ============ */
.low-stock-report.compact {
  padding: 0.5rem;
  background: transparent;
}

.low-stock-report.compact .report-header {
  display: none;
}

.low-stock-report.compact .alert-summary {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.low-stock-report.compact .alert-card {
  padding: 0.5rem;
}

.low-stock-report.compact .alert-icon {
  width: 32px;
  height: 32px;
  font-size: 0.8rem;
}

.low-stock-report.compact .alert-value {
  font-size: 0.9rem;
}

.low-stock-report.compact .alert-label {
  font-size: 0.65rem;
}

.low-stock-report.compact .alert-desc {
  display: none;
}

.low-stock-report.compact .filters-bar {
  padding: 0.5rem;
  margin-bottom: 0.75rem;
}

.low-stock-report.compact .search-box input {
  padding: 0.3rem 2rem 0.3rem 0.5rem;
  font-size: 0.8rem;
}

.low-stock-report.compact .filter-select {
  min-width: 100px !important;
}

.low-stock-report.compact .table-container {
  border-radius: 6px;
}

.low-stock-report.compact .low-stock-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
}

.low-stock-report.compact .report-footer {
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
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.badge-danger {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* ============ ALERT SUMMARY ============ */
.alert-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.alert-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border-right: 4px solid;
}

.alert-card.critical { border-right-color: #ef4444; }
.alert-card.warning { border-right-color: #f59e0b; }
.alert-card.info { border-right-color: #3b82f6; }
.alert-card.total { border-right-color: #8b5cf6; }

.alert-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.alert-card.critical .alert-icon {
  background: #fee2e2;
  color: #dc2626;
}
.alert-card.warning .alert-icon {
  background: #fef3c7;
  color: #d97706;
}
.alert-card.info .alert-icon {
  background: #dbeafe;
  color: #2563eb;
}
.alert-card.total .alert-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.alert-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.alert-desc {
  display: block;
  font-size: 0.65rem;
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
  gap: 0.5rem;
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

/* ============ TABLE ============ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.low-stock-table {
  width: 100%;
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.severity-critical {
  background: #fee2e2;
  color: #dc2626;
}

.severity-warning {
  background: #fef3c7;
  color: #d97706;
}

.severity-attention {
  background: #dbeafe;
  color: #2563eb;
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
}

.material-info .name {
  font-weight: 500;
  color: #1f2937;
}

.stock-value {
  font-weight: 600;
}

.stock-critical { color: #ef4444; }

.shortage {
  font-weight: 600;
}

.text-success { color: #22c55e; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }
.text-critical { color: #dc2626; font-weight: 700; }

.stock-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-bar {
  flex: 1;
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
  min-width: 40px;
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

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2.5rem;
}

.empty-icon.success {
  background: #d1fae5;
  color: #059669;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
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

.footer-stat .value.text-danger { color: #ef4444; }
.footer-stat .value.text-warning { color: #f59e0b; }
.footer-stat .value.text-critical { color: #dc2626; font-weight: 700; }

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
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.summary-row.highlight.success {
  background: #d1fae5;
}

.summary-row .text-danger {
  color: #ef4444;
  font-weight: 600;
}

.summary-row .text-success {
  color: #22c55e;
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
  .alert-summary {
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

  .footer-stats {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .low-stock-report {
    padding: 0.75rem;
  }

  .report-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .alert-summary {
    grid-template-columns: 1fr 1fr;
  }

  .report-footer {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .alert-summary {
    grid-template-columns: 1fr;
  }

  .low-stock-report.compact .alert-summary {
    grid-template-columns: 1fr 1fr;
  }
}
</style>