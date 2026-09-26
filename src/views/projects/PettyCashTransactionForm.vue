<!-- resources/js/views/projects/PettyCashTransactionForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      header="تراکنش جدید"
      modal
      :style="{ width: '600px' }"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <!-- نوع تراکنش -->
      <div class="form-field">
        <label for="type" class="required">نوع تراکنش</label>
        <Select
            id="type"
            v-model="form.type"
            :options="transactionTypes"
            option-label="label"
            option-value="value"
            placeholder="انتخاب نوع تراکنش"
            :invalid="!!errors.type"
            @change="clearFieldError('type')"
            class="w-full"
        />
        <small v-if="errors.type" class="error-text">{{ errors.type[0] }}</small>
      </div>

      <!-- مبلغ و تاریخ -->
      <div class="form-row">
        <div class="form-field">
          <label for="amount" class="required">مبلغ (ریال)</label>
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

      <!-- WBS Item -->
      <div class="form-field">
        <label for="wbs_item_id">آیتم WBS</label>
        <Select
            id="wbs_item_id"
            v-model="form.wbs_item_id"
            :options="wbsItems"
            option-label="name"
            option-value="id"
            placeholder="انتخاب آیتم WBS (اختیاری)"
            :invalid="!!errors.wbs_item_id"
            @change="clearFieldError('wbs_item_id')"
            class="w-full"
            filter
            show-clear
        >
          <template #option="slotProps">
            <div>
              <span class="font-semibold">{{ slotProps.option.code }}</span>
              <span class="text-muted-color mx-2">-</span>
              <span>{{ slotProps.option.name }}</span>
            </div>
          </template>
        </Select>
        <small v-if="errors.wbs_item_id" class="error-text">{{ errors.wbs_item_id[0] }}</small>
      </div>

      <!-- توضیحات -->
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

      <!-- شماره مرجع -->
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
import { pettyCashService } from '@/services/pettyCashService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  pettyCashId: {
    type: [Number, String],
    required: true
  },
  wbsItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')

const transactionTypes = [
  { label: 'هزینه', value: 'expense' },
  { label: 'تعدیل', value: 'adjustment' }
]

const defaultForm = () => ({
  type: 'expense',
  amount: null,
  transaction_date: new Date(),
  wbs_item_id: null,
  description: '',
  reference_number: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const formatDateForApi = (date) => {
  if (!date) return null
  if (date instanceof Date && !isNaN(date)) {
    return date.toISOString().split('T')[0]
  }
  return date
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    const payload = {
      type: form.type,
      amount: form.amount || 0,
      transaction_date: formatDateForApi(form.transaction_date),
      wbs_item_id: form.wbs_item_id || null,
      description: form.description,
      reference_number: form.reference_number || null
    }

    console.log('📤 Transaction payload:', payload)

    await pettyCashService.createTransaction(props.pettyCashId, payload)

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
      serverError.value = error.response.data.message || 'لطفاً خطاهای فرم را بررسی کنید'
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
watch(() => props.visible, (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    Object.assign(form, defaultForm())
  }
})
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
}
</style>