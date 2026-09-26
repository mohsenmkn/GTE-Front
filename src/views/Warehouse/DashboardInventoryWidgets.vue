
<template>
  <div class="dashboard-inventory-widgets">
    <!-- ============ HEADER ============ -->
    <div class="widgets-header">
      <div class="header-left">
        <i class="pi pi-box text-xl text-primary" />
        <h3>وضعیت انبار</h3>
        <span class="badge">{{ lastUpdate }}</span>
      </div>
      <div class="header-right">
        <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            @click="refreshAll"
            :loading="refreshing"
            v-tooltip.top="'بروزرسانی همه'"
        />
        <Button
            icon="pi pi-arrow-left"
            text
            rounded
            size="small"
            @click="$router.push({ name: 'inventory.index' })"
            v-tooltip.top="'مدیریت انبار'"
        />
      </div>
    </div>

    <!-- ============ SUMMARY CARDS ============ -->
    <div class="summary-row">
      <div class="summary-item" @click="goToStockReport">
        <div class="item-icon blue">
          <i class="pi pi-box" />
        </div>
        <div class="item-content">
          <span class="item-value">{{ formatNumber(totalMaterials) }}</span>
          <span class="item-label">کل کالاها</span>
        </div>
      </div>
      <div class="summary-item" @click="goToStockReport">
        <div class="item-icon green">
          <i class="pi pi-dollar" />
        </div>
        <div class="item-content">
          <span class="item-value">{{ formatMoney(totalStockValue) }}</span>
          <span class="item-label">ارزش کل موجودی</span>
        </div>
      </div>
      <div class="summary-item" @click="goToLowStockReport">
        <div class="item-icon red">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <div class="item-content">
          <span class="item-value text-danger">{{ lowStockCount }}</span>
          <span class="item-label">موجودی کم</span>
        </div>
      </div>
      <div class="summary-item" @click="goToConsumptionReport">
        <div class="item-icon orange">
          <i class="pi pi-chart-line" />
        </div>
        <div class="item-content">
          <span class="item-value">{{ formatNumber(monthlyConsumption) }}</span>
          <span class="item-label">مصرف ماهانه</span>
        </div>
      </div>
    </div>

    <!-- ============ WIDGETS GRID ============ -->
    <div class="widgets-grid">
      <!-- Widget 1: Stock Report (Compact) -->
      <div class="widget-card stock-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="pi pi-warehouse text-primary" />
            <span>گزارش موجودی</span>
          </div>
          <Button
              icon="pi pi-arrow-left"
              text
              rounded
              size="small"
              @click="goToStockReport"
              v-tooltip.top="'مشاهده کامل'"
          />
        </div>
        <div class="widget-body">
          <StockReport
              :compact="true"
              :hide-header="true"
              :hide-footer="true"
              @loaded="onStockLoaded"
              @error="onError"
          />
        </div>
      </div>

      <!-- Widget 2: Low Stock Report (Compact) -->
      <div class="widget-card low-stock-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="pi pi-exclamation-triangle text-danger" />
            <span>موجودی کم</span>
            <span v-if="lowStockCount > 0" class="alert-badge">{{ lowStockCount }}</span>
          </div>
          <Button
              icon="pi pi-arrow-left"
              text
              rounded
              size="small"
              @click="goToLowStockReport"
              v-tooltip.top="'مشاهده کامل'"
          />
        </div>
        <div class="widget-body">
          <LowStockReport
              :compact="true"
              :hide-header="true"
              :hide-footer="true"
              @loaded="onLowStockLoaded"
              @error="onError"
              @alert-sent="onAlertSent"
          />
        </div>
      </div>

      <!-- Widget 3: Consumption Report (Compact) -->
      <div class="widget-card consumption-widget">
        <div class="widget-header">
          <div class="widget-title">
            <i class="pi pi-chart-line text-success" />
            <span>مصرف ۳۰ روز اخیر</span>
          </div>
          <Button
              icon="pi pi-arrow-left"
              text
              rounded
              size="small"
              @click="goToConsumptionReport"
              v-tooltip.top="'مشاهده کامل'"
          />
        </div>
        <div class="widget-body">
          <ConsumptionReport
              :compact="true"
              :hide-header="true"
              :hide-footer="true"
              @loaded="onConsumptionLoaded"
              @error="onError"
          />
        </div>
      </div>
    </div>

    <!-- ============ LOADING OVERLAY ============ -->
    <div v-if="loading" class="loading-overlay">
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import StockReport from '@/views/Warehouse/StockReport.vue'
import LowStockReport from '@/views/Warehouse/LowStockReport.vue'
import ConsumptionReport from '@/views/Warehouse/ConsumptionReport.vue'
import { inventoryService } from '@/services/inventoryService'

// ============================================
// COMPOSABLES
// ============================================
const router = useRouter()
const toast = useToast()

// ============================================
// STATE
// ============================================
const loading = ref(false)
const refreshing = ref(false)
const lastUpdate = ref(new Date().toLocaleTimeString('fa-IR'))

// داده‌های خلاصه
const totalMaterials = ref(0)
const totalStockValue = ref(0)
const lowStockCount = ref(0)
const monthlyConsumption = ref(0)

// داده‌های ویجت‌ها
const stockData = ref(null)
const lowStockData = ref(null)
const consumptionData = ref(null)

// ============================================
// COMPUTED
// ============================================
const hasLowStock = computed(() => lowStockCount.value > 0)

