<template>
  <div class="expense-form-page" dir="rtl">
    <!-- سربرگ صفحه -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="hero-content">
        <button type="button" class="back-link" @click="goBack">
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
          <span>بازگشت به سفر</span>
        </button>

        <div class="hero-title-row">
          <span class="hero-icon"><i class="pi pi-wallet" aria-hidden="true"></i></span>
          <div>
            <h1 class="hero-title">ثبت هزینه جدید</h1>
            <p class="hero-subtitle">اطلاعات هزینه را وارد کرده و تصویر رسید را پیوست کنید.</p>
          </div>
        </div>

        <div class="hero-steps" aria-label="مراحل ثبت هزینه">
          <span class="step-item step-active"><i class="pi pi-pencil" aria-hidden="true"></i> اطلاعات هزینه</span>
          <span class="step-separator"></span>
          <span class="step-item"><i class="pi pi-image" aria-hidden="true"></i> تصویر رسید</span>
          <span class="step-separator"></span>
          <span class="step-item"><i class="pi pi-check-circle" aria-hidden="true"></i> ثبت نهایی</span>
        </div>
      </div>
    </section>

    <!-- اطلاعات سقف بودجه -->
    <section v-if="budgetInfo" class="dashboard-card budget-card">
      <div class="section-heading">
        <span class="section-icon budget-icon"><i class="pi pi-chart-line" aria-hidden="true"></i></span>
        <div>
          <h2>وضعیت سقف هزینه</h2>
          <p>میزان مصرف بودجه برای دسته‌بندی انتخاب‌شده</p>
        </div>
      </div>

      <div class="budget-grid">
        <div v-if="budgetInfo.per_trip" class="budget-item">
          <BudgetProgressBar title="سقف سفری" :limit-info="budgetInfo.per_trip" />
        </div>
        <div v-if="budgetInfo.monthly" class="budget-item">
          <BudgetProgressBar title="سقف ماهانه" :limit-info="budgetInfo.monthly" />
        </div>
      </div>
    </section>

    <!-- فرم ثبت هزینه -->
    <form class="dashboard-card expense-form-card" @submit.prevent="submitForm" novalidate>
      <div class="form-card-heading">
        <div>
          <h2>جزئیات هزینه</h2>
          <p>فیلدهای دارای ستاره باید تکمیل شوند.</p>
        </div>
        <span class="required-hint"><span>*</span> الزامی</span>
      </div>

      <div class="form-fields-grid">
        <div class="field-group">
          <label for="expense-category">دسته‌بندی هزینه <span class="required-star">*</span></label>
          <Select
              input-id="expense-category"
              v-model="form.category_id"
              :options="categoryOptions"
              option-label="name"
              option-value="id"
              placeholder="دسته‌بندی را انتخاب کنید"
              class="form-select w-full"
              :invalid="Boolean(errors.category_id)"
              :pt="{
              root: { class: 'form-control-root' },
              label: { class: 'form-control-label' },
              dropdown: { class: 'form-control-dropdown' },
              panel: { class: 'form-control-panel' }
            }"
              @change="onCategoryChange"
          />
          <small v-if="errors.category_id" class="field-error"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errors.category_id }}</small>
        </div>

        <div class="field-group">
          <label for="expense-amount">مبلغ (تومان) <span class="required-star">*</span></label>
          <div class="amount-input-wrap" :class="{ 'control-invalid': errors.amount }">
            <i class="pi pi-wallet amount-input-icon" aria-hidden="true"></i>
            <input
                id="expense-amount"
                v-model="form.amount"
                type="number"
                min="1"
                step="1000"
                inputmode="numeric"
                placeholder="مثلاً ۵۰۰۰۰۰"
                class="form-control amount-input"
                :aria-invalid="Boolean(errors.amount)"
                @input="errors.amount = ''"
            />
            <span class="amount-suffix">تومان</span>
          </div>
          <small v-if="errors.amount" class="field-error"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errors.amount }}</small>
        </div>

        <div class="field-group">
          <label for="expense-date">تاریخ هزینه <span class="required-star">*</span></label>
          <DatePicker
              input-id="expense-date"
              v-model="form.expense_date"
              date-format="yy/mm/dd"
              placeholder="تاریخ هزینه را انتخاب کنید"
              class="form-datepicker w-full"
              :invalid="Boolean(errors.expense_date)"
              show-icon
              icon-display="input"
              :pt="{
              root: { class: 'form-control-root' },
              input: { class: 'form-control' },
              dropdown: { class: 'form-control-dropdown' },
              panel: { class: 'form-control-panel' }
            }"
              @date-select="errors.expense_date = ''"
          />
          <small v-if="errors.expense_date" class="field-error"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errors.expense_date }}</small>
        </div>

        <div class="field-group description-field">
          <label for="expense-description">توضیحات <span class="optional-label">اختیاری</span></label>
          <textarea
              id="expense-description"
              v-model="form.description"
              rows="4"
              maxlength="1000"
              placeholder="در صورت نیاز، جزئیات یا علت انجام هزینه را بنویسید..."
              class="form-control description-input"
          ></textarea>
          <div class="field-footer"><span>از نوشتن اطلاعات غیرضروری خودداری کنید.</span><span>{{ form.description.length }}/1000</span></div>
        </div>
      </div>

      <div class="receipt-section">
        <div class="section-heading">
          <span class="section-icon receipt-icon"><i class="pi pi-image" aria-hidden="true"></i></span>
          <div>
            <h2>تصویر رسید هزینه <span class="required-star">*</span></h2>
            <p>تصویر خوانا و مرتبط با هزینه را بارگذاری کنید.</p>
          </div>
        </div>
        <ReceiptUploader v-model="form.receipt" @error="onReceiptError" />
        <small v-if="errors.receipt" class="field-error receipt-error"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errors.receipt }}</small>
      </div>

      <div class="form-actions">
        <button type="button" class="secondary-button" :disabled="submitting" @click="goBack">
          انصراف
        </button>
        <button type="submit" class="primary-button" :disabled="submitting">
          <i v-if="submitting" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <i v-else class="pi pi-check-circle" aria-hidden="true"></i>
          <span>{{ submitting ? 'در حال ثبت هزینه...' : 'ثبت هزینه' }}</span>
        </button>
      </div>
    </form>

    <!-- پنجره پیام‌ها به‌جای alert ساده -->
    <Dialog
        v-model:visible="showFeedbackDialog"
        modal
        dir="rtl"
        :closable="!submitting"
        :close-on-escape="!submitting"
        :dismissable-mask="!submitting"
        :style="{ width: 'min(92vw, 440px)' }"
        class="expense-feedback-dialog"
    >
      <div class="feedback-content">
        <span class="feedback-icon" :class="feedbackTypeClass">
          <i :class="feedbackIcon" aria-hidden="true"></i>
        </span>
        <h3>{{ feedbackTitle }}</h3>
        <p class="feedback-message">{{ feedbackMessage }}</p>
        <div v-if="feedbackDetails" class="feedback-details">
          <i class="pi pi-info-circle" aria-hidden="true"></i>
          <span>{{ feedbackDetails }}</span>
        </div>
        <Button
            :label="feedbackButtonLabel"
            :icon="feedbackButtonIcon"
            :severity="feedbackButtonSeverity"
            class="feedback-action-button"
            @click="handleFeedbackAction"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useTripExpenseStore } from '@/stores/tripExpenseStore'
