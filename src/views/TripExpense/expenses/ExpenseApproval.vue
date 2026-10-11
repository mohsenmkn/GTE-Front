<!-- src/views/TripExpense/expenses/ExpenseApproval.vue -->

<template>
  <div class="expense-approval-page" dir="rtl">
    <!-- Header -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="hero-content">
        <div class="hero-icon">
          <i class="pi pi-shield"></i>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="hero-title">تأیید هزینه‌های سفر</h1>
            <span class="hero-badge">
              <i class="pi pi-check-circle"></i>
              مدیریت هزینه‌ها
            </span>
          </div>

          <p class="hero-subtitle">
            بررسی مستندات، کنترل سقف هزینه‌ها و تأیید یا رد هزینه‌های ثبت‌شده توسط رانندگان
          </p>
        </div>

        <button
            type="button"
            class="hero-refresh"
            :disabled="loading"
            @click="loadData"
        >
          <i class="pi pi-refresh" :class="{ 'animate-spin': loading }"></i>
          <span>بروزرسانی</span>
        </button>
      </div>

      <div class="hero-footer">
        <div class="hero-stat">
          <span class="hero-stat-icon">
            <i class="pi pi-wallet"></i>
          </span>
          <div>
            <span class="hero-stat-label">کل هزینه‌های یافت‌شده</span>
            <strong>{{ formatNumber(pagination.total) }}</strong>
          </div>
        </div>

        <div class="hero-stat">
          <span class="hero-stat-icon pending-icon">
            <i class="pi pi-clock"></i>
          </span>
          <div>
            <span class="hero-stat-label">تعداد در این صفحه</span>
            <strong>{{ formatNumber(expenses.length) }}</strong>
          </div>
        </div>

        <div class="hero-stat">
          <span class="hero-stat-icon filter-icon">
            <i class="pi pi-filter"></i>
          </span>
          <div>
            <span class="hero-stat-label">وضعیت فیلتر</span>
            <strong>{{ filters.status ? statusLabel(filters.status) : 'همه وضعیت‌ها' }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="dashboard-card">
      <div class="section-heading">
        <div class="section-heading-main">
          <span class="section-icon filter-section-icon">
            <i class="pi pi-sliders-h"></i>
          </span>
          <div>
            <h2 class="section-title">فیلتر و جست‌وجوی هزینه‌ها</h2>
            <p class="section-description">
              با انتخاب فیلترها، هزینه‌های موردنظر را محدود کنید.
            </p>
          </div>
        </div>

        <button
            type="button"
            class="reset-button"
            @click="resetFilters"
            :disabled="loading"
        >
          <i class="pi pi-refresh"></i>
          <span>بازنشانی فیلترها</span>
        </button>
      </div>

      <div class="filter-grid">
        <div class="filter-field">
          <label for="expense-status">وضعیت تأیید</label>
          <Select
              inputId="expense-status"
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="همه وضعیت‌ها"
              class="w-full"
              @change="applyFilters"
          />
        </div>

        <div class="filter-field">
          <label for="expense-category">دسته‌بندی هزینه</label>
          <Select
              inputId="expense-category"
              v-model="filters.category_id"
              :options="categoryOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="همه دسته‌ها"
              class="w-full"
              showClear
              :loading="categoriesLoading"
              @change="applyFilters"
          />
        </div>

        <div class="filter-field">
          <label for="expense-limit">کنترل سقف هزینه</label>
          <Select
              inputId="expense-limit"
              v-model="filters.exceeded_only"
              :options="exceededOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="همه هزینه‌ها"
              class="w-full"
              @change="applyFilters"
          />
        </div>

        <div class="filter-field filter-action-field">
          <label class="invisible">اعمال فیلتر</label>
          <button
              type="button"
              class="apply-button"
              :disabled="loading"
              @click="applyFilters"
          >
            <i class="pi pi-search"></i>
            <span>نمایش نتایج</span>
          </button>
        </div>
      </div>

      <div class="active-filters">
        <i class="pi pi-info-circle"></i>
        <span>فیلتر فعال:</span>
        <span class="filter-chip">
          {{ filters.status ? statusLabel(filters.status) : 'همه وضعیت‌ها' }}
        </span>

        <span v-if="filters.category_id != null" class="filter-chip">
          {{ selectedCategoryName }}
        </span>

        <span v-if="filters.exceeded_only" class="filter-chip exceeded-chip">
          تجاوز از سقف هزینه
        </span>
      </div>
    </section>

    <!-- Expenses table -->
    <section class="dashboard-card table-card">
      <div class="section-heading table-heading">
        <div class="section-heading-main">
          <span class="section-icon table-section-icon">
            <i class="pi pi-list-check"></i>
          </span>
          <div>
            <h2 class="section-title">فهرست هزینه‌های سفر</h2>
            <p class="section-description">
              {{ formatNumber(pagination.total) }} رکورد مطابق فیلترهای انتخاب‌شده
            </p>
          </div>
        </div>

        <span class="table-count">
          <i class="pi pi-file"></i>
          صفحه {{ formatNumber(pagination.current_page) }}
        </span>
      </div>

      <div class="table-wrapper">
        <DataTable
            :value="expenses"
            :loading="loading"
            lazy
            paginator
            dataKey="id"
            :first="(pagination.current_page - 1) * pagination.per_page"
            :rows="pagination.per_page"
            :totalRecords="pagination.total"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            stripedRows
            responsiveLayout="scroll"
            @page="onPage"
            class="expense-table"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="{first} تا {last} از {totalRecords}"
        >
          <template #empty>
            <div class="empty-state">
              <span class="empty-icon">
                <i class="pi pi-inbox"></i>
              </span>
              <h3>هزینه‌ای یافت نشد</h3>
              <p>با تغییر فیلترها می‌توانید نتایج دیگری را بررسی کنید.</p>
              <button type="button" class="reset-button" @click="resetFilters">
                <i class="pi pi-refresh"></i>
                پاک کردن فیلترها
              </button>
            </div>
          </template>

          <template #loading>
            <div class="table-loading">
              <i class="pi pi-spin pi-spinner"></i>
              <span>در حال دریافت اطلاعات هزینه‌ها...</span>
            </div>
          </template>

          <Column header="شناسه" style="min-width: 85px">
            <template #body="{ data }">
              <span class="id-cell">#{{ data.id }}</span>
            </template>
          </Column>

          <Column header="راننده" style="min-width: 190px">
            <template #body="{ data }">
              <div class="driver-cell">
                <span class="driver-avatar">
                  <i class="pi pi-user"></i>
                </span>
                <div class="min-w-0">
                  <div class="driver-name">
                    {{ data.trip?.driver?.name || 'نامشخص' }}
                  </div>
                  <div class="driver-code">
                    کد پرسنلی:
                    {{ data.trip?.driver?.personnel_code || '—' }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="مسیر سفر" style="min-width: 190px">
            <template #body="{ data }">
              <div class="route-cell">
                <div class="route-point">
                  <i class="pi pi-circle-fill"></i>
                  <span>{{ data.trip?.origin || 'مبدأ نامشخص' }}</span>
                </div>
                <div class="route-line"></div>
                <div class="route-point">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ data.trip?.destination || 'مقصد نامشخص' }}</span>
                </div>
              </div>
            </template>
          </Column>

          <Column header="دسته‌بندی" style="min-width: 135px">
            <template #body="{ data }">
              <span class="category-cell">
                <i class="pi pi-tag"></i>
                {{ data.category?.name || 'بدون دسته' }}
              </span>
            </template>
          </Column>

          <Column header="مبلغ هزینه" style="min-width: 145px">
            <template #body="{ data }">
              <div class="amount-cell">
                <strong>{{ formatMoney(data.amount) }}</strong>
                <span v-if="data.exceeded_limit" class="exceeded-label">
                  <i class="pi pi-exclamation-triangle"></i>
                  بیشتر از سقف
                </span>
              </div>
            </template>
          </Column>

          <Column header="تاریخ هزینه" style="min-width: 120px">
            <template #body="{ data }">
              <span class="date-cell">
                <i class="pi pi-calendar"></i>
                {{ toJalali(data.expense_date) || '—' }}
              </span>
            </template>
          </Column>

          <Column header="رسید" style="min-width: 100px">
            <template #body="{ data }">
              <button
                  v-if="data.receipt_url"
                  type="button"
                  class="receipt-button"
                  :disabled="isProcessing(data.id)"
                  @click="viewReceipt(data)"
              >
                <i class="pi pi-image"></i>
                مشاهده
              </button>
              <span v-else class="muted-text">بدون رسید</span>
            </template>
          </Column>

          <Column header="وضعیت" style="min-width: 125px">
            <template #body="{ data }">
              <ExpenseStatusBadge
                  :status="data.status"
                  :exceeded="data.exceeded_limit"
              />
            </template>
          </Column>

          <Column header="عملیات" style="min-width: 180px">
            <template #body="{ data }">
              <div v-if="data.status === 'pending'" class="action-buttons">
                <button
                    type="button"
                    class="approve-button"
                    :disabled="isProcessing(data.id)"
                    @click="openApproveDialog(data)"
                >
                  <i
                      class="pi"
                      :class="isProcessing(data.id) ? 'pi-spin pi-spinner' : 'pi-check'"
                  ></i>
                  <span>تأیید</span>
                </button>

                <button
                    type="button"
                    class="reject-button"
                    :disabled="isProcessing(data.id)"
                    @click="openRejectDialog(data)"
                >
                  <i class="pi pi-times"></i>
                  <span>رد</span>
                </button>
              </div>

              <span v-else class="processed-label">
                <i
                    class="pi"
                    :class="data.status === 'approved' ? 'pi-check-circle' : 'pi-ban'"
                ></i>
                {{ statusLabel(data.status) }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <!-- Approve dialog -->
    <Dialog
        v-model:visible="approveDialog.visible"
        modal
        :closable="!approveSubmitting"
        :closeOnEscape="!approveSubmitting"
        :style="{ width: 'min(440px, calc(100vw - 32px))' }"
        class="approve-dialog"
    >
      <template #header>
        <div class="dialog-heading approve-heading">
          <span class="dialog-icon approve-icon">
            <i class="pi pi-check-circle"></i>
          </span>
          <div>
            <h3>تأیید هزینه سفر</h3>
            <p>آیا از تأیید این هزینه اطمینان دارید؟</p>
          </div>
        </div>
      </template>

      <div class="approve-form">
        <div class="approve-notice">
          <i class="pi pi-info-circle"></i>
          <span>
            هزینه شماره
            <strong>#{{ approveDialog.expenseId ?? '—' }}</strong>
            پس از تأیید، در محاسبات نهایی لحاظ خواهد شد و این عملیات قابل بازگشت نیست.
          </span>
        </div>

        <div class="dialog-actions">
          <button
              type="button"
              class="cancel-button"
              :disabled="approveSubmitting"
              @click="approveDialog.visible = false"
          >
            انصراف
          </button>

          <button
              type="button"
              class="confirm-approve-button"
              :disabled="approveSubmitting"
              @click="confirmApprove"
          >
            <i
                class="pi"
                :class="approveSubmitting ? 'pi-spin pi-spinner' : 'pi-check'"
            ></i>
            {{ approveSubmitting ? 'در حال تأیید...' : 'تأیید و ثبت نهایی' }}
          </button>
        </div>
      </div>
    </Dialog>

    <!-- Reject dialog -->
    <Dialog
        v-model:visible="rejectDialog.visible"
        modal
        :closable="!rejectSubmitting"
        :closeOnEscape="!rejectSubmitting"
        :style="{ width: 'min(460px, calc(100vw - 32px))' }"
        class="reject-dialog"
    >
      <template #header>
        <div class="dialog-heading">
          <span class="dialog-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </span>
          <div>
            <h3>رد هزینه سفر</h3>
            <p>دلیل رد باید به‌صورت شفاف ثبت شود.</p>
          </div>
        </div>
      </template>

      <form class="reject-form" @submit.prevent="confirmReject">
        <div class="reject-notice">
          <i class="pi pi-info-circle"></i>
          <span>
            هزینه شماره
            <strong>#{{ rejectDialog.expenseId ?? '—' }}</strong>
            پس از ثبت دلیل، رد خواهد شد.
          </span>
        </div>

        <label for="reject-reason" class="reject-label">
          دلیل رد هزینه
          <span>*</span>
        </label>

        <textarea
            id="reject-reason"
            v-model="rejectDialog.reason"
            rows="5"
            maxlength="1000"
            required
            placeholder="دلیل رد هزینه را بنویسید..."
            class="reject-textarea"
            :disabled="rejectSubmitting"
        ></textarea>

        <div class="character-count">
          {{ rejectDialog.reason.length }} از ۱۰۰۰ نویسه
        </div>

        <div class="dialog-actions">
          <button
              type="button"
              class="cancel-button"
              :disabled="rejectSubmitting"
              @click="rejectDialog.visible = false"
          >
            انصراف
          </button>

          <button
              type="submit"
              class="confirm-reject-button"
              :disabled="rejectSubmitting || !rejectDialog.reason.trim()"
          >
            <i
                class="pi"
                :class="rejectSubmitting ? 'pi-spin pi-spinner' : 'pi-times'"
            ></i>
            {{ rejectSubmitting ? 'در حال ثبت...' : 'تأیید و ثبت رد' }}
          </button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import tripExpenseService from '@/services/tripExpenseService'
import { useExpenseCategoryStore } from '@/stores/expenseCategoryStore'
import ExpenseStatusBadge from '@/components/trip-expense/ExpenseStatusBadge.vue'
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()

import { useToast } from 'primevue/usetoast'

const toast = useToast()
const categoryStore = useExpenseCategoryStore()

const expenses = ref([])
const loading = ref(false)
const categoriesLoading = ref(false)
const rejectSubmitting = ref(false)
const approveSubmitting = ref(false)
const processingIds = ref(new Set())
const categoryOptions = ref([])

const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0,
})