// ============================================
// METHODS - LOAD DATA
// ============================================
const loadSummaryData = async () => {
  try {
    // دریافت خلاصه موجودی
    const stockResponse = await inventoryService.getStockReport({ per_page: 1 })
    const stockReport = stockResponse.data

    totalMaterials.value = stockReport.total_materials || 0
    totalStockValue.value = stockReport.total_stock_value || 0

    // دریافت گزارش موجودی کم
    const lowStockResponse = await inventoryService.getLowStockReport({ per_page: 1 })
    lowStockCount.value = lowStockResponse.data.total_low_stock_items || 0

    // دریافت مصرف ماهانه
    const today = new Date()
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const consumptionResponse = await inventoryService.getConsumptionReport({
      date_from: lastMonth.toISOString().split('T')[0],
      date_to: today.toISOString().split('T')[0],
      per_page: 1
    })
    monthlyConsumption.value = consumptionResponse.data.total_value || 0

    lastUpdate.value = new Date().toLocaleTimeString('fa-IR')
  } catch (error) {
    console.error('Error loading summary data:', error)
  }
}

const refreshAll = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadSummaryData(),
      // ویجت‌ها خودشان به‌روزرسانی میشن
    ])
    toast.add({
      severity: 'success',
      summary: 'بروزرسانی',
      detail: 'داده‌های انبار با موفقیت بروزرسانی شد',
      life: 2000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بروزرسانی داده‌ها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    refreshing.value = false
  }
}

// ============================================
// METHODS - EVENT HANDLERS
// ============================================
const onStockLoaded = (data) => {
  stockData.value = data
  // به‌روزرسانی آمار
  if (data.data && data.data.length > 0) {
    totalMaterials.value = data.data.length
    totalStockValue.value = data.data.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0)
  }
}

const onLowStockLoaded = (data) => {
  lowStockData.value = data
  if (data.data) {
    lowStockCount.value = data.data.length
  }
}

const onConsumptionLoaded = (data) => {
  consumptionData.value = data
  if (data.data) {
    monthlyConsumption.value = data.data.reduce((sum, item) => sum + (item.total_price || 0), 0)
  }
}

const onError = (error) => {
  console.error('Widget error:', error)
  toast.add({
    severity: 'error',
    summary: 'خطا',
    detail: 'بارگذاری داده‌های ویجت با خطا مواجه شد',
    life: 3000
  })
}

const onAlertSent = (data) => {
  toast.add({
    severity: 'success',
    summary: 'هشدار ارسال شد',
    detail: `${data.count} هشدار با موفقیت ارسال شد`,
    life: 4000
  })
}

// ============================================
// METHODS - NAVIGATION
// ============================================
const goToStockReport = () => {
  router.push({ name: 'inventory.reports.stock' })
}

const goToLowStockReport = () => {
  router.push({ name: 'inventory.reports.low-stock' })
}

const goToConsumptionReport = () => {
  router.push({ name: 'inventory.reports.consumption' })
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

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  loadSummaryData()
})

// بروزرسانی هر ۵ دقیقه
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    loadSummaryData()
  }, 300000)
})

// پاک کردن interval در هنگام unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.dashboard-inventory-widgets {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  position: relative;
}

/* ============ HEADER ============ */
.widgets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-left .badge {
  font-size: 0.65rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.header-right {
  display: flex;
  gap: 0.25rem;
}

/* ============ SUMMARY ROW ============ */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.summary-item {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.summary-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.item-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-icon.blue { background: #3b82f6; }
.item-icon.green { background: #22c55e; }
.item-icon.red { background: #ef4444; }
.item-icon.orange { background: #f59e0b; }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.item-value.text-danger {
  color: #ef4444;
}

.item-label {
  font-size: 0.65rem;
  color: #6b7280;
}

/* ============ WIDGETS GRID ============ */
.widgets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.widget-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  max-height: 400px;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1f2937;
}

.widget-title .alert-badge {
  background: #ef4444;
  color: white;
  font-size: 0.6rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  margin-right: 0.25rem;
}

.widget-body {
  flex: 1;
  overflow: auto;
  padding: 0.5rem;
  min-height: 200px;
}

/* ============ WIDGET CUSTOM STYLES ============ */
.stock-widget .widget-body {
  padding: 0.25rem;
}

.low-stock-widget .widget-body {
  padding: 0.25rem;
}

.low-stock-widget .widget-title .pi-exclamation-triangle {
  color: #ef4444;
}

.consumption-widget .widget-body {
  padding: 0.25rem;
}

/* ============ LOADING ============ */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* ============ SCROLLBAR ============ */
.widget-body::-webkit-scrollbar {
  width: 4px;
}

.widget-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.widget-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.widget-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1400px) {
  .widgets-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 1024px) {
  .summary-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .widget-card {
    max-height: 350px;
  }
}

@media (max-width: 768px) {
  .dashboard-inventory-widgets {
    padding: 0.75rem;
  }

  .summary-row {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .summary-item {
    padding: 0.5rem 0.75rem;
  }

  .item-value {
    font-size: 0.85rem;
  }

  .widgets-grid {
    grid-template-columns: 1fr;
  }

  .widget-card {
    max-height: 300px;
  }
}

@media (max-width: 480px) {
  .summary-row {
    grid-template-columns: 1fr 1fr;
  }

  .widgets-header {
    flex-wrap: wrap;
  }

  .widgets-header .header-left .badge {
    display: none;
  }
}
</style>