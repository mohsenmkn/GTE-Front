<!-- resources/js/views/projects/PettyCashTab.vue -->
<template>
  <div class="petty-cash-tab">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <div v-else>
      <!-- اگر تنخواه وجود ندارد -->
      <div v-if="!pettyCash" class="empty-state">
        <i class="pi pi-wallet text-4xl text-muted-color" />
        <p class="text-muted-color">هیچ تنخواهی برای این پروژه تعریف نشده است</p>
        <Button
            v-if="canCreatepettycash"
            label="ایجاد تنخواه"
            severity="primary"
            @click="openCreateDialog"
        />
      </div>

      <!-- اگر تنخواه وجود دارد -->
      <div v-else>
        <!-- Summary Cards -->
        <div class="summary-cards">

          <div class="summary-cards">
              <div class="summary-card">
                <div class="card-icon"><i class="pi pi-dollar" /></div>
                <div class="card-content">
                  <span class="card-label">موجودی اولیه</span>
                  <!-- ✅ استفاده از initial_amount -->
                  <span class="card-value">{{ formatMoney(pettyCash.initial_amount) }}</span>
                </div>
              </div>
            </div>

          <div class="summary-card">
            <div class="card-icon"><i class="pi pi-money-bill" /></div>
            <div class="card-content">
              <span class="card-label">موجودی فعلی</span>
              <span class="card-value" :class="getBalanceClass(pettyCash.current_balance)">
              {{ formatMoney(pettyCash.current_balance) }}
            </span>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon"><i class="pi pi-arrow-up" /></div>
            <div class="card-content">
              <span class="card-label">سقف تنخواه</span>
              <span class="card-value">{{ formatMoney(pettyCash.ceiling) }}</span>
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon"><i class="pi pi-arrow-up" /></div>
            <div class="card-content">
              <span class="card-label">وضعیت</span>
              <Tag :value="pettyCash.is_active ? 'فعال' : 'غیرفعال'"
                   :severity="pettyCash.is_active ? 'success' : 'danger'" />
            </div>
          </div>

          <div class="summary-card">
            <div class="card-icon"><i class="pi pi-list" /></div>
            <div class="card-content">
              <span class="card-label">تعداد تراکنش‌ها</span>
              <span class="card-value">{{ pettyCash.transactions_count || 0 }}</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="ceiling-progress">
            <div class="progress-header">
              <span>درصد مصرف از موجودی اولیه</span>
              <span>{{ usagePercent }}%</span>
            </div>
            <ProgressBar :value="usagePercent" :class="getProgressClass()" />
            <div class="progress-details">
              <span>مصرف شده: {{ formatMoney(pettyCash.initial_amount - pettyCash.current_balance) }}</span>
              <span>باقی‌مانده: {{ formatMoney(pettyCash.current_balance) }}</span>
            </div>
          </div>

        </div>



        <!-- Transactions Toolbar -->
        <div class="toolbar">
          <Button
              v-if="canCreatepettycash"
              label="تراکنش جدید"
              icon="pi pi-plus"
              severity="success"
              size="small"
              @click="openTransactionDialog(null)"
          />
          <div class="filters">
            <Select
                v-model="filters.type"
                :options="transactionTypes"
                option-label="label"
                option-value="value"
                placeholder="نوع تراکنش"
                class="filter-dropdown"
                @change="loadTransactions"
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

        <!-- Transactions Table -->
        <DataTable
            :value="transactions"
            :loading="transactionsLoading"
            :lazy="true"
            :totalRecords="totalRecords"
            :rows="lazyParams.rows"
            :first="lazyParams.first"
            @page="onPage"
            @sort="onSort"
            stripedRows
            rowHover
            paginator
            :rowsPerPageOptions="[10, 25, 50]"
            class="transactions-table"
        >
          <Column field="transaction_date" header="تاریخ" sortable>
            <template #body="{ data }">
              {{ formatDate(data.transaction_date) }}
            </template>
          </Column>

          <Column field="type" header="نوع" sortable>
            <template #body="{ data }">
              <Tag :value="getTypeLabel(data.type)" :severity="getTypeSeverity(data.type)" />
            </template>
          </Column>

          <Column field="amount" header="مبلغ" sortable>
            <template #body="{ data }">
              <span :class="data.type === 'expense' ? 'text-red-500' : 'text-green-500'">
                {{ data.type === 'expense' ? '-' : '+' }}
                {{ formatMoney(data.amount) }}
              </span>
            </template>
          </Column>

          <Column field="wbs_item" header="WBS">
            <template #body="{ data }">
              <span v-if="data.wbs_item">{{ data.wbs_item.code }} - {{ data.wbs_item.name }}</span>
              <span v-else class="text-muted-color">-</span>
            </template>
          </Column>

          <Column field="description" header="توضیحات" />

          <Column field="created_by" header="ثبت کننده" />

          <Column header="عملیات" style="min-width: 100px;">
            <template #body="{ data }">
              <Button
                  v-if="canDeletepettycash"
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  size="small"
                  @click="confirmDeleteTransaction(data)"
                  v-tooltip.top="'حذف'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Create/Edit Petty Cash Dialog -->
    <PettyCashForm
        v-model:visible="formDialogVisible"
        :project-id="projectId"
        :petty-cash-id="editingId"
        @saved="onFormSuccess"
    />

    <!-- Create Transaction Dialog -->
    <PettyCashTransactionForm
        v-model:visible="transactionDialogVisible"
        :petty-cash-id="pettyCash?.id"
        :wbs-items="wbsItems"
        @saved="onTransactionSuccess"
    />

    <!-- Delete Confirmation -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { pettyCashService } from '@/services/pettyCashService'