const filters = reactive({
  status: 'pending',
  category_id: null,
  exceeded_only: false,
})

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  { label: 'در انتظار تأیید', value: 'pending' },
  { label: 'تأیید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
]

const exceededOptions = [
  { label: 'همه هزینه‌ها', value: false },
  { label: 'فقط تجاوز از سقف', value: true },
]

const rejectDialog = reactive({
  visible: false,
  expenseId: null,
  reason: '',
})

const approveDialog = reactive({
  visible: false,
  expenseId: null,
})

const selectedCategoryName = computed(() => {
  const category = categoryOptions.value.find(
      item => String(item.id) === String(filters.category_id)
  )

  return category?.name || 'دسته انتخاب‌شده'
})

const statusLabel = (status) => {
  const labels = {
    pending: 'در انتظار تأیید',
    approved: 'تأیید شده',
    rejected: 'رد شده',
  }

  return labels[status] || 'نامشخص'
}

const formatNumber = (value) => {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number.toLocaleString('fa-IR') : '۰'
}

const formatMoney = (value) => {
  const number = Number(value ?? 0)

  if (!Number.isFinite(number)) return '—'

  return `${number.toLocaleString('fa-IR')} تومان`
}

const isProcessing = (id) => processingIds.value.has(id)

const setProcessing = (id, processing) => {
  const next = new Set(processingIds.value)

  if (processing) {
    next.add(id)
  } else {
    next.delete(id)
  }

  processingIds.value = next
}

