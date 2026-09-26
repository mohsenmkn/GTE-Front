<template>
  <Dialog
      v-model:visible="localVisible"
      :header="budgetId ? 'ویرایش بودجه' : 'بودجه جدید'"
      modal
      :style="{ width: '600px' }"
      :draggable="false"
      class="budget-dialog"
  >
    <!-- نمایش خطای کلی سرور -->
    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <!-- نمایش پیام موفقیت -->
    <Message v-if="successMessage" severity="success" :closable="true" @close="successMessage = ''">
      {{ successMessage }}
    </Message>

    <form @submit.prevent="submit" class="budget-form">
      <!-- عنوان بودجه -->
      <div class="form-field">
        <label for="title" class="required">عنوان بودجه</label>
        <InputText
            id="title"
            v-model="form.title"
            placeholder="مثال: بودجه تجهیزات"
            :invalid="!!errors.title"
            @input="clearFieldError('title')"
            class="w-full"
        />
        <small v-if="errors.title" class="error-text">
          {{ errors.title[0] }}
        </small>
      </div>

      <!-- نوع بودجه -->
      <div class="form-field">
        <label for="type" class="required">نوع بودجه</label>
        <Select
            id="type"
            v-model="form.type"
            :options="budgetTypes"
            option-label="label"
            option-value="value"
            placeholder="انتخاب نوع بودجه"
            :invalid="!!errors.type"
            @change="clearFieldError('type')"
            class="w-full"
        />
        <small v-if="errors.type" class="error-text">
          {{ errors.type[0] }}
        </small>
        <small class="helper-text">
          اولیه: بودجه اصلی پروژه | تجدیدنظر: بودجه اصلاح‌شده | اضطراری: بودجه پیش‌بینی‌نشده
        </small>
      </div>

      <!-- مبلغ و سال مالی (دو ستونی) -->
      <div class="form-row">
        <!-- مبلغ -->
        <div class="form-field">
          <label for="amount" class="required">مبلغ (ریال)</label>
          <InputNumber
              id="amount"
              v-model="form.amount"
              placeholder="0"
              :invalid="!!errors.amount"
              @input="clearFieldError('amount')"
              class="w-full"
              :min="0"
          />
          <small v-if="errors.amount" class="error-text">
            {{ errors.amount[0] }}
          </small>
        </div>

        <!-- سال مالی -->
        <div class="form-field">
          <label for="fiscal_year" class="required">سال مالی</label>
          <InputNumber
              id="fiscal_year"
              v-model="form.fiscal_year"
              placeholder="1403"
              :use-grouping="false"
              :invalid="!!errors.fiscal_year"
              @input="clearFieldError('fiscal_year')"
              class="w-full"
              :min="1300"
              :max="1500"
          />
          <small v-if="errors.fiscal_year" class="error-text">
            {{ errors.fiscal_year[0] }}
          </small>
        </div>
      </div>

      <!-- توضیحات -->
      <div class="form-field">
        <label for="description">توضیحات</label>
        <Textarea
            id="description"
            v-model="form.description"
            rows="4"
            placeholder="توضیحات تکمیلی درباره این بودجه..."
            :invalid="!!errors.description"
            @input="clearFieldError('description')"
            class="w-full"
            auto-resize
        />
        <small v-if="errors.description" class="error-text">
          {{ errors.description[0] }}
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
            :label="budgetId ? 'بروزرسانی' : 'ثبت بودجه'"
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
import budgetService from '@/services/budgetService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: [Number, String],
    required: true
  },
  budgetId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const successMessage = ref('')

const budgetTypes = [
  { label: 'اولیه', value: 'initial' },
  { label: 'تجدیدنظر', value: 'revised' },
  { label: 'اضطراری', value: 'contingency' }
]

const defaultForm = () => ({
  title: '',
  type: 'initial',
  amount: null,
  fiscal_year: new Date().toLocaleDateString('fa-IR', { year: 'numeric' }).slice(0, 4),
  description: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// Methods
const loadBudget = async () => {
  if (!props.budgetId) return
  console.log("Id IIIIIIIIIs:",props.budgetId)
  try {
    loading.value = true
    const response = await budgetService.get(props.budgetId)

    Object.assign(form, {
      title: response.data.data.title,
      type: response.data.data.type,
      amount: response.data.data.amount,
      fiscal_year: response.data.data.fiscal_year,
      description: response.data.data.description || ''
    })
    console.log(response.data.data.title)
  } catch (error) {
    console.error('خطا در بارگذاری بودجه:', error)
    serverError.value = 'خطا در بارگذاری اطلاعات بودجه'
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    const payload = {
      project_id: props.projectId,
      title: form.title,
      type: form.type,
      amount: form.amount,
      fiscal_year: form.fiscal_year,
      description: form.description
    }

    if (props.budgetId) {
      await budgetService.update(props.budgetId, payload)
      successMessage.value = 'بودجه با موفقیت بروزرسانی شد'
      loadBudget()
    } else {
      await budgetService.create(payload)
      successMessage.value = 'بودجه با موفقیت ثبت شد'
      loadBudget()
    }

    // نمایش پیام موفقیت برای 1.5 ثانیه و سپس بستن
    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1500)
  } catch (error) {
    console.error('خطا در ثبت بودجه:', error)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'
    } else if (error.response?.status === 403) {
      serverError.value = 'شما دسترسی لازم برای این عملیات را ندارید'
    } else if (error.response?.status === 404) {
      serverError.value = 'بودجه مورد نظر یافت نشد'
    } else {
      serverError.value = 'خطای سرور. لطفاً مجدداً تلاش کنید'
    }
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  Object.assign(form, defaultForm())
  errors.value = {}
  serverError.value = ''
  successMessage.value = ''
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
    successMessage.value = ''

    if (props.budgetId) {
      loadBudget()
    } else {
      Object.assign(form, defaultForm())
    }
  }
})
</script>

<style scoped>
.budget-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.budget-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

/* Responsive */
@media (max-width: 640px) {
  .budget-dialog :deep(.p-dialog) {
    width: 95vw !important;
    max-width: 95vw !important;
  }

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