import { wbsService } from '@/services/wbsService'
import PettyCashForm from './PettyCashForm.vue'
import PettyCashTransactionForm from './PettyCashTransactionForm.vue'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()


const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const confirm = useConfirm()
const toast = useToast()

// State
const pettyCash = ref(null)
const loading = ref(false)
const transactions = ref([])
const transactionsLoading = ref(false)
const totalRecords = ref(0)
const wbsItems = ref([])
const formDialogVisible = ref(false)
const transactionDialogVisible = ref(false)
const editingId = ref(null)


const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatepettycash = computed(() => can('pettycash.update'))
const canDeletepettycash = computed(() => can('pettycash.delete'))
const canCreatepettycash = computed(() => can('pettycash.create'))


const filters = reactive({
  type: null,
  search: ''
})

const lazyParams = reactive({
  first: 0,
  rows: 10,
  sortField: null,
  sortOrder: null
})

const transactionTypes = [
  { label: 'هزینه', value: 'expense' },
  { label: 'تامین مجدد', value: 'replenishment' },
  { label: 'تعدیل', value: 'adjustment' }
]

const usagePercent = computed(() => {
  if (!pettyCash.value || !pettyCash.value.initial_amount) return 0
  // ✅ استفاده از initial_amount به جای ceiling
  const used = pettyCash.value.initial_amount - pettyCash.value.current_balance
  return Math.round((used / pettyCash.value.initial_amount) * 100)
})

// Methods
const loadPettyCash = async () => {
  loading.value = true
  try {
    const response = await pettyCashService.list({
      project_id: props.projectId,
      per_page: 1
    })
    // اگر تنخواه وجود دارد
    if (response.data.data && response.data.data.length > 0) {
      pettyCash.value = response.data.data[0]
      await loadTransactions()
      await loadWbsItems()
    } else {
      pettyCash.value = null
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری تنخواه با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const loadTransactions = async () => {
  if (!pettyCash.value) return

  transactionsLoading.value = true
  try {
    const params = {
      page: Math.floor(lazyParams.first / lazyParams.rows) + 1,
      per_page: lazyParams.rows
    }
    if (filters.type) params.type = filters.type
    if (filters.search) params.search = filters.search

    const response = await pettyCashService.getTransactions(pettyCash.value.id, params)
    transactions.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری تراکنش‌ها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    transactionsLoading.value = false
  }
}

const loadWbsItems = async () => {
  try {
    const response = await wbsService.list({
      project_id: props.projectId,
      per_page: 100
    })
    wbsItems.value = response.data.data || []
  } catch (error) {
    console.error('Error loading WBS items:', error)
  }
}

const openCreateDialog = () => {
  editingId.value = null
  formDialogVisible.value = true
}

const openTransactionDialog = () => {
  transactionDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadPettyCash()
}

const onTransactionSuccess = () => {
  transactionDialogVisible.value = false
  loadPettyCash() // برای بروزرسانی موجودی
  loadTransactions()
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

const confirmDeleteTransaction = (transaction) => {
  confirm.require({
    message: `آیا از حذف تراکنش "${transaction.description}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await pettyCashService.deleteTransaction(pettyCash.value.id, transaction.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تراکنش با موفقیت حذف شد',
          life: 3000
        })
        loadPettyCash()
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

// Helpers
const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' ریال'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getTypeLabel = (type) => {
  const labels = {
    expense: 'هزینه',
    replenishment: 'تامین مجدد',
    adjustment: 'تعدیل'
  }
  return labels[type] || type
}

const getTypeSeverity = (type) => {
  const severities = {
    expense: 'danger',
    replenishment: 'success',
    adjustment: 'warning'
  }
  return severities[type] || 'secondary'
}

const getBalanceClass = (balance) => {
  if (balance < 0) return 'text-red-500'
  if (balance < 100000) return 'text-yellow-500'
  return 'text-green-600'
}

const getProgressClass = () => {
  const percent = usagePercent.value
  if (percent >= 90) return 'progress-danger'
  if (percent >= 70) return 'progress-warning'
  return 'progress-success'
}

onMounted(() => {
  loadPettyCash()
})

// Watch for project change
watch(() => props.projectId, () => {
  loadPettyCash()
})
</script>

<style scoped>
.petty-cash-tab {
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: white;
  border-radius: 6px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
  font-size: 1.25rem;
}

.card-content {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
}

.card-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1f2937;
}

.ceiling-progress {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-dropdown {
  min-width: 140px;
}

.transactions-table {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

:deep(.progress-success .p-progressbar-value) {
  background: #22c55e;
}

:deep(.progress-warning .p-progressbar-value) {
  background: #f59e0b;
}

:deep(.progress-danger .p-progressbar-value) {
  background: #ef4444;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>