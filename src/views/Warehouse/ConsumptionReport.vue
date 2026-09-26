<!-- resources/js/views/inventory/ConsumptionReport.vue -->
<template>
  <div class="consumption-report" :class="{ 'compact': compact }">
    <!-- ============ HEADER ============ -->
    <div v-if="!compact && !hideHeader" class="report-header">
      <div class="header-title">
        <i class="pi pi-chart-line text-2xl text-primary" />
        <h1>گزارش مصرف انبار</h1>
        <span class="badge">{{ totalItems }} کالا</span>
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
          <span class="card-value">{{ formatNumber(totalItems) }}</span>
          <span class="card-label">کل کالاهای مصرفی</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon green">
          <i class="pi pi-dollar" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatMoney(totalConsumptionValue) }}</span>
          <span class="card-label">کل مصرف (ریال)</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon orange">
          <i class="pi pi-arrow-up" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ formatNumber(totalConsumptionQuantity) }}</span>
          <span class="card-label">کل مصرف (واحد)</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon purple">
          <i class="pi pi-calendar" />
        </div>
        <div class="card-content">
          <span class="card-value">{{ daysRange }}</span>
          <span class="card-label">بازه زمانی</span>
        </div>
      </div>
    </div>

    <!-- ============ DATE RANGE FILTER ============ -->
    <div class="date-filter-bar" :class="{ 'compact-date': compact }">
      <div class="date-range">
        <label>از تاریخ:</label>
        <DatePicker
            v-model="localFilters.date_from"
            date-format="yy-mm-dd"
            placeholder="انتخاب تاریخ شروع"
            @date-select="applyFilters"
            show-icon
            :class="{ 'compact-date-picker': compact }"
        />
        <label>تا تاریخ:</label>
        <DatePicker
            v-model="localFilters.date_to"
            date-format="yy-mm-dd"
            placeholder="انتخاب تاریخ پایان"
            @date-select="applyFilters"
            show-icon
            :class="{ 'compact-date-picker': compact }"
        />
        <div class="quick-buttons" :class="{ 'compact-quick': compact }">
          <Button
              label="امروز"
              severity="secondary"
              outlined
              size="small"
              @click="setToday"
          />
          <Button
              label="هفته گذشته"
              severity="secondary"
              outlined
              size="small"
              @click="setLastWeek"
          />
          <Button
              label="ماه گذشته"
              severity="secondary"
              outlined
              size="small"
              @click="setLastMonth"
          />
        </div>
      </div>

      <div class="filter-actions" :class="{ 'compact-actions': compact }">
        <Select
            v-model="localFilters.project_id"
            :options="projects"
            option-label="name"
            option-value="id"
            placeholder="همه پروژه‌ها"
            class="project-select"
            @change="applyFilters"
            filter
            show-clear
            :style="{ minWidth: compact ? '100%' : '180px' }"
        />
        <Select
            v-model="localFilters.category_id"
            :options="categories"
            option-label="name"
            option-value="id"
            placeholder="همه دسته‌بندی‌ها"
            class="category-select"
            @change="applyFilters"
            filter
            show-clear
            :style="{ minWidth: compact ? '100%' : '180px' }"
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
    <div v-else-if="consumptionData.length === 0" class="empty-state">
      <i class="pi pi-chart-line text-5xl text-muted-color" />
      <h3>هیچ مصرفی ثبت نشده است</h3>
      <p>در بازه زمانی انتخاب شده، مصرفی ثبت نشده است</p>
      <Button
          v-if="!compact"
          label="ثبت مصرف"
          icon="pi pi-plus"
          @click="$router.push({ name: 'inventory.transactions' })"
      />
    </div>

    <!-- ============ CONSUMPTION TABLE ============ -->
    <div v-else class="table-container">
      <DataTable
          :value="consumptionData"
          stripedRows
          rowHover
          paginator
          :rows="lazyParams.rows"
          :totalRecords="totalRecords"
          :first="lazyParams.first"
          @page="onPage"
          @sort="onSort"
          class="consumption-table"
      >
        <Column field="material_name" header="کالا" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <div class="material-info">
              <span class="material-name">{{ data.material_name }}</span>
              <span class="material-code">{{ data.material_code }}</span>
            </div>
          </template>
        </Column>

        <Column field="category_name" header="دسته‌بندی" style="min-width: 120px;" :hidden="compact">
          <template #body="{ data }">
            <Tag :value="data.category_name || 'بدون دسته'" severity="info" size="small" />
          </template>
        </Column>

        <Column field="quantity" header="مصرف (واحد)" style="min-width: 120px;" sortable>
          <template #body="{ data }">
            <span class="quantity">{{ formatNumber(data.quantity) }} {{ data.unit || '' }}</span>
          </template>
        </Column>

        <Column field="total_price" header="ارزش مصرف" style="min-width: 150px;" sortable>
          <template #body="{ data }">
            <span class="total-value">{{ formatMoney(data.total_price) }}</span>
          </template>
        </Column>

        <Column field="unit_price" header="میانگین قیمت" style="min-width: 120px;" sortable :hidden="compact">
          <template #body="{ data }">
            {{ formatMoney(data.unit_price || 0) }}
          </template>
        </Column>

        <Column header="درصد مصرف" style="min-width: 150px;">
          <template #body="{ data }">
            <div class="consumption-bar">
              <div
                  class="bar-fill"
                  :style="{ width: getConsumptionPercentage(data) + '%' }"
                  :class="getConsumptionClass(data)"
              />
              <span class="bar-label">{{ getConsumptionPercentage(data) }}%</span>
            </div>
          </template>
        </Column>

        <Column header="پروژه‌ها" style="min-width: 150px;" :hidden="compact">
          <template #body="{ data }">
            <div class="projects-list">
              <Tag
                  v-for="project in data.projects"
                  :key="project.id"
                  :value="project.name"
                  severity="secondary"
                  size="small"
                  class="project-tag"
              />
              <span v-if="!data.projects || data.projects.length === 0" class="text-muted">-</span>
            </div>
          </template>
        </Column>

        <Column header="تراکنش‌ها" style="min-width: 100px;" :hidden="compact">
          <template #body="{ data }">
            <span class="transactions-count">{{ data.transactions_count || 0 }}</span>
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
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ============ CONSUMPTION CHART ============ -->
    <div v-if="consumptionData.length > 0 && !compact" class="chart-container">
      <div class="chart-header">
        <h3>نمودار مصرف کالاها</h3>
        <div class="chart-controls">
          <Select
              v-model="chartType"
              :options="chartTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="نوع نمودار"
              class="chart-type-select"
              @change="updateChart"
          />
        </div>
      </div>
      <div class="chart-wrapper">
        <Chart
            v-if="chartData.labels?.length > 0"
            :type="chartType"
            :data="chartData"
            :options="chartOptions"
            class="consumption-chart"
        />
        <div v-else class="chart-placeholder">
          <i class="pi pi-chart-bar text-4xl text-muted-color" />
          <p>داده‌ای برای نمایش در نمودار وجود ندارد</p>
        </div>
      </div>
    </div>

    <!-- ============ FOOTER ============ -->
    <div v-if="!compact && !hideFooter && consumptionData.length > 0" class="report-footer">
      <div class="footer-stats">
        <div class="footer-stat">
          <span class="label">کل تراکنش‌ها:</span>
          <span class="value">{{ totalTransactions }}</span>
        </div>
        <div class="footer-stat">
          <span class="label">میانگین مصرف روزانه:</span>
          <span class="value">{{ formatNumber(averageDailyConsumption) }} واحد</span>
        </div>
        <div class="footer-stat">
          <span class="label">پرمصرف‌ترین کالا:</span>
          <span class="value">{{ topConsumedMaterial }}</span>
        </div>
      </div>

      <div class="footer-export">
        <span class="update-time">آخرین بروزرسانی: {{ lastUpdate }}</span>
      </div>
    </div>

    <!-- ============ CONFIRM ============ -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import { projectService } from '@/services/projectService'
