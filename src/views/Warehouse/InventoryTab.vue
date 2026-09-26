<!-- resources/js/views/projects/InventoryTab.vue -->
<template>
  <div class="inventory-tab">
    <!-- Header -->
    <div class="tab-header">
      <div class="header-left">
        <h3>کالاهای مصرفی پروژه</h3>
        <span class="badge">{{ totalItems }} کالا</span>
      </div>
      <div class="header-right">
        <Button
            label="ثبت مصرف"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openConsumptionDialog"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            @click="loadData"
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
          <span class="stat-value">{{ totalItems }}</span>
          <span class="stat-label">کل کالاها</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="pi pi-check-circle" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ formatMoney(totalConsumption) }}</span>
          <span class="stat-label">کل مصرف</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="pi pi-clock" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ recentTransactionsCount }}</span>
          <span class="stat-label">تراکنش‌های اخیر</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ lowStockItems }}</span>
          <span class="stat-label">کالاهای با موجودی کم</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Filters -->
      <div class="filters-bar">
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
            @change="loadMaterials"
            show-clear
        />
        <Select
            v-model="filters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="وضعیت"
            class="filter-select"
            @change="loadMaterials"
            show-clear
        />
      </div>

      <!-- Materials Table -->
      <DataTable
          :value="materials"
          :loading="loading"
          stripedRows
          rowHover
          class="materials-table"
      >
        <Column field="code" header="کد" style="width: 100px;">
          <template #body="{ data }">
            <span class="code">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" header="نام کالا">
          <template #body="{ data }">
            <div class="material-info">
              <span class="name">{{ data.name }}</span>
              <Tag v-if="data.category" :value="data.category.name" severity="info" size="small" />
            </div>
          </template>
        </Column>

        <Column header="مصرف شده" style="width: 120px;">
          <template #body="{ data }">
            <span class="consumed">{{ data.consumed_quantity || 0 }} {{ data.unit || '' }}</span>
          </template>
        </Column>

        <Column header="موجودی فعلی" style="width: 120px;">
          <template #body="{ data }">
            <span :class="getStockClass(data)">
              {{ data.current_stock || 0 }} {{ data.unit || '' }}
            </span>
          </template>
        </Column>

        <Column header="وضعیت موجودی" style="width: 150px;">
          <template #body="{ data }">
            <div class="stock-status">
              <ProgressBar
                  :value="getStockPercentage(data)"
                  :showValue="true"
                  :class="getProgressClass(data)"
                  style="height: 8px;"
              />
            </div>
          </template>
        </Column>

        <Column header="عملیات" style="width: 120px;">
          <template #body="{ data }">
            <Button
                icon="pi pi-plus"
                text
                rounded
                severity="success"
                size="small"
                @click="openConsumptionDialog(data)"
                v-tooltip.top="'ثبت مصرف'"
            />
            <Button
                icon="pi pi-history"
                text
                rounded
                severity="info"
                size="small"
                @click="showTransactions(data)"
                v-tooltip.top="'تاریخچه مصرف'"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Empty State -->
      <div v-if="!loading && materials.length === 0" class="empty-state">
        <i class="pi pi-box text-4xl text-muted-color" />
        <p>هیچ کالایی برای این پروژه یافت نشد</p>
        <Button label="ثبت مصرف" icon="pi pi-plus" @click="openConsumptionDialog" />
      </div>
    </template>

    <!-- Consumption Dialog -->
    <Dialog
        v-model:visible="consumptionDialogVisible"
        :header="selectedMaterial ? 'ثبت مصرف کالا' : 'ثبت مصرف جدید'"
        modal
        :style="{ width: '550px' }"
    >
      <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
        {{ serverError }}
      </Message>

      <form @submit.prevent="submitConsumption" class="consumption-form">
        <div class="form-field">
          <label for="material_id" class="required">کالا</label>
          <Select
              id="material_id"
              v-model="consumptionForm.material_id"
              :options="availableMaterials"
              option-label="name"
              option-value="id"
              placeholder="انتخاب کالا"
              :invalid="!!errors.material_id"
              @change="clearFieldError('material_id')"
              class="w-full"
              filter
          >
            <template #option="slotProps">
              <div>
                <span class="font-semibold">{{ slotProps.option.name }}</span>
                <span class="text-muted-color mx-2">({{ slotProps.option.code }})</span>
                <span class="text-sm text-muted-color">موجودی: {{ slotProps.option.current_stock }}</span>
              </div>
            </template>
          </Select>
          <small v-if="errors.material_id" class="error-text">{{ errors.material_id[0] }}</small>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="quantity" class="required">تعداد</label>
            <InputNumber
                id="quantity"
                v-model="consumptionForm.quantity"
                placeholder="0"
                :min="0.01"
                :invalid="!!errors.quantity"
                @input="clearFieldError('quantity')"
                class="w-full"
            />
            <small v-if="errors.quantity" class="error-text">{{ errors.quantity[0] }}</small>
          </div>

          <div class="form-field">
            <label for="unit_price">قیمت واحد (ریال)</label>
            <InputNumber
                id="unit_price"
                v-model="consumptionForm.unit_price"
                placeholder="0"
                :min="0"
                :invalid="!!errors.unit_price"
                @input="clearFieldError('unit_price')"
                class="w-full"
                :use-grouping="true"
                locale="fa-IR"
            />
            <small v-if="errors.unit_price" class="error-text">{{ errors.unit_price[0] }}</small>
          </div>
        </div>

        <div class="form-field">
          <label for="wbs_item_id">آیتم WBS (اختیاری)</label>
          <Select
              id="wbs_item_id"
              v-model="consumptionForm.wbs_item_id"
              :options="wbsItems"
              option-label="name"
              option-value="id"
              placeholder="انتخاب آیتم WBS"
              class="w-full"
              filter
              show-clear
          />
          <small v-if="errors.wbs_item_id" class="error-text">{{ errors.wbs_item_id[0] }}</small>
        </div>

        <div class="form-field">
          <label for="transaction_date" class="required">تاریخ مصرف</label>
          <DatePicker
              id="transaction_date"
              v-model="consumptionForm.transaction_date"
              date-format="yy-mm-dd"
              show-icon
              :invalid="!!errors.transaction_date"
              @date-select="clearFieldError('transaction_date')"
              class="w-full"
          />
          <small v-if="errors.transaction_date" class="error-text">{{ errors.transaction_date[0] }}</small>
        </div>

        <div class="form-field">
          <label for="description" class="required">توضیحات</label>
          <Textarea
              id="description"
              v-model="consumptionForm.description"
              rows="3"
              placeholder="توضیحات مصرف کالا..."
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
              @click="closeConsumptionDialog"
              type="button"
              :disabled="submitting"
          />
          <Button
              label="ثبت مصرف"
              :icon="submitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
              type="submit"
              :loading="submitting"
          />
        </div>
      </form>
    </Dialog>

    <!-- Transactions History Dialog -->
    <Dialog
        v-model:visible="transactionsDialogVisible"
        header="تاریخچه مصرف کالا"
        modal
        :style="{ width: '800px' }"
    >
      <div v-if="selectedMaterial" class="transaction-history">
        <div class="material-info-header">
          <h4>{{ selectedMaterial.name }}</h4>
          <span class="code">{{ selectedMaterial.code }}</span>
          <Tag :value="selectedMaterial.category?.name || 'بدون دسته'" severity="info" size="small" />
        </div>

        <DataTable
            :value="transactions"
            :loading="transactionsLoading"
            stripedRows
            class="transactions-table"
        >
          <Column field="transaction_date" header="تاریخ">
            <template #body="{ data }">
              {{ formatDate(data.transaction_date) }}
            </template>
          </Column>
          <Column field="type" header="نوع">
            <template #body="{ data }">
              <Tag :value="data.type_label" :severity="data.type_severity" />
            </template>
          </Column>
          <Column field="quantity" header="تعداد">
            <template #body="{ data }">
              {{ data.quantity }} {{ selectedMaterial.unit || '' }}
            </template>
          </Column>
          <Column field="total_price" header="مبلغ">
            <template #body="{ data }">
              {{ formatMoney(data.total_price) }}
            </template>
          </Column>
          <Column field="description" header="توضیحات" />
          <Column field="creator.name" header="ثبت کننده" />
        </DataTable>
      </div>
    </Dialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import { wbsService } from '@/services/wbsService'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  },
  companyId: {
    type: [Number, String],
    required: true
  }
})