import { useExpenseCategoryStore } from '@/stores/expenseCategoryStore'
import ReceiptUploader from '@/components/trip-expense/ReceiptUploader.vue'
import BudgetProgressBar from '@/components/trip-expense/BudgetProgressBar.vue'

const route = useRoute()
const router = useRouter()
const expenseStore = useTripExpenseStore()
const categoryStore = useExpenseCategoryStore()

const tripId = computed(() => route.params.tripId)
const categoryOptions = computed(() => categoryStore.options)
const budgetInfo = ref(null)
const submitting = ref(false)

const showFeedbackDialog = ref(false)
const feedbackType = ref('error')
const feedbackTitle = ref('')
const feedbackMessage = ref('')
const feedbackDetails = ref('')
const feedbackAction = ref('close')

const feedbackTypeClass = computed(() => ({
  'feedback-icon-success': feedbackType.value === 'success',
  'feedback-icon-warning': feedbackType.value === 'warning',
  'feedback-icon-error': feedbackType.value === 'error',
  'feedback-icon-info': feedbackType.value === 'info',
}))

const feedbackIcon = computed(() => ({
  success: 'pi pi-check-circle',
  warning: 'pi pi-exclamation-triangle',
  error: 'pi pi-times-circle',
  info: 'pi pi-info-circle',
}[feedbackType.value] || 'pi pi-info-circle'))

