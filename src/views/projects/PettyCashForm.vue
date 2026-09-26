<!-- resources/js/views/projects/PettyCashForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="pettyCashId ? 'ویرایش تنخواه' : 'ایجاد تنخواه جدید'"
      modal
      :style="{ width: '600px' }"
  >
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="form">
      <!-- نام تنخواه -->
      <div class="form-field">
        <label for="name">نام تنخواه</label>
        <InputText
            id="name"
            v-model="form.name"
            placeholder="نام تنخواه (اختیاری)"
            :invalid="!!errors.name"
            @input="clearFieldError('name')"
            class="w-full"
        />
        <small v-if="errors.name" class="error-text">{{ errors.name[0] }}</small>
        <small class="helper-text">در صورت خالی بودن، نام پیش‌فرض "تنخواه گردان" ثبت میشود</small>
      </div>

      <!-- موجودی اولیه -->
      <div class="form-field">
        <label for="initial_amount" class="required">موجودی اولیه (ریال)</label>
        <InputNumber
            id="initial_amount"
            v-model="form.initial_amount"
            placeholder="0"
            :min="0"
            :max="MAX_AMOUNT"
            :invalid="hasAmountError"
            @input="handleAmountInput"
            @blur="validateAmount"
            class="w-full"
            :use-grouping="true"
            locale="en-US"
        />

        <!-- پیغام خطای مبلغ -->
        <div v-if="isExceedingMax" class="error-container">
          <i class="pi pi-exclamation-triangle"></i>
          <span class="error-text">
            مبلغ وارد شده ({{ formatNumber(form.initial_amount) }})
            بیشتر از حد مجاز ({{ formatNumber(MAX_AMOUNT) }}) است
          </span>
        </div>

        <small v-else-if="errors.initial_amount" class="error-text">
          {{ errors.initial_amount[0] }}
        </small>

        <small class="helper-text">
          حداکثر مبلغ مجاز: {{ formatNumber(MAX_AMOUNT) }} ریال
        </small>
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
            :label="pettyCashId ? 'بروزرسانی' : 'ثبت تنخواه'"
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
  projectId: {
    type: [Number, String],
    required: true
  },
  pettyCashId: {
    type: [Number, String],
    default: null
  },
  modelValue: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// ✅ مقدار ثابت برای حداکثر مبلغ
const MAX_AMOUNT = 1000000000 // 1 میلیارد

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const isExceedingMax = ref(false)
const previousValidAmount = ref(null)

// ✅ فرم با فیلدهای هماهنگ با بک‌اند
const defaultForm = () => ({
  name: '',
  initial_amount: null,
})

const form = reactive(defaultForm())

// ✅ Computed: وضعیت خطای مبلغ
const hasAmountError = computed(() => {
  return !!errors.initial_amount || isExceedingMax.value
})

// Computed: نمایش دیالوگ
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// ✅ متد: فرمت کردن اعداد
const formatNumber = (value) => {
  if (value === null || value === undefined) return '۰'
  return new Intl.NumberFormat('fa-IR').format(value)
}

// ✅ متد: اعتبارسنجی مبلغ
const validateAmount = () => {
  const value = parseFloat(form.initial_amount)

  if (isNaN(value) || value < 0) {
    isExceedingMax.value = false
    return false
  }

  if (value > MAX_AMOUNT) {
    isExceedingMax.value = true

    // نمایش Toast هشدار
    toast.add({
      severity: 'warn',
      summary: '⚠️ هشدار',
      detail: `مبلغ ${formatNumber(value)} بیشتر از حد مجاز ${formatNumber(MAX_AMOUNT)} است`,
      life: 5000,
      closable: true
    })

    return false
  }

  isExceedingMax.value = false
  previousValidAmount.value = value
  return true
}

// ✅ متد: مدیریت ورودی مبلغ
const handleAmountInput = () => {
  const value = parseFloat(form.initial_amount)

  // اگر مقدار خالی بود
  if (form.initial_amount === null || form.initial_amount === undefined || isNaN(value)) {
    isExceedingMax.value = false
    clearFieldError('initial_amount')
    return
  }

  // اعتبارسنجی
  if (value > MAX_AMOUNT) {
    isExceedingMax.value = true
    // ❌ مقدار را تغییر ندهید، فقط خطا نمایش دهید
  } else if (value >= 0) {
    isExceedingMax.value = false
    previousValidAmount.value = value
    clearFieldError('initial_amount')
  }
}

