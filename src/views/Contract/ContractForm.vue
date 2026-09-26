<!-- resources/js/views/contracts/ContractForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="contractId ? 'ویرایش قرارداد' : 'قرارداد جدید'"
      modal
      :style="{ width: '800px' }"
      class="contract-form"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <!-- اطلاعات پایه -->
      <div class="form-section">
        <h4>اطلاعات پایه</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="title" class="required">عنوان قرارداد</label>
            <InputText
                id="title"
                v-model="form.title"
                placeholder="عنوان قرارداد"
                :invalid="!!errors.title"
                @input="clearFieldError('title')"
                class="w-full"
            />
            <small v-if="errors.title" class="error-text">{{ errors.title[0] }}</small>
          </div>

          <div class="form-field">
            <label for="contract_number">شماره قرارداد</label>
            <InputText
                id="contract_number"
                v-model="form.contract_number"
                placeholder="اختیاری"
                :invalid="!!errors.contract_number"
                @input="clearFieldError('contract_number')"
                class="w-full"
            />
            <small v-if="errors.contract_number" class="error-text">{{ errors.contract_number[0] }}</small>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="type" class="required">نوع قرارداد</label>
            <Select
                id="type"
                v-model="form.type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                placeholder="انتخاب نوع"
                :invalid="!!errors.type"
                @change="clearFieldError('type')"
                class="w-full"
            />
            <small v-if="errors.type" class="error-text">{{ errors.type[0] }}</small>
          </div>

          <div class="form-field">
            <label for="status" class="required">وضعیت</label>
            <Select
                id="status"
                v-model="form.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="انتخاب وضعیت"
                :invalid="!!errors.status"
                @change="clearFieldError('status')"
                class="w-full"
            />
            <small v-if="errors.status" class="error-text">{{ errors.status[0] }}</small>
          </div>
        </div>
      </div>

        <!-- پیمانکار و پروژه -->
        <div class="form-section">
        <h4>پیمانکار و پروژه</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="project_id" class="required">پروژه</label>
            <Select
                id="project_id"
                v-model="form.project_id"
                :options="projects"
                option-label="name"
                option-value="id"
                placeholder="انتخاب پروژه"
                :invalid="!!errors.project_id"
                @change="clearFieldError('project_id')"
                class="w-full"
                filter
            />
            <small v-if="errors.project_id" class="error-text">{{ errors.project_id[0] }}</small>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="contractor_id" class="required">پیمانکار</label>
              <Select
                  id="contractor_id"
                  v-model="form.contractor_id"
                  :options="contractors"
                  option-label="name"
                  option-value="id"
                  placeholder="انتخاب پیمانکار"
                  :invalid="!!errors.contractor_id"
                  @change="clearFieldError('contractor_id')"
                  class="w-full"
                  filter
              >
                <template #option="slotProps">
                  <div>
                    <span class="font-semibold">{{ slotProps.option.name }}</span>
                    <span v-if="slotProps.option.code" class="text-muted-color mx-2">
                      ({{ slotProps.option.code }})
                    </span>
                    <Tag
                        :value="slotProps.option.type_label"
                        :severity="slotProps.option.type === 'legal' ? 'info' : 'secondary'"
                        size="small"
                    />
                  </div>
                </template>
              </Select>
              <small v-if="errors.contractor_id" class="error-text">{{ errors.contractor_id[0] }}</small>
            </div>

            <div class="form-field">
              <label>عملیات</label>
              <Button
                  label="پیمانکار جدید"
                  icon="pi pi-plus"
                  severity="secondary"
                  outlined
                  @click="openContractorDialog"
                  type="button"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- مبالغ -->
      <div class="form-section">
        <h4>مبالغ</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="amount" class="required">مبلغ کل (ریال)</label>
            <InputNumber
                id="amount"
                v-model="form.amount"
                placeholder="0"
                :min="0"
                :invalid="!!errors.amount"
                @input="clearFieldError('amount')"
                class="w-full"
                :use-grouping="true"
                mode="currency"
                currency="IRR"
                locale="en-US"
            />
            <small v-if="errors.amount" class="error-text">{{ errors.amount[0] }}</small>
          </div>

          <div class="form-field">
            <label for="paid_amount">مبلغ پرداخت شده (ریال)</label>
            <InputNumber
                id="paid_amount"
                v-model="form.paid_amount"
                placeholder="0"
                :min="0"
                :invalid="!!errors.paid_amount"
                @input="clearFieldError('paid_amount')"
                class="w-full"
                :use-grouping="true"
            />
            <small v-if="errors.paid_amount" class="error-text">{{ errors.paid_amount[0] }}</small>
          </div>
        </div>
      </div>

      <!-- تاریخ‌ها -->
      <div class="form-section">
        <h4>تاریخ‌ها</h4>
        <div class="form-row">
          <div class="form-field">
            <label for="start_date">تاریخ شروع</label>
            <DatePicker
                id="start_date"
                v-model="form.start_date"
                format="YYYY-MM-DD"
                display-format="jYYYY/jMM/jDD"
                show-icon
                :invalid="!!errors.start_date"
                @date-select="clearFieldError('start_date')"
                class="w-full"
            />
            <small v-if="errors.start_date" class="error-text">{{ errors.start_date[0] }}</small>
          </div>

          <div class="form-field">
            <label for="end_date">تاریخ پایان</label>
            <DatePicker
                id="end_date"
                v-model="form.end_date"
                format="YYYY-MM-DD"
                display-format="jYYYY/jMM/jDD"
                show-icon
                :invalid="!!errors.end_date"
                @date-select="clearFieldError('end_date')"
                class="w-full"
            />
            <small v-if="errors.end_date" class="error-text">{{ errors.end_date[0] }}</small>
          </div>
        </div>
      </div>

      <!-- WBS Items -->
      <div class="form-section">
        <h4>آیتم‌های WBS مرتبط</h4>
        <div class="wbs-selection">
          <div
              v-for="(item, index) in selectedWbsItems"
              :key="item.id || index"
              class="wbs-item-row"
          >
            <div class="wbs-info">
              <span class="wbs-code">{{ item.code }}</span>
              <span class="wbs-name">{{ item.name }}</span>
            </div>
            <div class="wbs-details">
              <InputNumber
                  v-model="item.quantity"
                  placeholder="تعداد"
                  :min="0"
                  size="small"
                  style="width: 100px;"
              />
              <InputNumber
                  v-model="item.unit_price"
                  placeholder="قیمت واحد"
                  :min="0"
                  size="small"
                  style="width: 120px;"
              />
              <Button
                  icon="pi pi-times"
                  text
                  rounded
                  severity="danger"
                  size="small"
                  @click="removeWbsItem(index)"
              />
            </div>
          </div>

          <div class="add-wbs">
            <Select
                v-model="selectedWbsItemId"
                :options="availableWbsItems"
                option-label="name"
                option-value="id"
                placeholder="افزودن آیتم WBS..."
                class="w-full"
                filter
                @change="addWbsItem"
            />
          </div>
        </div>
      </div>

      <!-- توضیحات و شرایط -->
      <div class="form-section">
        <div class="form-field">
          <label for="description">توضیحات</label>
          <Textarea
              id="description"
              v-model="form.description"
              rows="3"
              placeholder="توضیحات تکمیلی..."
              :invalid="!!errors.description"
              @input="clearFieldError('description')"
              class="w-full"
              auto-resize
          />
          <small v-if="errors.description" class="error-text">{{ errors.description[0] }}</small>
        </div>

        <div class="form-field">
          <label for="terms">شرایط قرارداد</label>
          <Textarea
              id="terms"
              v-model="form.terms"
              rows="3"
              placeholder="شرایط و ضوابط قرارداد..."
              :invalid="!!errors.terms"
              @input="clearFieldError('terms')"
              class="w-full"
              auto-resize
          />
          <small v-if="errors.terms" class="error-text">{{ errors.terms[0] }}</small>
        </div>
      </div>

      <!-- دکمه‌ها -->
      <div class="form-actions">
        <Button
            label="انصراف"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cancel"
            type="button"
            :disabled="loading"
        />
        <Button
            :label="contractId ? 'بروزرسانی' : 'ثبت قرارداد'"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            type="submit"
            :loading="loading"
        />
      </div>
    </form>
    <ContractorForm
        v-model:visible="contractorDialogVisible"
        :company-id="form.company_id || 1"
        @saved="onContractorSaved"
    />
  </Dialog>