const feedbackButtonLabel = computed(() => feedbackAction.value === 'navigate' ? 'مشاهده سفر' : 'متوجه شدم')
const feedbackButtonIcon = computed(() => feedbackAction.value === 'navigate' ? 'pi pi-arrow-left' : 'pi pi-check')
const feedbackButtonSeverity = computed(() => ({
  success: 'success',
  warning: 'warn',
  error: 'danger',
  info: 'secondary',
}[feedbackType.value] || 'secondary'))

const form = reactive({
  category_id: null,
  amount: null,
  expense_date: null,
  description: '',
  receipt: null,
})

const errors = reactive({
  category_id: '',
  amount: '',
  expense_date: '',
  receipt: '',
})

const openFeedback = ({ type = 'error', title, message, details = '', action = 'close' }) => {
  feedbackType.value = type
  feedbackTitle.value = title
  feedbackMessage.value = message
  feedbackDetails.value = details
  feedbackAction.value = action
  showFeedbackDialog.value = true
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'trip-expense.trips.show', params: { id: tripId.value } })
}

const onCategoryChange = async () => {
  errors.category_id = ''
  if (!form.category_id) {
    budgetInfo.value = null
    return
  }

  try {
    budgetInfo.value = await expenseStore.fetchBudget(tripId.value, form.category_id)
  } catch (error) {
    console.error('خطا در دریافت اطلاعات سقف هزینه:', error)
    budgetInfo.value = null
  }
}

const onReceiptError = (message) => {
  // خطاهای خود کامپوننت ReceiptUploader در همان کامپوننت مدیریت می‌شوند.
  console.warn('خطای بارگذاری رسید:', message)
}

const validate = () => {
  errors.category_id = ''
  errors.amount = ''
  errors.expense_date = ''
  errors.receipt = ''

  let valid = true

  if (!form.category_id) {
    errors.category_id = 'انتخاب دسته‌بندی الزامی است.'
    valid = false
  }

  if (form.amount === null || form.amount === '' || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
    errors.amount = 'مبلغی معتبر و بزرگ‌تر از صفر وارد کنید.'
    valid = false
  }

  if (!form.expense_date) {
    errors.expense_date = 'انتخاب تاریخ هزینه الزامی است.'
    valid = false
  }

  if (!form.receipt) {
    errors.receipt = 'بارگذاری تصویر رسید برای ثبت هزینه الزامی است.'
    valid = false
  }

  if (!valid) {
    openFeedback({
      type: 'warning',
      title: 'اطلاعات ناقص است',
      message: 'لطفاً موارد مشخص‌شده را بررسی و تکمیل کنید.',
      details: 'فیلدهای دارای علامت ستاره و تصویر رسید باید تکمیل شوند.',
    })
  }

  return valid
}