// ✅ متد: بارگذاری تنخواه
const loadPettyCash = async () => {
  if (!props.pettyCashId) return

  try {
    loading.value = true
    const response = await pettyCashService.get(props.pettyCashId)
    const data = response.data.data

    Object.assign(form, {
      name: data.name || '',
      initial_amount: data.initial_amount || null,
    })

    // اعتبارسنجی مقدار بارگذاری شده
    validateAmount()

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اطلاعات با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// ✅ متد: ثبت/ویرایش (با اعتبارسنجی کامل)
const submit = async () => {
  // ✅ 1. اعتبارسنجی مبلغ
  const isAmountValid = validateAmount()

  // ✅ 2. بررسی وجود مبلغ
  if (form.initial_amount === null || form.initial_amount === undefined) {
    errors.value.initial_amount = ['مبلغ الزامی است']
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'لطفاً مبلغ را وارد کنید',
      life: 3000
    })
    return
  }

  // ✅ 3. بررسی بیشتر از حد مجاز
  if (isExceedingMax.value) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: `مبلغ وارد شده بیشتر از حد مجاز (${formatNumber(MAX_AMOUNT)}) است`,
      life: 5000
    })
    return
  }

  // ✅ 4. اگر مبلغ معتبر نیست
  if (!isAmountValid) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'لطفاً یک مبلغ معتبر وارد کنید',
      life: 3000
    })
    return
  }

  // ✅ 5. پاک کردن خطاهای قبلی
  errors.value = {}
  serverError.value = ''
  loading.value = true

  try {
    const payload = {
      project_id: props.projectId,
      name: form.name || 'تنخواه گردان',
      initial_amount: parseFloat(form.initial_amount) || 0,
    }

    console.log('📤 PettyCash Payload:', payload)

    if (props.pettyCashId) {
      await pettyCashService.update(props.pettyCashId, {
        name: form.name || 'تنخواه گردان',
        initial_amount: parseFloat(form.initial_amount) || 0,
      })
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تنخواه با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      await pettyCashService.create(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تنخواه با موفقیت ایجاد شد',
        life: 3000
      })
    }

    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)

  } catch (error) {
    console.error('❌ Error:', error)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = error.response.data.message || 'لطفاً خطاهای فرم را بررسی کنید'

      const errorMessages = Object.values(errors.value).flat().join('\n')
      toast.add({
        severity: 'error',
        summary: 'خطای اعتبارسنجی',
        detail: errorMessages,
        life: 5000
      })
    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: serverError.value,
        life: 5000
      })
    }
  } finally {
    loading.value = false
  }
}

// ✅ متد: انصراف
const cancel = () => {
  Object.assign(form, defaultForm())
  errors.value = {}
  serverError.value = ''
  isExceedingMax.value = false
  previousValidAmount.value = null
  localVisible.value = false
}

// ✅ متد: پاک کردن خطای فیلد
const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
  if (serverError.value) {
    serverError.value = ''
  }
}

// ✅ Watcher: باز شدن دیالوگ
watch(() => props.visible, (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    isExceedingMax.value = false

    if (props.pettyCashId) {
      loadPettyCash()
    } else {
      Object.assign(form, defaultForm())
      previousValidAmount.value = null
    }
  }
})

// ✅ Watcher: تغییرات مبلغ برای اعتبارسنجی لحظه‌ای
watch(() => form.initial_amount, (newVal) => {
  if (newVal !== null && newVal !== undefined) {
    handleAmountInput()
  }
})
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.helper-text {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  display: block;
  margin-top: 0.25rem;
  line-height: 1.4;
}

/* ✅ استایل جدید برای نمایش خطای مبلغ */
.error-container {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-container i {
  font-size: 16px;
  flex-shrink: 0;
  color: #f59e0b;
}

.error-container .error-text {
  margin-top: 0;
  flex: 1;
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
  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>