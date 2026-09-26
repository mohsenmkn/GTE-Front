<!-- resources/js/views/contracts/ContractDetail.vue -->
<template>
  <div class="contract-detail">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="contract">
      <!-- Header -->
      <div class="detail-header">
        <div class="header-left">
          <Button
              icon="pi pi-arrow-right"
              text
              rounded
              @click="$router.push({ name: 'contracts.index' })"
          />
          <div>
            <h1>{{ contract.title }}</h1>
            <div class="header-meta">
              <span class="contract-number">#{{ contract.contract_number }}</span>
              <Tag :value="contract.status_label" :severity="contract.status_severity" />
              <Tag :value="contract.type_label" :severity="getTypeSeverity(contract.type)" />
            </div>
          </div>
        </div>

        <div class="header-actions">
          <Button
              v-if="contract.status !== 'completed' && contract.status !== 'cancelled'"
              label="تغییر وضعیت"
              icon="pi pi-sync"
              severity="warning"
              @click="showStatusDialog = true"
          />
          <Button
              label="ویرایش"
              icon="pi pi-pencil"
              severity="info"
              @click="openEditDialog"
          />
          <Button
              v-if="contract.status !== 'active'"
              label="حذف"
              icon="pi pi-trash"
              severity="danger"
              @click="confirmDelete"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon"><i class="pi pi-dollar" /></div>
          <div class="card-content">
            <span class="card-label">مبلغ کل</span>
            <span class="card-value">{{ formatMoney(contract.amount) }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon"><i class="pi pi-check-circle" /></div>
          <div class="card-content">
            <span class="card-label">پرداخت شده</span>
            <span class="card-value text-success">{{ formatMoney(contract.paid_amount) }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon"><i class="pi pi-clock" /></div>
          <div class="card-content">
            <span class="card-label">باقی‌مانده</span>
            <span class="card-value text-warning">{{ formatMoney(contract.remaining_amount) }}</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon"><i class="pi pi-percentage" /></div>
          <div class="card-content">
            <span class="card-label">پیشرفت</span>
            <span class="card-value">{{ contract.progress_percent || 0 }}%</span>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section">
        <ProgressBar :value="contract.progress_percent || 0" :showValue="true" />
      </div>

      <!-- Main Content -->
      <div class="detail-content">
        <TabView>
          <!-- اطلاعات کلی -->
          <TabPanel header="اطلاعات کلی">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">پروژه</span>
                <span class="value">{{ contract.project?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">پیمانکار</span>
                <span class="value">{{ contract.contractor?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">تاریخ شروع</span>
                <span class="value">{{ formatDate(contract.start_date) }}</span>
              </div>
              <div class="info-item">
                <span class="label">تاریخ پایان</span>
                <span class="value" :class="{ 'text-red-500': contract.is_overdue }">
                  {{ formatDate(contract.end_date) }}
                  <span v-if="contract.is_overdue" class="overdue-badge">(تاریخ گذشته)</span>
                </span>
              </div>
              <div class="info-item full-width">
                <span class="label">توضیحات</span>
                <span class="value">{{ contract.description || '-' }}</span>
              </div>
              <div class="info-item full-width" v-if="contract.terms">
                <span class="label">شرایط و ضوابط</span>
                <span class="value">{{ contract.terms }}</span>
              </div>
            </div>
          </TabPanel>

          <!-- WBS Items -->
          <TabPanel header="آیتم‌های WBS">
            <div v-if="contract.wbs_items && contract.wbs_items.length > 0">
              <DataTable :value="contract.wbs_items" stripedRows>
                <Column field="code" header="کد" />
                <Column field="name" header="نام" />
                <Column header="تعداد">
                  <template #body="{ data }">
                    {{ data.pivot?.quantity || 0 }}
                  </template>
                </Column>
                <Column header="قیمت واحد">
                  <template #body="{ data }">
                    {{ formatMoney(data.pivot?.unit_price || 0) }}
                  </template>
                </Column>
                <Column header="قیمت کل">
                  <template #body="{ data }">
                    {{ formatMoney(data.pivot?.total_price || 0) }}
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">
              <p class="text-muted-color">هیچ آیتم WBS به این قرارداد متصل نیست</p>
            </div>
          </TabPanel>

          <!-- اسناد -->
          <TabPanel header="اسناد">
            <DocumentList
                :company-id="contract.company_id"
                documentable-type="contract"
                :documentable-id="contract.id"
            />
          </TabPanel>
        </TabView>
      </div>
    </div>

    <!-- Edit Dialog -->
    <ContractForm
        v-model:visible="editDialogVisible"
        :contract-id="contract?.id"
        @saved="onEditSuccess"
    />

    <!-- Change Status Dialog -->
    <Dialog
        v-model:visible="showStatusDialog"
        header="تغییر وضعیت قرارداد"
        modal
        :style="{ width: '400px' }"
    >
      <div class="status-change">
        <div class="form-field">
          <label for="new_status" class="required">وضعیت جدید</label>
          <Select
              id="new_status"
              v-model="newStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب وضعیت جدید"
              class="w-full"
          />
        </div>

        <div class="form-actions">
          <Button
              label="انصراف"
              severity="secondary"
              outlined
              @click="showStatusDialog = false"
          />
          <Button
              label="تغییر وضعیت"
              severity="primary"
              :loading="statusLoading"
              @click="changeStatus"
          />
        </div>
      </div>
    </Dialog>

    <!-- Delete Confirmation -->

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { contractService } from '@/services/ContractService.js'
import ContractForm from './ContractForm.vue'
import DocumentList from '@/views/Document/DocumentList.vue'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// State
const contract = ref(null)
const loading = ref(false)
const editDialogVisible = ref(false)
const showStatusDialog = ref(false)
const newStatus = ref(null)
const statusLoading = ref(false)

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'فعال', value: 'active' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'لغو شده', value: 'cancelled' },
  { label: 'متوقف', value: 'suspended' }
]

// Methods
const loadContract = async () => {
  loading.value = true
  try {
    const response = await contractService.get(route.params.id)
    contract.value = response.data.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات قرارداد با خطا مواجه شد',
      life: 3000
    })
    router.push({ name: 'contracts.index' })
  } finally {
    loading.value = false
  }
}

const openEditDialog = () => {
  editDialogVisible.value = true
}

const onEditSuccess = () => {
  editDialogVisible.value = false
  loadContract()
}

const changeStatus = async () => {
  if (!newStatus.value) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'لطفاً وضعیت جدید را انتخاب کنید',
      life: 3000
    })
    return
  }

  statusLoading.value = true
  try {
    await contractService.changeStatus(contract.value.id, newStatus.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'وضعیت قرارداد با موفقیت تغییر کرد',
      life: 3000
    })
    showStatusDialog.value = false
    newStatus.value = null
    loadContract()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'تغییر وضعیت با خطا مواجه شد',
      life: 3000
    })
  } finally {
    statusLoading.value = false
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `آیا از حذف قرارداد "${contract.value?.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await contractService.delete(contract.value.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'قرارداد با موفقیت حذف شد',
          life: 3000
        })
        router.push({ name: 'contracts.index' })
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

// Lifecycle
onMounted(() => {
  loadContract()
})
</script>

<style scoped>
.contract-detail {
  padding: 1.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.contract-number {
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
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

.text-success { color: #22c55e; }
.text-warning { color: #f59e0b; }

.progress-section {
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.detail-content {
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item .value {
  font-size: 1rem;
  color: #1f2937;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.overdue-badge {
  color: #ef4444;
  font-size: 0.75rem;
}

.empty-state {
  padding: 2rem;
  text-align: center;
}

.status-change {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label.required::after {
  content: ' *';
  color: var(--red-500);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .header-actions button {
    flex: 1;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>