const formatDate = (date) => {
  if (!date) return null

  // استفاده از تاریخ محلی مانع جابه‌جایی روز به‌دلیل اختلاف منطقه زمانی می‌شود.
  if (date instanceof Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return date
}

const handleFeedbackAction = async () => {
  showFeedbackDialog.value = false
  if (feedbackAction.value === 'navigate') {
    await router.push({ name: 'trip-expense.trips.show', params: { id: tripId.value } })
  }
}

const submitForm = async () => {
  if (submitting.value || !validate()) return

  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('category_id', form.category_id)
    formData.append('amount', String(form.amount))
    formData.append('expense_date', formatDate(form.expense_date))
    formData.append('receipt', form.receipt)

    if (form.description.trim()) formData.append('description', form.description.trim())

    const response = await expenseStore.createExpense(tripId.value, formData)

    if (response?.limit_info?.exceeded) {
      openFeedback({
        type: 'warning',
        title: 'هزینه ثبت شد؛ نیازمند تأیید ویژه',
        message: response.limit_info.warning_message || 'این هزینه از سقف مجاز عبور کرده است.',
        details: 'هزینه ثبت شده است، اما مطابق روال سامانه به تأیید ویژه مدیر نیاز دارد.',
        action: 'navigate',
      })
    } else {
      openFeedback({
        type: 'success',
        title: 'هزینه با موفقیت ثبت شد',
        message: response?.message || 'اطلاعات هزینه و رسید آن با موفقیت ثبت شد.',
        details: 'برای مشاهده جزئیات، به صفحه سفر بازگردید.',
        action: 'navigate',
      })
    }
  } catch (error) {
    console.error('خطا در ثبت هزینه:', error)

    const serverMessage = error?.response?.data?.message
    openFeedback({
      type: 'error',
      title: 'ثبت هزینه انجام نشد',
      message: serverMessage || 'هنگام ثبت هزینه خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      details: 'اگر مشکل ادامه داشت، اتصال شبکه و اطلاعات واردشده را بررسی کنید.',
    })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    await categoryStore.fetchOptions()
  } catch (error) {
    console.error('خطا در دریافت دسته‌بندی هزینه‌ها:', error)
    openFeedback({
      type: 'error',
      title: 'دریافت اطلاعات ناموفق بود',
      message: 'فهرست دسته‌بندی‌های هزینه بارگذاری نشد.',
      details: 'صفحه را دوباره بارگذاری کنید یا اتصال شبکه را بررسی کنید.',
    })
  }
})
</script>