import Chart from 'primevue/chart'

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
const emit = defineEmits(['loaded', 'error', 'export'])

// ============================================
// COMPOSABLES
// ============================================
const router = useRouter()
const toast = useToast()

// ============================================
// STATE
// ============================================
const consumptionData = ref([])
const categories = ref([])
const projects = ref([])
const loading = ref(false)
const exporting = ref(false)
const totalRecords = ref(0)
const totalItems = ref(0)
const totalConsumptionValue = ref(0)
const totalConsumptionQuantity = ref(0)
const totalTransactions = ref(0)
const averageDailyConsumption = ref(0)
const topConsumedMaterial = ref('')
const daysRange = ref('')
const lastUpdate = ref(null)
const chartType = ref('bar')

const localFilters = reactive({
  date_from: null,
  date_to: null,
  project_id: null,
  category_id: null
})

const lazyParams = reactive({
  first: 0,
  rows: 15,
  sortField: 'material_name',
  sortOrder: 1
})

// ============================================
// OPTIONS
// ============================================
const chartTypeOptions = [
  { label: 'نمودار ستونی', value: 'bar' },
  { label: 'نمودار خطی', value: 'line' },
  { label: 'نمودار دایره‌ای', value: 'pie' },
  { label: 'نمودار راداری', value: 'radar' }
]