</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { contractService } from '@/services/ContractService'
import { projectService } from '@/services/projectService'
import { wbsService } from '@/services/wbsService'
import ContractorForm from './ContractorForm.vue'
import api from '@/api/axios'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  contractId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()
const contractorDialogVisible = ref(false)

// Methods


// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const projects = ref([])
const contractors = ref([])
const wbsItems = ref([])
const selectedWbsItems = ref([])
const selectedWbsItemId = ref(null)

const typeOptions = [
  { label: 'ساخت و ساز', value: 'construction' },
  { label: 'خدماتی', value: 'service' },
  { label: 'مشاوره', value: 'consulting' },
  { label: 'تامین کالا', value: 'supply' },
  { label: 'سایر', value: 'other' }
]

const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'در انتظار تایید', value: 'pending' },
  { label: 'فعال', value: 'active' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'لغو شده', value: 'cancelled' },
  { label: 'متوقف', value: 'suspended' }
]

const defaultForm = () => ({
  title: '',
  contract_number: '',
  type: 'construction',
  status: 'draft',
  project_id: null,
  contractor_id: null,
  amount: null,
  paid_amount: 0,
  start_date: null,
  end_date: null,
  description: '',
  terms: ''
})

const form = reactive(defaultForm())



const openContractorDialog = () => {
  contractorDialogVisible.value = true
}