const normalizeExpenseResponse = (response) => {
  const payload = response?.data ?? response

  let rows = []

  if (Array.isArray(payload)) {
    rows = payload
  } else if (Array.isArray(payload?.data)) {
    rows = payload.data
  } else if (Array.isArray(payload?.expenses)) {
    rows = payload.expenses
  } else if (Array.isArray(response?.expenses)) {
    rows = response.expenses
  }

  const meta =
      payload?.meta ??
      response?.meta ??
      payload?.pagination ??
      response?.pagination ??
      null

  return { rows, meta }
}

const loadData = async () => {
  if (loading.value) return

  loading.value = true

  try {
    const params = {
      page: pagination.current_page,
      per_page: pagination.per_page,
    }

    if (filters.status) {
      params.status = filters.status
    }

    if (filters.category_id != null && filters.category_id !== '') {
      params.category_id = filters.category_id
    }

    if (filters.exceeded_only === true) {
      params.exceeded_limit = 1
    }

    const response = await tripExpenseService.getAllExpenses(params)
    const { rows, meta } = normalizeExpenseResponse(response)

    expenses.value = rows

    if (meta) {
      pagination.current_page = Number(
          meta.current_page ?? meta.currentPage ?? pagination.current_page
      )
      pagination.per_page = Number(
          meta.per_page ?? meta.perPage ?? pagination.per_page
      )
      pagination.total = Number(meta.total ?? pagination.total)
    } else {
      pagination.total = rows.length
    }
  } catch (error) {
    console.error('Error loading expenses:', error)
    expenses.value = []
    pagination.total = 0
    alert('دریافت فهرست هزینه‌ها با خطا مواجه شد.')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  pagination.current_page = 1
  loadData()
}

const resetFilters = () => {
  filters.status = 'pending'
  filters.category_id = null
  filters.exceeded_only = false

  pagination.current_page = 1
  loadData()
}

const onPage = (event) => {
  pagination.current_page = event.page + 1
  pagination.per_page = event.rows
  loadData()
}

const openApproveDialog = (expense) => {
  approveDialog.expenseId = expense.id
  approveDialog.visible = true
}

const confirmApprove = async () => {
  const id = approveDialog.expenseId
  if (id == null || approveSubmitting.value) return

  approveSubmitting.value = true
  setProcessing(id, true)

  try {
    await tripExpenseService.approveExpense(id)

    approveDialog.visible = false
    approveDialog.expenseId = null

    toast.add({
      severity: 'success',
      summary: 'تأیید موفق',
      detail: 'هزینه با موفقیت تأیید شد.',
      life: 3500,
    })

    await loadData()
  } catch (error) {
    console.error('Error approving expense:', error)

    toast.add({
      severity: 'error',
      summary: 'خطا در تأیید',
      detail: error?.response?.data?.message || 'تأیید هزینه با خطا مواجه شد.',
      life: 5000,
    })
  } finally {
    approveSubmitting.value = false
    setProcessing(id, false)
  }
}

const openRejectDialog = (expense) => {
  rejectDialog.expenseId = expense.id
  rejectDialog.reason = ''
  rejectDialog.visible = true
}

const confirmReject = async () => {
  const reason = rejectDialog.reason.trim()
  const id = rejectDialog.expenseId

  if (!reason || id == null || rejectSubmitting.value) return

  rejectSubmitting.value = true
  setProcessing(id, true)

  try {
    await tripExpenseService.rejectExpense(id, reason)

    rejectDialog.visible = false
    rejectDialog.expenseId = null
    rejectDialog.reason = ''

    toast.add({
      severity: 'success',
      summary: 'رد موفق',
      detail: 'هزینه با موفقیت رد شد.',
      life: 3500,
    })

    await loadData()
  } catch (error) {
    console.error('Error rejecting expense:', error)
    toast.add({
      severity: 'error',
      summary: 'خطا در رد',
      detail: error?.response?.data?.message || 'رد هزینه با خطا مواجه شد.',
      life: 5000,
    })
  } finally {
    rejectSubmitting.value = false
    setProcessing(id, false)
  }
}

const viewReceipt = async (expense) => {
  if (isProcessing(expense.id)) return

  setProcessing(expense.id, true)

  let objectUrl = null

  try {
    const response = await tripExpenseService.getReceipt(expense.id)

    const content = response instanceof Blob
        ? response
        : response?.data

    if (typeof content === 'string' && /^https?:\/\//i.test(content)) {
      window.open(content, '_blank', 'noopener,noreferrer')
      return
    }

    if (!(content instanceof Blob) && !(content instanceof ArrayBuffer)) {
      throw new Error('ساختار فایل رسید معتبر نیست.')
    }

    const blob = content instanceof Blob
        ? content
        : new Blob([content])

    objectUrl = window.URL.createObjectURL(blob)

    const openedWindow = window.open(
        objectUrl,
        '_blank',
        'noopener,noreferrer'
    )

    if (!openedWindow) {
      window.location.href = objectUrl
      objectUrl = null
    }
  } catch (error) {
    console.error('Error loading receipt:', error)
    alert('دریافت رسید با خطا مواجه شد.')
  } finally {
    setProcessing(expense.id, false)
  }
}

const loadCategories = async () => {
  categoriesLoading.value = true

  try {
    await categoryStore.fetchOptions()

    categoryOptions.value = Array.isArray(categoryStore.options)
        ? categoryStore.options
        : []
  } catch (error) {
    console.error('Error loading expense categories:', error)
    categoryOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  await loadData()
})
</script>

<style scoped>
.expense-approval-page {
  --approval-primary: #6366f1;
  --approval-primary-dark: #4f46e5;
  --approval-border: #e8eaf2;
  --approval-muted: #7c8498;

  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: approval-enter 0.35s ease-out;
}

.dashboard-hero {
  position: relative;
  overflow: hidden;
  border: 1px solid #e1e6ff;
  border-radius: 1.5rem;
  padding: 1.5rem;
  background:
      linear-gradient(115deg, #f0f2ff 0%, #fafbff 52%, #f5f0ff 100%);
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}

.hero-decoration {
  position: absolute;
  pointer-events: none;
  border-radius: 9999px;
  filter: blur(48px);
}

.hero-decoration-one {
  width: 230px;
  height: 230px;
  top: -130px;
  left: -50px;
  background: rgb(129 140 248 / 19%);
}

.hero-decoration-two {
  width: 190px;
  height: 190px;
  right: -70px;
  bottom: -125px;
  background: rgb(167 139 250 / 17%);
}

.hero-content,
.hero-footer {
  position: relative;
  z-index: 1;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero-icon {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  place-items: center;
  border: 1px solid #d9ddff;
  border-radius: 17px;
  background: rgb(255 255 255 / 85%);
  color: var(--approval-primary-dark);
  font-size: 1.35rem;
  box-shadow: 0 4px 12px rgb(79 70 229 / 7%);
}

.hero-title {
  margin: 0;
  color: #202746;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid #dcdfff;
  border-radius: 999px;
  background: #fff;
  color: #5556b9;
  font-size: 0.7rem;
  font-weight: 600;
}

.hero-subtitle {
  margin: 0.55rem 0 0;
  color: #737b92;
  font-size: 0.85rem;
  line-height: 1.9;
}

.hero-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.7rem 0.9rem;
  border: 1px solid #dfe2f5;
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 90%);
  color: #5055a5;
  font-size: 0.78rem;
  font-weight: 600;
  transition: 0.2s ease;
}

.hero-refresh:hover:not(:disabled) {
  border-color: #b9bfff;
  background: #fff;
  transform: translateY(-1px);
}

.hero-refresh:disabled,
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.hero-footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgb(210 215 246 / 75%);
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.hero-stat-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid #e0e5ff;
  border-radius: 13px;
  background: #fff;
  color: #6366f1;
}