// ============================================
// COMPUTED
// ============================================
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)

const chartData = computed(() => {
  const sorted = [...consumptionData.value]
      .sort((a, b) => b.total_price - a.total_price)
      .slice(0, 10)

  const labels = sorted.map(item => item.material_name)
  const quantities = sorted.map(item => item.quantity)
  const values = sorted.map(item => item.total_price)

  const colors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    '#6366f1', '#84cc16'
  ]

  if (chartType.value === 'pie' || chartType.value === 'radar') {
    return {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
      }]
    }
  }

  return {
    labels: labels,
    datasets: [
      {
        label: 'مقدار مصرف (واحد)',
        data: quantities,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
      {
        label: 'ارزش مصرف (ریال)',
        data: values,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: '#22c55e',
        borderWidth: 2,
      }
    ]
  }
})

const chartOptions = computed(() => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'IRANSans'
          }
        }
      }
    }
  }

  if (chartType.value === 'pie' || chartType.value === 'radar') {
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins.legend,
          position: 'bottom',
        }
      }
    }
  }

  if (chartType.value === 'line') {
    return {
      ...baseOptions,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              family: 'IRANSans'
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              family: 'IRANSans'
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  }

  return {
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: 'IRANSans'
          }
        },
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            family: 'IRANSans'
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  }
})

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

const loadProjects = async () => {
  try {
    const response = await projectService.list({ all: 1 })
    projects.value = response.data.data || []
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

const loadData = async () => {
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
      date_from: formatDate(localFilters.date_from),
      date_to: formatDate(localFilters.date_to),
      project_id: localFilters.project_id || undefined,
      category_id: localFilters.category_id || undefined,
      page: currentPage.value,
      per_page: lazyParams.rows,
      sort_by: lazyParams.sortField,
      sort_order: lazyParams.sortOrder === 1 ? 'asc' : 'desc',
      ...props.filters
    }

    const response = await inventoryService.getConsumptionReport(params)
    const reportData = response.data
    consumptionData.value = reportData.consumption || []
    totalRecords.value = consumptionData.value.length

    totalItems.value = reportData.total_items || 0
    totalConsumptionValue.value = reportData.total_value || 0
    totalConsumptionQuantity.value = consumptionData.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
    totalTransactions.value = consumptionData.value.reduce((sum, item) => sum + (item.transactions_count || 0), 0)

    const days = calculateDays()
    daysRange.value = `${days} روز`
    averageDailyConsumption.value = days > 0 ? Math.round(totalConsumptionQuantity.value / days) : 0

    const top = consumptionData.value.length > 0
        ? consumptionData.value.reduce((max, item) =>
            item.quantity > max.quantity ? item : max
        )
        : null
    topConsumedMaterial.value = top?.material_name || '-'

    lastUpdate.value = new Date().toLocaleTimeString('fa-IR')
    emit('loaded', { data: consumptionData.value, total: totalRecords.value })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری گزارش مصرف با خطا مواجه شد',
      life: 3000
    })
    emit('error', error)
  } finally {
    loading.value = false
  }
}