const confirm = useConfirm()
const toast = useToast()

// ============ State ============
const loading = ref(false)
const materials = ref([])
const categories = ref([])
const wbsItems = ref([])
const totalItems = ref(0)
const totalConsumption = ref(0)
const recentTransactionsCount = ref(0)
const lowStockItems = ref(0)

const consumptionDialogVisible = ref(false)
const transactionsDialogVisible = ref(false)
const selectedMaterial = ref(null)
const transactions = ref([])
const transactionsLoading = ref(false)
const submitting = ref(false)
const serverError = ref('')
const errors = ref({})

const filters = reactive({
  search: '',
  category_id: null,
  status: null
})

const statusOptions = [
  { label: 'همه', value: null },
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
]

const consumptionForm = reactive({
  material_id: null,
  quantity: null,
  unit_price: null,
  wbs_item_id: null,
  transaction_date: new Date(),
  description: ''
})

// ============ Computed ============
const availableMaterials = computed(() => {
  return materials.value.filter(m => m.status === 'active')
})

// ============ Methods ============
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadMaterials(),
      loadCategories(),
      loadWbsItems()
    ])
  } catch (error) {
    console.error('Error loading inventory data:', error)
  } finally {
    loading.value = false
  }
}

const loadMaterials = async () => {
  try {
    const params = {
      project_id: props.projectId,
      search: filters.search || undefined,
      category_id: filters.category_id || undefined,
      status: filters.status || undefined,
      per_page: 100
    }

    const response = await inventoryService.getProjectMaterials(props.projectId, params)
    materials.value = response.data.data || []
    totalItems.value = response.data.meta?.total || 0

    // محاسبه آمار
    totalConsumption.value = materials.value.reduce((sum, m) => sum + (m.consumed_quantity || 0), 0)
    lowStockItems.value = materials.value.filter(m => m.current_stock <= m.min_stock).length
    recentTransactionsCount.value = materials.value.reduce((sum, m) => sum + (m.transactions_count || 0), 0)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری کالاها با خطا مواجه شد',
      life: 3000
    })
    console.log('errrorrr',error)
  }
}