.pending-icon {
  color: #c18a28;
  background: #fffbeb;
  border-color: #f7e7b7;
}

.filter-icon {
  color: #7c3aed;
  background: #faf5ff;
  border-color: #eadcff;
}

.hero-stat-label {
  display: block;
  margin-bottom: 0.2rem;
  color: #7c8498;
  font-size: 0.72rem;
}

.hero-stat strong {
  display: block;
  overflow-wrap: anywhere;
  color: #303752;
  font-size: 1rem;
  font-weight: 800;
}

.dashboard-card {
  overflow: hidden;
  border: 1px solid var(--approval-border);
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 2.5%);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.4rem;
  border-bottom: 1px solid #eff0f5;
}

.section-heading-main {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.section-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid;
  border-radius: 13px;
  font-size: 1rem;
}

.filter-section-icon {
  color: #6366f1;
  background: #f0f2ff;
  border-color: #e0e5ff;
}

.table-section-icon {
  color: #0f9a8a;
  background: #eafaf6;
  border-color: #d2f3e9;
}

.section-title {
  margin: 0;
  color: #30364d;
  font-size: 0.94rem;
  font-weight: 800;
}

.section-description {
  margin: 0.3rem 0 0;
  color: #8b91a3;
  font-size: 0.75rem;
  line-height: 1.8;
}