<style scoped>
.expense-form-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #253047;
  animation: dashboard-enter .4s ease-out;
}
.dashboard-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 1.5rem;
  border: 1px solid #e1e7ff;
  border-radius: 1.5rem;
  background: linear-gradient(125deg, #eef2ff 0%, #fafbff 55%, #f4f0ff 100%);
  box-shadow: 0 8px 28px rgb(79 70 229 / 5%);
}
.hero-content { position: relative; z-index: 1; }
.hero-decoration { position: absolute; z-index: -1; border-radius: 999px; pointer-events: none; filter: blur(45px); }
.hero-decoration-one { top: -100px; left: -55px; width: 230px; height: 230px; background: rgb(129 140 248 / 18%); }
.hero-decoration-two { right: 12%; bottom: -125px; width: 210px; height: 210px; background: rgb(167 139 250 / 15%); }
.back-link {
  display: inline-flex; align-items: center; gap: .5rem; margin-bottom: 1.25rem;
  border: 0; background: transparent; color: #64708a; font: inherit; font-size: .8rem;
  cursor: pointer; transition: color .2s ease;
}
.back-link:hover { color: #5b4be0; }
.hero-title-row { display: flex; align-items: center; gap: 1rem; }
.hero-icon {
  display: grid; place-items: center; flex: 0 0 auto; width: 3.5rem; height: 3.5rem;
  border: 1px solid rgb(255 255 255 / 80%); border-radius: 1.15rem;
  background: rgb(255 255 255 / 78%); color: #5b4be0; font-size: 1.35rem;
  box-shadow: 0 6px 18px rgb(79 70 229 / 9%);
}
.hero-title { margin: 0; color: #202940; font-size: clamp(1.25rem, 2vw, 1.65rem); font-weight: 850; letter-spacing: -.025em; }
.hero-subtitle { margin: .4rem 0 0; color: #69758d; font-size: .88rem; line-height: 1.9; }
.hero-steps { display: flex; align-items: center; gap: .7rem; margin-top: 1.6rem; color: #7d879c; }
.step-item { display: inline-flex; align-items: center; gap: .4rem; font-size: .72rem; white-space: nowrap; }
.step-item i { font-size: .8rem; }
.step-active { color: #5545d4; font-weight: 750; }
.step-separator { width: 28px; height: 1px; background: #d7dcf0; }
.dashboard-card { overflow: hidden; border: 1px solid #e7eaf1; border-radius: 1.25rem; background: #fff; box-shadow: 0 3px 14px rgb(23 34 58 / 3%); }
.budget-card { padding: 1.25rem; }
.section-heading { display: flex; align-items: center; gap: .8rem; margin-bottom: 1rem; }
.section-icon { display: grid; place-items: center; flex: 0 0 auto; width: 2.65rem; height: 2.65rem; border-radius: .9rem; font-size: 1rem; }
.budget-icon { color: #5b4be0; background: #f0efff; }
.receipt-icon { color: #0e8c76; background: #e8f8f4; }
.section-heading h2, .form-card-heading h2 { margin: 0; color: #293247; font-size: .95rem; font-weight: 800; }
.section-heading p, .form-card-heading p { margin: .25rem 0 0; color: #8992a4; font-size: .75rem; line-height: 1.8; }
.budget-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; }
.budget-item { min-width: 0; padding: .9rem; border: 1px solid #edf0f6; border-radius: .9rem; background: #fafbfe; }
.expense-form-card { padding: clamp(1rem, 3vw, 1.75rem); }
.form-card-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1.2rem; margin-bottom: 1.3rem; border-bottom: 1px solid #edf0f5; }
.required-hint { color: #8b93a4; font-size: .72rem; white-space: nowrap; }
.required-hint span, .required-star { color: #e05252; }
.form-fields-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.35rem 1.1rem; }
.field-group { display: flex; flex-direction: column; gap: .55rem; min-width: 0; }
.field-group > label { color: #4d586d; font-size: .79rem; font-weight: 750; }
.optional-label { margin-right: .35rem; color: #9aa2b1; font-size: .68rem; font-weight: 500; }
.form-control, .amount-input-wrap {
  box-sizing: border-box; width: 100%; min-height: 46px; border: 1px solid #dfe4ed; border-radius: .85rem;
  background: #fbfcfe; color: #293247; font-family: inherit; font-size: .82rem; transition: border-color .2s, box-shadow .2s, background .2s;
}
.form-control { padding: .75rem .9rem; outline: none; }
.form-control::placeholder { color: #a2aabb; }
.form-control:focus, .amount-input-wrap:focus-within { border-color: #9385f4; background: #fff; box-shadow: 0 0 0 3px rgb(139 124 246 / 13%); }
.amount-input-wrap { display: flex; align-items: center; gap: .65rem; padding: 0 .85rem; }
.amount-input-icon { color: #8d86d9; font-size: .9rem; }
.amount-input { min-width: 0; flex: 1; border: 0; padding-right: 0; padding-left: 0; background: transparent; box-shadow: none; }
.amount-input:focus { border: 0; box-shadow: none; }
.amount-suffix { flex: 0 0 auto; padding-right: .7rem; border-right: 1px solid #e7eaf1; color: #8a93a5; font-size: .72rem; }
.description-field { grid-column: 1 / -1; }
.description-input { min-height: 112px; resize: vertical; line-height: 1.9; }
.field-footer { display: flex; justify-content: space-between; gap: .75rem; color: #9aa2b1; font-size: .68rem; }
.field-error { display: flex; align-items: flex-start; gap: .35rem; color: #c24141; font-size: .72rem; line-height: 1.8; }
.field-error i { margin-top: .22rem; flex: 0 0 auto; }
.control-invalid, .amount-input-wrap.control-invalid { border-color: #e58b8b; background: #fffafa; }
.receipt-section { padding-top: 1.5rem; margin-top: 1.6rem; border-top: 1px solid #edf0f5; }
.receipt-section .section-heading { margin-bottom: .9rem; }
.receipt-error { margin-top: .7rem; }
.form-actions { display: flex; justify-content: flex-end; gap: .75rem; padding-top: 1.35rem; margin-top: 1.5rem; border-top: 1px solid #edf0f5; }
.primary-button, .secondary-button {
  display: inline-flex; align-items: center; justify-content: center; gap: .55rem; min-height: 45px; padding: .75rem 1.25rem;
  border: 1px solid transparent; border-radius: .85rem; font-family: inherit; font-size: .8rem; font-weight: 750; cursor: pointer;
  transition: transform .18s ease, background .18s ease, box-shadow .18s ease;
}
.primary-button { color: #fff; background: linear-gradient(135deg, #6556e8, #5140d0); box-shadow: 0 6px 15px rgb(91 75 224 / 20%); }
.primary-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 9px 20px rgb(91 75 224 / 25%); }
.secondary-button { border-color: #e2e6ee; color: #596479; background: #f8f9fc; }
.secondary-button:hover:not(:disabled) { background: #eef1f7; }
.primary-button:disabled, .secondary-button:disabled { opacity: .6; cursor: not-allowed; }
.feedback-content { display: flex; flex-direction: column; align-items: center; padding: .5rem .25rem .15rem; text-align: center; }
.feedback-icon { display: grid; place-items: center; width: 62px; height: 62px; margin-bottom: 1rem; border-radius: 20px; font-size: 1.75rem; }
.feedback-icon-success { color: #16845b; background: #e8f8f0; }
.feedback-icon-warning { color: #a96c08; background: #fff5dd; }
.feedback-icon-error { color: #c24141; background: #fff0f0; }
.feedback-icon-info { color: #4265bf; background: #edf3ff; }
.feedback-content h3 { margin: 0 0 .6rem; color: #202940; font-size: 1.02rem; font-weight: 850; line-height: 1.8; }
.feedback-message { margin: 0; color: #667187; font-size: .84rem; line-height: 2; white-space: pre-line; }
.feedback-details { display: flex; align-items: flex-start; gap: .5rem; width: 100%; box-sizing: border-box; margin-top: 1rem; padding: .8rem .9rem; border: 1px solid #e9edf4; border-radius: .8rem; color: #6d7890; background: #f8faff; text-align: right; font-size: .75rem; line-height: 1.9; }
.feedback-details i { margin-top: .25rem; color: #6c69ce; flex: 0 0 auto; }
.feedback-action-button { min-width: 150px; min-height: 43px; margin-top: 1.2rem; border-radius: .8rem; font-family: inherit; font-size: .8rem; font-weight: 750; }
.form-select, .form-datepicker { display: block; min-height: 46px; }
.form-select :deep(.p-select), .form-datepicker :deep(.p-datepicker) { width: 100%; min-height: 46px; border: 1px solid #dfe4ed; border-radius: .85rem; background: #fbfcfe; box-shadow: none; transition: border-color .2s, box-shadow .2s; }
.form-select :deep(.p-select:not(.p-disabled):hover), .form-datepicker :deep(.p-datepicker:not(.p-disabled):hover) { border-color: #b5acf7; }
.form-select :deep(.p-select.p-focus), .form-datepicker :deep(.p-datepicker:focus-within) { border-color: #9385f4; box-shadow: 0 0 0 3px rgb(139 124 246 / 13%); }
.form-select :deep(.p-select-label), .form-datepicker :deep(input) { padding: .75rem .9rem; color: #293247; font-family: inherit; font-size: .82rem; }
.form-select :deep(.p-select-label.p-placeholder), .form-datepicker :deep(input::placeholder) { color: #a2aabb; }
.form-select :deep(.p-select-dropdown), .form-datepicker :deep(.p-datepicker-dropdown) { color: #7c83a0; }
.form-select :deep(.p-select-overlay), .form-datepicker :deep(.p-datepicker-panel) { overflow: hidden; border: 1px solid #e3e7f0; border-radius: .9rem; box-shadow: 0 12px 32px rgb(25 35 60 / 13%); }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 700px) {
  .dashboard-hero { padding: 1.2rem; border-radius: 1.2rem; }
  .hero-icon { width: 3rem; height: 3rem; border-radius: 1rem; }
  .hero-steps { gap: .45rem; flex-wrap: wrap; }
  .step-item { font-size: .67rem; }
  .step-separator { width: 14px; }
  .budget-grid, .form-fields-grid { grid-template-columns: minmax(0, 1fr); }
  .description-field { grid-column: auto; }
  .budget-card { padding: 1rem; }
}
@media (max-width: 440px) {
  .hero-title-row { align-items: flex-start; gap: .75rem; }
  .hero-subtitle { font-size: .78rem; }
  .hero-steps { align-items: flex-start; }
  .step-separator { width: 8px; margin-top: .45rem; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions button { width: 100%; }
  .form-card-heading { align-items: flex-start; }
}
</style>
