<!-- resources/js/views/projects/ContractTab.vue -->
<template>
  <div class="contract-tab">
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-number">{{ contracts.length }}</span>
        <span class="stat-label">کل قراردادها</span>
      </div>
      <div class="stat-box">
        <span class="stat-number text-success">{{ activeContracts }}</span>
        <span class="stat-label">فعال</span>
      </div>
      <div class="stat-box">
        <span class="stat-number text-warning">{{ pendingContracts }}</span>
        <span class="stat-label">در انتظار تایید</span>
      </div>
      <div class="stat-box">
        <span class="stat-number text-info">{{ completedContracts }}</span>
        <span class="stat-label">تکمیل شده</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <Button
          v-if="canCreatecontracts"
          label="قرارداد جدید"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openCreateDialog"
      />

      <div class="filters">
        <Select
            v-model="filters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="وضعیت"
            class="filter-dropdown"
            @change="loadContracts"
            showClear
        />
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search"/>
          <InputText
              v-model="filters.search"
              placeholder="جستجو..."
              @input="debouncedSearch"
          />
        </IconField>
      </div>
    </div>

    <!-- Contracts Table -->
    <DataTable
        :value="contracts"
        :loading="loading"
        stripedRows
        rowHover
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        class="contracts-table"
        @page="onPage"
    >
      <Column field="contract_number" header="شماره" style="width: 120px;">
        <template #body="{ data }">
          <span class="font-semibold">#{{ data.contract_number }}</span>
        </template>
      </Column>

      <Column field="title" header="عنوان"/>

      <Column field="contractor" header="پیمانکار">
        <template #body="{ data }">
          {{ data.contractor?.name || '-' }}
        </template>
      </Column>

      <Column field="amount" header="مبلغ" style="width: 150px;">
        <template #body="{ data }">
          {{ formatMoney(data.amount) }}
        </template>
      </Column>

      <Column field="progress_percent" header="پیشرفت" style="width: 150px;">
        <template #body="{ data }">
          <ProgressBar :value="data.progress_percent || 0" :showValue="true"/>
        </template>
      </Column>

      <Column field="status" header="وضعیت" style="width: 120px;">
        <template #body="{ data }">
          <Tag :value="data.status_label" :severity="data.status_severity"/>
        </template>
      </Column>

      <Column field="end_date" header="تاریخ پایان" style="width: 120px;">
        <template #body="{ data }">
          <span :class="{ 'text-red-500': data.is_overdue }">
            {{ formatDate(data.end_date) }}
          </span>
        </template>
      </Column>

      <Column header="عملیات" style="width: 120px;">
        <template #body="{ data }">
          <Button
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              @click="viewContract(data.id)"
              v-tooltip.top="'جزئیات'"
          />
          <Button
              v-if="canUpdatecontracts"
              icon="pi pi-pencil"
              text
              rounded
              severity="warning"
              @click="openEditDialog(data)"
              v-tooltip.top="'ویرایش'"
          />
          <Button
              v-if="canDeletecontracts"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="confirmDelete(data)"
              v-tooltip.top="'حذف'"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Contract Form Dialog -->
    <ContractForm
        v-model:visible="formDialogVisible"
        :contract-id="editingId"
        @saved="onFormSuccess"
    />

  </div>
</template>

<script setup>
import {ref, reactive, computed, onMounted, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useConfirm} from 'primevue/useconfirm'
import {useToast} from 'primevue/usetoast'
import {contractService} from '@/services/ContractService.js'
import ContractForm from './ContractForm.vue'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// State
const contracts = ref([])
const loading = ref(false)
const formDialogVisible = ref(false)
const editingId = ref(null)

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatecontracts = computed(() => can('contracts.update'))
const canDeletecontracts = computed(() => can('contracts.delete'))
const canCreatecontracts = computed(() => can('contracts.create'))

const filters = reactive({
  status: null,
  search: ''
})

const lazyParams = reactive({
  first: 0,
  rows: 10
})

const statusOptions = [
  {label: 'پیش‌نویس', value: 'draft'},
  {label: 'در انتظار تایید', value: 'pending'},
  {label: 'فعال', value: 'active'},
  {label: 'تکمیل شده', value: 'completed'},
  {label: 'لغو شده', value: 'cancelled'},
  {label: 'متوقف', value: 'suspended'}
]

// Computed
const activeContracts = computed(() =>
    contracts.value.filter(c => c.status === 'active').length
)
const pendingContracts = computed(() =>
    contracts.value.filter(c => c.status === 'pending').length
)
const completedContracts = computed(() =>
    contracts.value.filter(c => c.status === 'completed').length
)

// Methods
const loadContracts = async () => {
  loading.value = true
  try {
    const params = {
      project_id: props.projectId,
      page: Math.floor(lazyParams.first / lazyParams.rows) + 1,
      per_page: lazyParams.rows
    }
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search

    const response = await contractService.list(params)
    contracts.value = response.data.data || []
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
  router.push({name: 'contracts.detail', params: {id}})
}

const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
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

// Watch
watch(() => props.projectId, () => {
  lazyParams.first = 0
  loadContracts()
})

onMounted(() => {
  loadContracts()
})
</script>

<style scoped>
.contract-tab {
  padding: 1rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.text-success {
  color: #22c55e;
}

.text-warning {
  color: #f59e0b;
}

.text-info {
  color: #3b82f6;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-dropdown {
  min-width: 140px;
}

.contracts-table {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-wrap: wrap;
  }

  .filter-dropdown {
    min-width: 100%;
  }
}
</style>