const onContractorSaved = () => {
  contractorDialogVisible.value = false
  loadContractors()
}
// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const availableWbsItems = computed(() => {
  const selectedIds = selectedWbsItems.value.map(item => item.id)
  return wbsItems.value.filter(item => !selectedIds.includes(item.id))
})

// Methods
const loadDropdowns = async () => {
  try {
    const [projectsRes, usersRes, wbsRes] = await Promise.all([
      projectService.list({ all: 1 }),
      contractService.getContractors({
        company_id: 1,
        status: 'active',
        per_page: 100
      }),
      wbsService.list({ all: 1 })
    ])

    projects.value = projectsRes.data.data || []
    contractors.value = usersRes.data.data || []
    wbsItems.value = wbsRes.data.data || []
  } catch (error) {
    console.error('Error loading dropdowns:', error)
  }
}

const loadContract = async () => {
  if (!props.contractId) return

  try {
    loading.value = true
    const response = await contractService.get(props.contractId)
    const data = response.data.data

    Object.assign(form, {
      title: data.title || '',
      contract_number: data.contract_number || '',
      type: data.type || 'construction',
      status: data.status || 'draft',
      project_id: data.project_id || null,
      contractor_id: data.contractor_id || null,
      amount: data.amount || null,
      paid_amount: data.paid_amount || 0,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      description: data.description || '',
      terms: data.terms || ''
    })

    // بارگذاری WBS Items مرتبط
    if (data.wbs_items) {
      selectedWbsItems.value = data.wbs_items.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        quantity: item.pivot?.quantity || 0,
        unit_price: item.pivot?.unit_price || 0
      }))
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات قرارداد با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const addWbsItem = () => {
  if (!selectedWbsItemId.value) return

  const item = wbsItems.value.find(i => i.id === selectedWbsItemId.value)
  if (item) {
    selectedWbsItems.value.push({
      id: item.id,
      code: item.code,
      name: item.name,
      quantity: 1,
      unit_price: 0
    })
    selectedWbsItemId.value = null
  }
}

const removeWbsItem = (index) => {
  selectedWbsItems.value.splice(index, 1)
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    const formatDate = (date) => {
      if (!date) return null
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
      return date
    }

    const payload = {
      ...form,
      start_date: formatDate(form.start_date),
      end_date: formatDate(form.end_date),
      wbs_items: selectedWbsItems.value.map(item => ({
        id: item.id,
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0
      }))
    }

    if (props.contractId) {
      await contractService.update(props.contractId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'قرارداد با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      await contractService.create(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'قرارداد با موفقیت ایجاد شد',
        life: 3000
      })
    }

    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)
  } catch (error) {
    console.error('Error:', error)
    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'
    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
    }
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  Object.assign(form, defaultForm())
  selectedWbsItems.value = []
  errors.value = {}
  serverError.value = ''
  localVisible.value = false
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
  if (serverError.value) {
    serverError.value = ''
  }
}

// Watchers
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    await loadDropdowns()
    if (props.contractId) {
      await loadContract()
    } else {
      Object.assign(form, defaultForm())
      selectedWbsItems.value = []
    }
  }
})
</script>

<style scoped>
.contract-form :deep(.p-dialog-content) {
  padding: 1.5rem;
  max-height: 80vh;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
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

label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

label.required::after {
  content: ' *';
  color: var(--red-500);
}

.error-text {
  color: var(--red-500);
  font-size: 0.85rem;
}

.wbs-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.wbs-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
}

.wbs-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.wbs-code {
  font-weight: 600;
  color: #4f46e5;
  font-size: 0.85rem;
}

.wbs-name {
  font-size: 0.85rem;
  color: #1f2937;
}

.wbs-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.add-wbs {
  margin-top: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .wbs-item-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .wbs-details {
    flex-wrap: wrap;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>