const loadCategories = async () => {
  try {
    const response = await inventoryService.getCategories({
      company_id: props.companyId,
      per_page: 100
    })
    categories.value = response.data.data || []
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadWbsItems = async () => {
  try {
    const response = await wbsService.list({
      project_id: props.projectId,
      all: 1
    })
    wbsItems.value = response.data.data || []
  } catch (error) {
    console.error('Error loading WBS items:', error)
  }
}

const openConsumptionDialog = (material = null) => {
  if (material) {
    consumptionForm.material_id = material.id
    consumptionForm.unit_price = material.unit_price || 0
  } else {
    consumptionForm.material_id = null
    consumptionForm.unit_price = null
  }
  consumptionForm.quantity = null
  consumptionForm.wbs_item_id = null
  consumptionForm.transaction_date = new Date()
  consumptionForm.description = ''
  errors.value = {}
  serverError.value = ''
  consumptionDialogVisible.value = true
}

const closeConsumptionDialog = () => {
  consumptionDialogVisible.value = false
  Object.assign(consumptionForm, {
    material_id: null,
    quantity: null,
    unit_price: null,
    wbs_item_id: null,
    transaction_date: new Date(),
    description: ''
  })
}

const submitConsumption = async () => {
  errors.value = {}
  serverError.value = ''
  submitting.value = true

  try {
    const formatDate = (date) => {
      if (!date) return null
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
      return date
    }

    const payload = {
      company_id: props.companyId,
      material_id: consumptionForm.material_id,
      project_id: props.projectId,
      wbs_item_id: consumptionForm.wbs_item_id || null,
      type: 'sale', // مصرف به عنوان فروش ثبت میشود
      quantity: consumptionForm.quantity || 0,
      unit_price: consumptionForm.unit_price || 0,
      total_price: (consumptionForm.quantity || 0) * (consumptionForm.unit_price || 0),
      transaction_date: formatDate(consumptionForm.transaction_date),
      description: consumptionForm.description
    }

    await inventoryService.createTransaction(payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'مصرف کالا با موفقیت ثبت شد',
      life: 3000
    })

    closeConsumptionDialog()
    await loadMaterials()
  } catch (error) {
    console.error('Error:', error)
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'
    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
    }
  } finally {
    submitting.value = false
  }
}

const showTransactions = async (material) => {
  selectedMaterial.value = material
  transactionsDialogVisible.value = true
  await loadTransactions(material.id)
}

const loadTransactions = async (materialId) => {
  transactionsLoading.value = true
  try {
    const response = await inventoryService.getProjectConsumption(materialId, {
      project_id: props.projectId,
      per_page: 50
    })
    transactions.value = response.data.data || []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری تاریخچه مصرف با خطا مواجه شد',
      life: 3000
    })
  } finally {
    transactionsLoading.value = false
  }
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
  if (serverError.value) {
    serverError.value = ''
  }
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadMaterials()
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

// ============ Watch ============
watch(() => props.projectId, () => {
  loadData()
})

// ============ Lifecycle ============
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.inventory-tab {
  padding: 0.5rem;
}

/* Header */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-left h3 {
  font-size: 1.1rem;
  font-weight: 600;
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

.header-right {
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
.stat-icon.orange { background: #f59e0b; }
.stat-icon.red { background: #ef4444; }

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
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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

/* Table */
.materials-table {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.code {
  font-size: 0.85rem;
  color: #4f46e5;
  font-weight: 600;
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

.consumed {
  font-weight: 600;
  color: #f59e0b;
}

.stock-critical { color: #ef4444; font-weight: 600; }
.stock-warning { color: #f59e0b; font-weight: 600; }
.stock-good { color: #22c55e; font-weight: 600; }

.stock-status {
  width: 100%;
  max-width: 120px;
}

:deep(.progress-critical .p-progressbar-value) {
  background: #ef4444;
}

:deep(.progress-warning .p-progressbar-value) {
  background: #f59e0b;
}

:deep(.progress-success .p-progressbar-value) {
  background: #22c55e;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
}

.empty-state i {
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

/* Consumption Form */
.consumption-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Transaction History */
.material-info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.material-info-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.material-info-header .code {
  color: #6b7280;
  font-size: 0.85rem;
}

.transactions-table {
  max-height: 400px;
  overflow: auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .filters-bar {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    grid-template-columns: 1fr 1fr;
  }

  .header-left {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }

  .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>