.reset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.8rem;
  border: 1px solid #e6e8f0;
  border-radius: 0.75rem;
  background: #fff;
  color: #687087;
  font-size: 0.75rem;
  font-weight: 600;
  transition: 0.2s ease;
}

.reset-button:hover:not(:disabled) {
  border-color: #c7cbfa;
  background: #f7f7ff;
  color: #5558c9;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.35rem 1.4rem;
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.55rem;
}

.filter-field label {
  color: #60677b;
  font-size: 0.76rem;
  font-weight: 700;
}

.filter-action-field {
  justify-content: flex-end;
}

.apply-button {
  display: inline-flex;
  min-height: 43px;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--approval-primary);
  border-radius: 0.8rem;
  background: var(--approval-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  transition: 0.2s ease;
}

.apply-button:hover:not(:disabled) {
  background: var(--approval-primary-dark);
  transform: translateY(-1px);
}

.filter-grid :deep(.p-select) {
  min-height: 43px;
  border-color: #e4e7ef;
  border-radius: 0.8rem;
  background: #fbfcfe;
  box-shadow: none;
  transition: border-color 0.2s ease;
}

.filter-grid :deep(.p-select:hover) {
  border-color: #bfc4f9;
}

.filter-grid :deep(.p-select-label) {
  display: flex;
  align-items: center;
  padding: 0.7rem 0.8rem;
  color: #4b5267;
  font-size: 0.78rem;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.4rem;
  border-top: 1px solid #f0f1f6;
  background: #fcfcff;
  color: #8b91a3;
  font-size: 0.72rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border: 1px solid #e4e6fb;
  border-radius: 999px;
  background: #f4f5ff;
  color: #5559b8;
  font-weight: 600;
}