const calculateDays = () => {
  if (!localFilters.date_from || !localFilters.date_to) {
    return 30
  }

  const from = new Date(localFilters.date_from)
  const to = new Date(localFilters.date_to)
  const diffTime = Math.abs(to - from)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

const applyFilters = () => {
  lazyParams.first = 0
  loadData()
}

const setToday = () => {
  const today = new Date()
  localFilters.date_from = new Date(today)
  localFilters.date_to = new Date(today)
  applyFilters()
}

const setLastWeek = () => {
  const today = new Date()
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  localFilters.date_from = lastWeek
  localFilters.date_to = today
  applyFilters()
}

const setLastMonth = () => {
  const today = new Date()
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  localFilters.date_from = lastMonth
  localFilters.date_to = today
  applyFilters()
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

const updateChart = () => {
  // Chart به صورت خودکار با computed به‌روزرسانی میشه
}

const viewMaterial = (data) => {
  router.push({
    name: 'inventory.index',
    query: { view: data.material_id }
  })
}

const exportPDF = async () => {
  exporting.value = true
  try {
    emit('export', { type: 'pdf', data: {
        consumption: consumptionData.value,
        total: totalItems.value,
        value: totalConsumptionValue.value
      }})
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
    emit('export', { type: 'excel', data: {
        consumption: consumptionData.value,
        total: totalItems.value,
        value: totalConsumptionValue.value
      }})
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

const getConsumptionPercentage = (data) => {
  if (totalConsumptionQuantity.value === 0) return 0
  return Math.round((data.quantity / totalConsumptionQuantity.value) * 100)
}

const getConsumptionClass = (data) => {
  const percent = getConsumptionPercentage(data)
  if (percent > 30) return 'consumption-high'
  if (percent > 15) return 'consumption-medium'
  return 'consumption-low'
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.filters, () => {
  lazyParams.first = 0
  loadData()
}, { deep: true })

watch(() => localFilters.date_from, () => {
  if (localFilters.date_from && localFilters.date_to) {
    loadData()
  }
})

watch(() => localFilters.date_to, () => {
  if (localFilters.date_from && localFilters.date_to) {
    loadData()
  }
})

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  const today = new Date()
  const lastMonth = new Date(today)
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  localFilters.date_from = lastMonth
  localFilters.date_to = today

  loadCategories()
  loadProjects()
  loadData()
})

// onUnmounted(() => {
//   if (searchTimeout) {
//     clearTimeout(searchTimeout)
//   }
// })
</script>

<style scoped>
.consumption-report {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* ============ COMPACT MODE ============ */
.consumption-report.compact {
  padding: 0.5rem;
  background: transparent;
}

.consumption-report.compact .report-header {
  display: none;
}

.consumption-report.compact .summary-cards {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.consumption-report.compact .summary-card {
  padding: 0.5rem;
}

.consumption-report.compact .card-icon {
  width: 32px;
  height: 32px;
  font-size: 0.8rem;
}

.consumption-report.compact .card-value {
  font-size: 0.9rem;
}

.consumption-report.compact .card-label {
  font-size: 0.65rem;
}

.consumption-report.compact .date-filter-bar {
  padding: 0.5rem;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.consumption-report.compact .date-range {
  flex-wrap: wrap;
}

.consumption-report.compact .date-range .compact-date-picker {
  max-width: 100px;
}

.consumption-report.compact .quick-buttons {
  display: flex;
  gap: 0.25rem;
}

.consumption-report.compact .compact-quick button {
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
}

.consumption-report.compact .filter-actions {
  flex-direction: row;
}

.consumption-report.compact .project-select,
.consumption-report.compact .category-select {
  min-width: 100% !important;
  flex: 1;
}

.consumption-report.compact .table-container {
  border-radius: 6px;
}

.consumption-report.compact .consumption-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.3rem 0.4rem;
  font-size: 0.8rem;
}

.consumption-report.compact .chart-container {
  display: none;
}

.consumption-report.compact .report-footer {
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

/* ============ DATE FILTER ============ */
.date-filter-bar {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-range label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.date-range .p-datepicker {
  max-width: 150px;
}

.quick-buttons {
  display: flex;
  gap: 0.25rem;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.project-select,
.category-select {
  min-width: 180px;
}

/* ============ TABLE ============ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
}

.consumption-table {
  width: 100%;
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

.quantity {
  font-weight: 600;
  color: #f59e0b;
}

.total-value {
  font-weight: 600;
  color: #1f2937;
}

.consumption-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bar-fill {
  height: 8px;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: 10px;
}

.consumption-high { background: #ef4444; }
.consumption-medium { background: #f59e0b; }
.consumption-low { background: #22c55e; }

.bar-label {
  font-size: 0.7rem;
  color: #6b7280;
  min-width: 40px;
}

.projects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.project-tag {
  font-size: 0.65rem;
}

.transactions-count {
  font-weight: 600;
  color: #3b82f6;
}

/* ============ CHART ============ */
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.chart-type-select {
  min-width: 150px;
}

.chart-wrapper {
  height: 350px;
  position: relative;
}

.consumption-chart {
  height: 100%;
  width: 100%;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.5rem;
  color: #9ca3af;
}

.chart-placeholder p {
  margin: 0;
  font-size: 0.875rem;
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

.update-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .date-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .date-range {
    flex-wrap: wrap;
  }

  .filter-actions {
    flex-direction: column;
  }

  .project-select,
  .category-select {
    min-width: 100%;
  }

  .chart-wrapper {
    height: 250px;
  }
}

@media (max-width: 768px) {
  .consumption-report {
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

  .date-range .p-datepicker {
    max-width: 100px;
  }

  .quick-buttons {
    flex-wrap: wrap;
  }

  .report-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-stats {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .date-range .p-datepicker {
    max-width: 100%;
  }

  .date-range {
    flex-direction: column;
    align-items: stretch;
  }

  .chart-wrapper {
    height: 200px;
  }

  .consumption-report.compact .summary-cards {
    grid-template-columns: 1fr 1fr;
  }

  .consumption-report.compact .date-range {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .consumption-report.compact .date-range .compact-date-picker {
    max-width: 80px;
  }
}
</style>