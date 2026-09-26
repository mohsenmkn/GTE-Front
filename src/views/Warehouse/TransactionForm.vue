<!-- resources/js/views/inventory/TransactionForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      header="ثبت تراکنش انبار"
      modal
      :style="{ width: '600px' }"
  >
    <div class="transaction-info" v-if="material">
      <div class="info-item">
        <span class="label">کالا:</span>
        <span class="value">{{ material.name }} ({{ material.code }})</span>
      </div>
      <div class="info-item">
        <span class="label">موجودی فعلی:</span>
        <span class="value">{{ material.current_stock }} {{ material.unit || '' }}</span>
      </div>
    </div>

    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <div class="form-row">
        <div class="form-field">
          <label for="type" class="required">نوع تراکنش</label>
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
          <label for="quantity" class="required">تعداد</label>
          <InputNumber
              id="quantity"
              v-model="form.quantity"
              placeholder="0"
              :min="0"
              :invalid="!!errors.quantity"
              @input="clearFieldError('quantity')"
              class="w-full"
          />
          <small v-if="errors.quantity" class="error-text">{{ errors.quantity[0] }}</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="unit_price">قیمت واحد (ریال)</label>
          <InputNumber
              id="unit_price"
              v-model="form.unit_price"
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

        <div class="form-field">
          <label for="transaction_date" class="required">تاریخ تراکنش</label>
          <DatePicker
              id="transaction_date"
              v-model="form.transaction_date"
              date-format="yy-mm-dd"
              show-icon
              :invalid="!!errors.transaction_date"
              @date-select="clearFieldError('transaction_date')"
              class="w-full"
          />
          <small v-if="errors.transaction_date" class="error-text">{{ errors.transaction_date[0] }}</small>
        </div>
      </div>

      <div class="form-field">
        <label for="project_id">پروژه (اختیاری)</label>
        <Select
            id="project_id"
            v-model="form.project_id"
            :options="projects"
            option-label="name"
            option-value="id"
            placeholder="انتخاب پروژه"
            class="w-full"
            filter
            show-clear
            @change="loadWbsItems"
        />
        <small v-if="errors.project_id" class="error-text">{{ errors.project_id[0] }}</small>
      </div>

      <div class="form-field">
        <label for="wbs_item_id">آیتم WBS (اختیاری)</label>
        <Select
            id="wbs_item_id"
            v-model="form.wbs_item_id"
            :options="wbsItems"
            option-label="name"
            option-value="id"
            placeholder="انتخاب آیتم WBS"
            class="w-full"
            filter
            show-clear
            :disabled="!form.project_id"
        />
        <small v-if="errors.wbs_item_id" class="error-text">{{ errors.wbs_item_id[0] }}</small>
      </div>

      <div class="form-field">
        <label for="reference_number">شماره مرجع</label>
        <InputText
            id="reference_number"
            v-model="form.reference_number"
            placeholder="شماره فاکتور یا مرجع"
            :invalid="!!errors.reference_number"
            @input="clearFieldError('reference_number')"
            class="w-full"
        />
        <small v-if="errors.reference_number" class="error-text">{{ errors.reference_number[0] }}</small>
      </div>

      <div class="form-field">
        <label for="description" class="required">توضیحات</label>
        <Textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="توضیحات تراکنش..."
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
            @click="cancel"
            type="button"
            :disabled="loading"
        />
        <Button
            label="ثبت تراکنش"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            type="submit"
            :loading="loading"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import { projectService } from '@/services/projectService'
import { wbsService } from '@/services/wbsService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  material: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const projects = ref([])
const wbsItems = ref([])

const typeOptions = [
  { label: 'خرید', value: 'purchase' },
  { label: 'فروش', value: 'sale' },
  { label: 'انتقال', value: 'transfer' },
  { label: 'تعدیل', value: 'adjustment' },
  { label: 'بازگشت', value: 'return' },
  { label: 'ضایعات', value: 'damage' }
]

const defaultForm = () => ({
  type: 'purchase',
  quantity: null,
  unit_price: 0,
  transaction_date: new Date(),
  project_id: null,
  wbs_item_id: null,
  reference_number: '',
  description: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const loadProjects = async () => {
  try {
    const response = await projectService.list({ all: 1 })
    projects.value = response.data.data || []
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

const loadWbsItems = async () => {
  if (!form.project_id) {
    wbsItems.value = []
    return
  }

  try {
    const response = await wbsService.list({
      project_id: form.project_id,
      all: 1
    })
    wbsItems.value = response.data.data || []
  } catch (error) {
    console.error('Error loading WBS items:', error)
  }
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
      material_id: props.material?.id,
      type: form.type,
      quantity: form.quantity || 0,
      unit_price: form.unit_price || 0,
      total_price: (form.quantity || 0) * (form.unit_price || 0),
      transaction_date: formatDate(form.transaction_date),
      project_id: form.project_id || null,
      wbs_item_id: form.wbs_item_id || null,
      reference_number: form.reference_number || null,
      description: form.description
    }

    await inventoryService.createTransaction(payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'تراکنش با موفقیت ثبت شد',
      life: 3000
    })

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
    await loadProjects()
    Object.assign(form, defaultForm())
    form.unit_price = props.material?.unit_price || 0
  }
})
</script>

<style scoped>
.transaction-info {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.transaction-info .info-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.transaction-info .label {
  color: #6b7280;
}

.transaction-info .value {
  font-weight: 600;
  color: #1f2937;
}

.form {
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
  display: block;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>