.exceeded-chip {
  border-color: #f7dfb5;
  background: #fff8e9;
  color: #a66b10;
}

.table-card {
  min-width: 0;
}

.table-heading {
  border-bottom-color: #eceef5;
}

.table-count {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #e9eaf3;
  border-radius: 0.7rem;
  background: #fafaff;
  color: #747b90;
  font-size: 0.73rem;
  white-space: nowrap;
}

.table-wrapper {
  width: 100%;
  min-width: 0;
}

.expense-table {
  font-size: 0.78rem;
}

.expense-table :deep(.p-datatable-table) {
  min-width: 1150px;
}

.expense-table :deep(.p-datatable-thead > tr > th) {
  padding: 1rem 0.85rem;
  border-color: #edf0f5;
  background: #f8f9fc;
  color: #646c81;
  font-size: 0.73rem;
  font-weight: 800;
  white-space: nowrap;
}

.expense-table :deep(.p-datatable-tbody > tr > td) {
  padding: 1rem 0.85rem;
  border-color: #f0f1f6;
  color: #4e566c;
  vertical-align: middle;
}

.expense-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.15s ease;
}

.expense-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8f8ff;
}

.expense-table :deep(.p-paginator) {
  justify-content: center;
  gap: 0.2rem;
  padding: 0.9rem 0.75rem;
  border-top: 1px solid #eceef5;
  background: #fff;
}

.expense-table :deep(.p-paginator .p-paginator-page),
.expense-table :deep(.p-paginator .p-paginator-first),
.expense-table :deep(.p-paginator .p-paginator-prev),
.expense-table :deep(.p-paginator .p-paginator-next),
.expense-table :deep(.p-paginator .p-paginator-last) {
  border-radius: 0.6rem;
}

.id-cell {
  display: inline-flex;
  padding: 0.3rem 0.5rem;
  border: 1px solid #e7e9f2;
  border-radius: 0.55rem;
  background: #f8f9fc;
  color: #737b91;
  direction: ltr;
  font-family: monospace;
  font-size: 0.75rem;
}

.driver-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.driver-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  place-items: center;
  border: 1px solid #e2e3ff;
  border-radius: 12px;
  background: #f0f0ff;
  color: #6366f1;
}

.driver-name {
  max-width: 180px;
  overflow: hidden;
  color: #343b52;
  font-size: 0.78rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.driver-code {
  margin-top: 0.3rem;
  color: #9a9fb0;
  font-size: 0.68rem;
}

.route-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-point {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #525a70;
  font-size: 0.75rem;
}

.route-point:first-child i {
  color: #16a085;
  font-size: 0.5rem;
}

.route-point:last-child i {
  color: #7774df;
  font-size: 0.75rem;
}

.route-line {
  width: 1px;
  height: 8px;
  margin-right: 0.24rem;
  border-right: 1px dashed #c7cadb;
}

.category-cell,
.date-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #606981;
  font-size: 0.74rem;
}

.category-cell i,
.date-cell i {
  color: #959bb1;
  font-size: 0.75rem;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.amount-cell strong {
  color: #303750;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.exceeded-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.4rem;
  border: 1px solid #f6e2bc;
  border-radius: 0.45rem;
  background: #fff8e9;
  color: #ad7419;
  font-size: 0.64rem;
  white-space: nowrap;
}

.receipt-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid #e1e4f4;
  border-radius: 0.65rem;
  background: #f7f8ff;
  color: #6568c6;
  font-size: 0.72rem;
  font-weight: 700;
  transition: 0.2s ease;
}

.receipt-button:hover:not(:disabled) {
  border-color: #c9ccfa;
  background: #eeefff;
}

.muted-text {
  color: #a4a9b8;
  font-size: 0.72rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.approve-button,
.reject-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.48rem 0.65rem;
  border: 1px solid transparent;
  border-radius: 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  transition: 0.2s ease;
}

.approve-button {
  border-color: #ccefe0;
  background: #edfbf4;
  color: #16845e;
}

.approve-button:hover:not(:disabled) {
  border-color: #9cdec3;
  background: #d9f7e8;
}

.reject-button {
  border-color: #f7d9df;
  background: #fff1f3;
  color: #c0445c;
}

.reject-button:hover:not(:disabled) {
  border-color: #efb8c3;
  background: #ffe4e9;
}

.processed-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #858ba0;
  font-size: 0.72rem;
  white-space: nowrap;
}

.empty-state {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border: 1px solid #e8e9f5;
  border-radius: 19px;
  background: #f8f8ff;
  color: #999ce0;
  font-size: 1.5rem;
}

.empty-state h3 {
  margin: 1rem 0 0;
  color: #434a60;
  font-size: 0.9rem;
  font-weight: 800;
}

.empty-state p {
  margin: 0.5rem 0 1rem;
  color: #8e94a6;
  font-size: 0.78rem;
}

.table-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 2rem;
  color: #777bcb;
  font-size: 0.8rem;
}

.dialog-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialog-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border: 1px solid #f5d7db;
  border-radius: 13px;
  background: #fff0f2;
  color: #c34b60;
  font-size: 1rem;
}

.approve-heading .dialog-icon {
  border-color: #c4e6d4;
  background: #edfbf4;
  color: #16845e;
}

.dialog-heading h3 {
  margin: 0;
  color: #34394e;
  font-size: 0.95rem;
  font-weight: 800;
}

.dialog-heading p {
  margin: 0.3rem 0 0;
  color: #8b91a3;
  font-size: 0.73rem;
}

.reject-form,
.approve-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.reject-notice,
.approve-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.8rem;
  border-radius: 0.8rem;
  font-size: 0.75rem;
  line-height: 1.9;
}

.reject-notice {
  border: 1px solid #f3e4c4;
  background: #fffbf0;
  color: #8d702e;
}

.approve-notice {
  border: 1px solid #c4e6d4;
  background: #edfbf4;
  color: #16845e;
}

.reject-notice i,
.approve-notice i {
  margin-top: 0.2rem;
}

.reject-label {
  color: #52596d;
  font-size: 0.78rem;
  font-weight: 700;
}

.reject-label span {
  color: #e14d68;
}

.reject-textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #e0e3ed;
  border-radius: 0.8rem;
  padding: 0.85rem;
  color: #40475c;
  font-size: 0.8rem;
  line-height: 1.9;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.reject-textarea:focus {
  border-color: #ed9aaa;
  box-shadow: 0 0 0 3px rgb(225 77 104 / 9%);
}

.reject-textarea::placeholder {
  color: #a7abba;
}

.character-count {
  color: #999fb0;
  font-size: 0.68rem;
  text-align: left;
}

.dialog-actions {
  display: flex;
  justify-content: flex-start;
  gap: 0.6rem;
  margin-top: 0.9rem;
}

.cancel-button,
.confirm-reject-button,
.confirm-approve-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 0.95rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  transition: 0.2s ease;
}

.cancel-button {
  border-color: #e5e7ef;
  background: #f8f9fc;
  color: #626a7e;
}

.confirm-reject-button {
  border-color: #dc4c64;
  background: #dc4c64;
  color: #fff;
}

.confirm-reject-button:hover:not(:disabled) {
  background: #c93852;
}

.confirm-approve-button {
  border-color: #16845e;
  background: #16845e;
  color: #fff;
}

.confirm-approve-button:hover:not(:disabled) {
  background: #126b4b;
}

@keyframes approval-enter {
  from {
    opacity: 0;
    transform: translateY(7px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-footer {
    gap: 0.9rem;
  }
}

@media (max-width: 640px) {
  .dashboard-hero {
    padding: 1.1rem;
    border-radius: 1.15rem;
  }

  .hero-content {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .hero-icon {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
    border-radius: 13px;
  }

  .hero-content > div:nth-child(2) {
    flex-basis: calc(100% - 60px);
  }

  .hero-title {
    font-size: 1.2rem;
  }

  .hero-subtitle {
    font-size: 0.76rem;
  }

  .hero-refresh {
    width: 100%;
  }

  .hero-footer {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    margin-top: 1.1rem;
    padding-top: 1rem;
  }

  .section-heading {
    align-items: flex-start;
    padding: 1rem;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .active-filters {
    padding: 0.8rem 1rem;
  }

  .section-title {
    font-size: 0.85rem;
  }

  .section-description {
    font-size: 0.7rem;
  }

  .table-count {
    display: none;
  }

  .reset-button {
    font-size: 0.7rem;
  }

  .dialog-actions {
    flex-wrap: wrap;
  }

  .cancel-button,
  .confirm-reject-button,
  .confirm-approve-button {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .expense-approval-page {
    animation: none;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>