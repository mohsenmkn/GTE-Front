<template>
  <main class="pl" dir="rtl">
    <!-- عنوان صفحه -->
    <header class="pl-head">
      <div class="pl-head__title">
        <span class="pl-head__icon" aria-hidden="true"><i class="pi pi-history"></i></span>
        <div>
          <h1>رویدادهای سیستم</h1>
          <p>رخدادهای ورود، بازیابی رمز و دسترسی به فیش حقوقی</p>
        </div>
      </div>
      <Button
          label="به‌روزرسانی"
          icon="pi pi-refresh"
          class="pl-btn-ink"
          :loading="loading"
          @click="loadLogs"
      />
    </header>

    <!-- هشدارهای تشخیص خودکار -->
    <section class="pl-card pl-alerts" aria-labelledby="security-alerts-title">
      <header class="pl-alerts__head">
        <div>
          <h2 id="security-alerts-title">هشدارهای امنیتی</h2>
          <p>الگوهای مشکوک ورود و درخواست کد بازیابی</p>
        </div>
        <div class="pl-alerts__tools">
          <Select
              v-model="alertStatus"
              :options="alertStatusOptions"
              option-label="label"
              option-value="value"
              aria-label="وضعیت هشدارها"
              @change="loadAlerts"
          />
          <Button icon="pi pi-refresh" severity="secondary" outlined aria-label="به‌روزرسانی هشدارها" :loading="alertsLoading" @click="loadAlerts" />
        </div>
      </header>

      <Message v-if="alertsError" severity="error" :closable="false" class="pl-error">{{ alertsError }}</Message>
      <div v-else-if="alertsLoading && !alerts.length" class="pl-alerts__empty">در حال دریافت هشدارها…</div>
      <div v-else-if="!alerts.length" class="pl-alerts__empty">
        <i class="pi pi-shield" aria-hidden="true"></i>
        <span>{{ alertStatus === 'open' ? 'هشدارِ باز و در انتظار رسیدگی وجود ندارد.' : 'هشداری در این فهرست نیست.' }}</span>
      </div>
      <div v-else class="pl-alerts__list">
        <article v-for="alert in alerts" :key="alert.id" class="pl-alert" :class="`pl-alert--${alert.severity}`">
          <div class="pl-alert__mark" aria-hidden="true"><i class="pi pi-exclamation-triangle"></i></div>
          <div class="pl-alert__body">
            <div class="pl-alert__title-row">
              <h3>{{ alert.title }}</h3>
              <span class="pl-alert__severity">{{ severityLabel(alert.severity) }}</span>
            </div>
            <p>{{ alert.description }}</p>
            <div class="pl-alert__meta">
              <span v-if="alert.source_ip"><i class="pi pi-globe"></i> IP: {{ alert.source_ip }}</span>
              <span v-if="alert.subject"><i class="pi pi-user"></i> هدف: {{ alert.subject }}</span>
              <span><i class="pi pi-bolt"></i> {{ alert.occurrence_count.toLocaleString('fa-IR') }} رخداد</span>
              <span><i class="pi pi-clock"></i> {{ datePart(alert.last_detected_at) }}، {{ timePart(alert.last_detected_at) }}</span>
            </div>
          </div>
          <Button
              v-if="alert.status === 'open'"
              label="علامت‌گذاری به‌عنوان رسیدگی‌شده"
              icon="pi pi-check"
              severity="secondary"
              outlined
              size="small"
              :loading="resolvingAlert === alert.id"
              @click="resolveAlert(alert)"
          />
          <span v-else class="pl-alert__resolved">
            <i class="pi pi-check-circle"></i> رسیدگی‌شده
            <small v-if="alert.resolver?.name">توسط {{ alert.resolver.name }}</small>
          </span>
        </article>
      </div>
      <footer v-if="alertTotal > alerts.length" class="pl-alerts__footer">
        {{ alerts.length.toLocaleString('fa-IR') }} مورد از {{ alertTotal.toLocaleString('fa-IR') }} هشدار نمایش داده شده است.
      </footer>
    </section>

    <!-- فیلترها -->
    <section class="pl-card pl-filters" aria-label="فیلتر رویدادها">
      <form class="pl-filters__form" @submit.prevent="applyFilters">
        <IconField class="pl-filters__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="draft.search" placeholder="جستجو بر اساس کاربر، هدف یا ماه فیش" fluid />
        </IconField>

        <Select
            v-model="draft.module"
            :options="moduleOptions"
            option-label="label"
            option-value="value"
            placeholder="همه بخش‌ها"
            show-clear
            fluid
        />
        <Select
            v-model="draft.action"
            :options="actionOptions"
            option-label="label"
            option-value="value"
            placeholder="همه رویدادها"
            show-clear
            filter
            fluid
        />
        <DatePicker v-model="draft.from" date-format="yy-mm-dd" placeholder="از تاریخ" show-icon show-button-bar fluid />
        <DatePicker v-model="draft.to" date-format="yy-mm-dd" placeholder="تا تاریخ" show-icon show-button-bar fluid />

        <div class="pl-filters__actions">
          <Button type="submit" label="اعمال فیلتر" icon="pi pi-filter" class="pl-btn-ink" :loading="loading" />
          <Button type="button" label="پاک‌کردن" severity="secondary" outlined @click="clearFilters" />
        </div>
      </form>

      <!-- فیلترهای فعال -->
      <div v-if="activeChips.length" class="pl-chips" aria-label="فیلترهای فعال">
        <span class="pl-chips__label">فیلترهای فعال:</span>
        <button
            v-for="chip in activeChips"
            :key="chip.key"
            type="button"
            class="pl-chip"
            :aria-label="`حذف فیلتر ${chip.text}`"
            @click="removeFilter(chip.key)"
        >
          {{ chip.text }}
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
    </section>

    <Message v-if="error" severity="error" :closable="false" class="pl-error">
      <div class="pl-error__row">
        <span>{{ error }}</span>
        <Button label="تلاش دوباره" icon="pi pi-refresh" size="small" severity="secondary" outlined @click="loadLogs" />
      </div>
    </Message>

    <!-- جدول -->
    <section class="pl-card pl-table" aria-label="فهرست رویدادها">
      <div class="pl-toolbar">
        <div class="pl-seg" role="radiogroup" aria-label="وضعیت رویداد">
          <button
              v-for="opt in quickStatus"
              :key="String(opt.value)"
              type="button"
              role="radio"
              class="pl-seg__btn"
              :class="[`pl-seg__btn--${opt.tone}`, { 'is-active': draft.status === opt.value }]"
              :aria-checked="draft.status === opt.value"
              :disabled="loading"
              @click="setStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <span class="pl-toolbar__total">{{ total.toLocaleString('fa-IR') }} رویداد</span>
      </div>

      <DataTable
          :value="logs"
          :loading="loading"
          :row-class="rowClass"
          table-style="min-width: 62rem"
          data-key="id"
      >
        <template #empty>
          <div class="pl-empty">
            <span class="pl-empty__icon" aria-hidden="true"><i class="pi pi-inbox"></i></span>
            <h2>رویدادی یافت نشد</h2>
            <p v-if="activeChips.length">با فیلترهای فعلی نتیجه‌ای وجود ندارد.</p>
            <p v-else>هنوز رویدادی ثبت نشده است.</p>
            <Button
                v-if="activeChips.length"
                label="پاک‌کردن فیلترها"
                icon="pi pi-filter-slash"
                severity="secondary"
                outlined
                @click="clearFilters"
            />
          </div>
        </template>

        <Column header="زمان" style="width: 11rem">
          <template #body="{ data }">
            <div class="pl-time">
              <span class="pl-time__date">{{ datePart(data.created_at) }}</span>
              <span class="pl-time__clock">{{ timePart(data.created_at) }}</span>
            </div>
          </template>
        </Column>

        <Column header="کاربر" style="width: 13rem">
          <template #body="{ data }">
            <div class="pl-user">
              <span class="pl-user__avatar" :class="{ 'is-deleted': !data.user?.name }" aria-hidden="true">
                {{ data.user?.name ? data.user.name.trim().charAt(0) : '؟' }}
              </span>
              <span class="pl-user__name" :class="{ 'is-deleted': !data.user?.name }">
                {{ data.user?.name || `کاربر حذف‌شده (${data.user_id || 'نامشخص'})` }}
              </span>
            </div>
          </template>
        </Column>

        <Column header="رویداد" style="min-width: 15rem">
          <template #body="{ data }">
            <div class="pl-event">
              <span class="pl-event__icon" :class="data.status === 'success' ? 'is-ok' : 'is-bad'" aria-hidden="true">
                <i class="pi" :class="actionIcon(data.action)"></i>
              </span>
              <div class="pl-event__text">
                <span class="pl-event__name">{{ actionLabel(data.action) }}</span>
                <span class="pl-event__module">{{ moduleLabel(data.module) }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="وضعیت" style="width: 7.5rem">
          <template #body="{ data }">
            <span class="pl-status" :class="data.status === 'success' ? 'is-ok' : 'is-bad'">
              <span class="pl-status__dot" aria-hidden="true"></span>
              {{ data.status === 'success' ? 'موفق' : 'ناموفق' }}
            </span>
          </template>
        </Column>

        <Column header="جزئیات" style="min-width: 14rem">
          <template #body="{ data }">
            <div v-if="data.year_month || data.target_employee_id || data.subject" class="pl-meta">
              <span v-if="data.year_month" class="pl-meta__item">
                <i class="pi pi-calendar" aria-hidden="true"></i>
                ماه فیش: <b>{{ data.year_month }}</b>
              </span>
              <span v-if="data.target_employee_id" class="pl-meta__item">
                <i class="pi pi-user" aria-hidden="true"></i>
                کارمند: <b>{{ data.target_employee_id }}</b>
              </span>
              <span v-if="data.subject" class="pl-meta__item">
                <i class="pi pi-tag" aria-hidden="true"></i>
                هدف: <b>{{ data.subject }}</b>
              </span>
            </div>
            <span v-else class="pl-dash">—</span>
          </template>
        </Column>

        <Column header="IP" style="width: 9.5rem">
          <template #body="{ data }">
            <span v-if="data.ip_address" class="pl-ip">{{ data.ip_address }}</span>
            <span v-else class="pl-dash">—</span>
          </template>
        </Column>
      </DataTable>

      <!-- صفحه‌بندی -->
      <footer class="pl-pager">
        <span class="pl-pager__info">
          صفحه {{ page.toLocaleString('fa-IR') }} از {{ lastPage.toLocaleString('fa-IR') }}
        </span>
        <div class="pl-pager__nav">
          <Button icon="pi pi-angle-double-right" aria-label="صفحه اول" severity="secondary" text rounded :disabled="page <= 1 || loading" @click="goTo(1)" />
          <Button icon="pi pi-angle-right" aria-label="صفحه قبل" severity="secondary" text rounded :disabled="page <= 1 || loading" @click="goTo(page - 1)" />
          <Button icon="pi pi-angle-left" aria-label="صفحه بعد" severity="secondary" text rounded :disabled="page >= lastPage || loading" @click="goTo(page + 1)" />
          <Button icon="pi pi-angle-double-left" aria-label="صفحه آخر" severity="secondary" text rounded :disabled="page >= lastPage || loading" @click="goTo(lastPage)" />
        </div>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { payrollApi } from '@/services/payrollapi.js'

const actionOptions = [
  { label: 'مشاهده فیش', value: 'payslip.viewed' },
  { label: 'دریافت PDF', value: 'payslip.pdf_downloaded' },
  { label: 'مشاهده فیش کارمند', value: 'payslip.viewed_by_manager' },
  { label: 'دریافت PDF کارمند', value: 'payslip.pdf_downloaded_by_manager' },
  { label: 'ورود موفق', value: 'login.succeeded' },
  { label: 'ورود ناموفق', value: 'login.failed' },
  { label: 'ورود مسدودشده', value: 'login.blocked' },
  { label: 'شکست کپچا', value: 'login.captcha_failed' },
  { label: 'ورود حساب غیرفعال', value: 'login.inactive_account' },
  { label: 'تلاش ورود مسدودشده', value: 'auth.composite_lock_blocked' },
  { label: 'قفل موقت امنیتی', value: 'auth.composite_lock_triggered' },
  { label: 'ارسال OTP بازیابی رمز', value: 'password_reset.otp_sent' },
  { label: 'خطای ارسال OTP', value: 'password_reset.otp_send_failed' },
  { label: 'خطای فنی ارسال OTP', value: 'password_reset.otp_send_error' },
  { label: 'حساب بازیابی یافت نشد', value: 'password_reset.account_not_found' },
  { label: 'حساب بازیابی غیرفعال', value: 'password_reset.inactive_account' },
  { label: 'تأیید OTP', value: 'password_reset.otp_verified' },
  { label: 'تأیید ناموفق OTP', value: 'password_reset.otp_verification_failed' },
  { label: 'تأیید OTP حساب غیرفعال', value: 'password_reset.otp_verified_inactive_account' },
  { label: 'تغییر رمز موفق', value: 'password_reset.completed' },
  { label: 'خطای تغییر رمز', value: 'password_reset.failed' },
  { label: 'خطای عملیات تغییر رمز', value: 'password_reset.error' },
  { label: 'تشخیص هشدار امنیتی', value: 'alert.detected' },
  { label: 'رسیدگی به هشدار امنیتی', value: 'alert.resolved' },
]
const moduleOptions = [{ label: 'فیش حقوقی', value: 'Payroll' }, { label: 'احراز هویت', value: 'Auth' }, { label: 'امنیت', value: 'Security' }]
const statusOptions = [{ label: 'موفق', value: 'success' }, { label: 'ناموفق', value: 'failed' }]
const alertStatusOptions = [{ label: 'در حال رسیدگی', value: 'open' }, { label: 'رسیدگی‌شده', value: 'resolved' }]

// فیلتر سریع وضعیت، بالای جدول
const quickStatus = [
  { label: 'همه', value: null, tone: 'all' },
  { label: 'موفق', value: 'success', tone: 'ok' },
  { label: 'ناموفق', value: 'failed', tone: 'bad' },
]

const draft = reactive({ search: '', module: null, action: null, status: null, from: null, to: null })
const filters = ref({})
const logs = ref([])
const loading = ref(false)
const error = ref('')
const page = ref(1)
const lastPage = ref(1)
const total = ref(0)
const alerts = ref([])
const alertStatus = ref('open')
const alertTotal = ref(0)
const alertsLoading = ref(false)
const alertsError = ref('')
const resolvingAlert = ref(null)

function dateValue(value) {
  if (!value) return undefined
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function datePart(value) {
  return value ? new Date(value).toLocaleDateString('fa-IR') : '—'
}
function timePart(value) {
  return value ? new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
}
function actionLabel(action) {
  return actionOptions.find((item) => item.value === action)?.label || action
}
function severityLabel(severity) {
  return ({ high: 'زیاد', medium: 'متوسط', low: 'کم' })[severity] || severity
}
function moduleLabel(module) {
  return moduleOptions.find((item) => item.value === module)?.label || module || '—'
}
function actionIcon(action = '') {
  if (action.startsWith('payslip.')) return action.includes('pdf') ? 'pi-download' : 'pi-file'
  if (action.startsWith('login.')) return 'pi-sign-in'
  if (action.startsWith('password_reset.')) return 'pi-key'
  return 'pi-info-circle'
}
function rowClass(data) {
  return data.status === 'success' ? '' : 'row--failed'
}

// چیپ‌های فیلتر فعال (بر اساس فیلترهای اعمال‌شده)
const activeChips = computed(() => {
  const f = filters.value
  const chips = []
  if (f.search) chips.push({ key: 'search', text: `جستجو: ${f.search}` })
  if (f.module) chips.push({ key: 'module', text: moduleLabel(f.module) })
  if (f.action) chips.push({ key: 'action', text: actionLabel(f.action) })
  if (f.status) chips.push({ key: 'status', text: statusOptions.find((s) => s.value === f.status)?.label || f.status })
  if (f.from) chips.push({ key: 'from', text: `از ${f.from}` })
  if (f.to) chips.push({ key: 'to', text: `تا ${f.to}` })
  return chips
})

function removeFilter(key) {
  draft[key] = key === 'search' ? '' : null
  applyFilters()
}
function setStatus(value) {
  if (draft.status === value) return
  draft.status = value
  applyFilters()
}
function applyFilters() {
  filters.value = {
    search: draft.search || undefined,
    module: draft.module || undefined,
    action: draft.action || undefined,
    status: draft.status || undefined,
    from: dateValue(draft.from),
    to: dateValue(draft.to),
  }
  page.value = 1
  loadLogs()
}
function clearFilters() {
  Object.assign(draft, { search: '', module: null, action: null, status: null, from: null, to: null })
  filters.value = {}
  page.value = 1
  loadLogs()
}
function goTo(nextPage) {
  page.value = nextPage
  loadLogs()
}
async function loadLogs() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await payrollApi.getLogs({ ...filters.value, page: page.value, per_page: 20 })
    logs.value = data.data || []
    page.value = data.current_page || 1
    lastPage.value = data.last_page || 1
    total.value = data.total || 0
  } catch (err) {
    error.value = err.response?.data?.message || 'دریافت گزارش‌ها با خطا روبه‌رو شد.'
  } finally {
    loading.value = false
  }
}

console.log('payrollApi:', payrollApi)
console.log('getSecurityAlerts:', payrollApi.getSecurityAlerts)
async function loadAlerts() {
  alertsLoading.value = true
  alertsError.value = ''
  try {
    const { data } = await payrollApi.getSecurityAlerts({ status: alertStatus.value, per_page: 100 })
    alerts.value = data.data || []
    alertTotal.value = data.total || 0
  } catch (err) {
    console.error('Security Alerts API Error:', {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      response: err.response?.data,
      url: err.config?.url,
      baseURL: err.config?.baseURL,
      method: err.config?.method
    })

    alertsError.value = getSecurityAlertsErrorMessage(err)
  } finally {
    alertsLoading.value = false
  }
}
function getSecurityAlertsErrorMessage(err) {
  const status = err.response?.status
  if (status === 401) return 'نشست شما منقضی شده است؛ دوباره وارد سامانه شوید.'
  if (status === 403) return 'دسترسی مشاهده هشدارهای امنیتی برای حساب شما فعال نیست. مجوز Log.view را بررسی کنید.'
  if (status === 404) return 'مسیر دریافت هشدارها در سرور پیدا نشد. نسخه API سرور را بررسی کنید.'
  if (status >= 500) return `سرور هنگام دریافت هشدارها خطا داد (HTTP ${status}).`
  if (!err.response) return 'ارتباط با سرور برقرار نشد. اتصال شبکه و نشانی API را بررسی کنید.'
  return err.response.data?.message || `دریافت هشدارهای امنیتی ناموفق بود (HTTP ${status}).`
}
async function resolveAlert(alert) {
  resolvingAlert.value = alert.id
  try {
    await payrollApi.resolveSecurityAlert(alert.id)
    await loadAlerts()
  } catch (err) {
    alertsError.value = err.response?.data?.message || 'ثبت رسیدگی به هشدار ناموفق بود.'
  } finally {
    resolvingAlert.value = null
  }
}
let refreshTimer
onMounted(async () => {
  await Promise.all([loadLogs(), loadAlerts()])
  refreshTimer = window.setInterval(() => {
    loadLogs()
    loadAlerts()
  }, 30000)
})
onUnmounted(() => window.clearInterval(refreshTimer))
</script>

<style scoped>
.pl {
  --pl-ground: var(--surface-ground, #f3f4f7);
  --pl-surface: var(--surface-card, #ffffff);
  --pl-border: var(--surface-border, #e4e7ee);
  --pl-text: var(--text-color, #1b2233);
  --pl-muted: var(--text-color-secondary, #667085);
  --pl-ink: #14213d;
  --pl-ink-soft: #1f2f52;
  --pl-gold: #d9b865;
  --pl-ok: #15803d;
  --pl-bad: #b91c1c;

  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
  background: var(--pl-ground);
  color: var(--pl-text);
}

/* ───────────── عنوان ───────────── */
.pl-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.pl-head__title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.pl-head__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--pl-ink);
  color: var(--pl-gold);
  font-size: 1.35rem;
}

.pl-head h1 {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1.4;
}

.pl-head p {
  margin: 0.125rem 0 0;
  font-size: 0.95rem;
  color: var(--pl-muted);
}

.pl-btn-ink {
  background: var(--pl-ink);
  border-color: var(--pl-ink);
  color: #f6f1e4;
}
.pl-btn-ink:hover {
  background: var(--pl-ink-soft) !important;
  border-color: var(--pl-ink-soft) !important;
  color: #fff !important;
}

/* ───────────── کارت‌ها ───────────── */
.pl-card {
  background: var(--pl-surface);
  border: 1px solid var(--pl-border);
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(20, 33, 61, 0.05), 0 14px 32px -20px rgba(20, 33, 61, 0.25);
}

.pl-alerts {
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  border-color: color-mix(in srgb, #dc2626 24%, var(--pl-border));
}
.pl-alerts__head,
.pl-alerts__tools,
.pl-alert__title-row,
.pl-alert__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.pl-alerts__head { margin-bottom: 1rem; }
.pl-alerts__head h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
.pl-alerts__head p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--pl-muted); }
.pl-alerts__tools { justify-content: flex-end; }
.pl-alerts__list { display: grid; gap: 0.75rem; }
.pl-alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--pl-border);
  border-right: 4px solid #d97706;
  border-radius: 12px;
  background: color-mix(in srgb, #f59e0b 5%, var(--pl-surface));
}
.pl-alert--high { border-right-color: #dc2626; background: color-mix(in srgb, #ef4444 6%, var(--pl-surface)); }
.pl-alert--low { border-right-color: #2563eb; background: color-mix(in srgb, #3b82f6 5%, var(--pl-surface)); }
.pl-alert__mark {
  display: grid; place-items: center; flex: 0 0 2.5rem; height: 2.5rem;
  border-radius: 50%; color: #b45309; background: color-mix(in srgb, #f59e0b 15%, transparent);
}
.pl-alert--high .pl-alert__mark { color: #b91c1c; background: color-mix(in srgb, #ef4444 15%, transparent); }
.pl-alert__body { min-width: 0; flex: 1; }
.pl-alert__title-row { justify-content: flex-start; flex-wrap: wrap; }
.pl-alert__title-row h3 { margin: 0; font-size: 0.95rem; font-weight: 800; }
.pl-alert__severity { padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.75rem; background: rgba(180,83,9,.12); color: #92400e; }
.pl-alert--high .pl-alert__severity { color: #991b1b; background: rgba(185,28,28,.1); }
.pl-alert__body > p { margin: 0.35rem 0 0.6rem; color: var(--pl-muted); font-size: 0.85rem; }
.pl-alert__meta { justify-content: flex-start; flex-wrap: wrap; color: var(--pl-muted); font-size: 0.78rem; }
.pl-alert__meta span { display: inline-flex; align-items: center; gap: 0.3rem; }
.pl-alert__resolved { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.25rem 0.4rem; color: var(--pl-ok); white-space: nowrap; font-size: 0.85rem; }
.pl-alert__resolved small { grid-column: 2; color: var(--pl-muted); font-size: 0.72rem; }
.pl-alerts__empty,
.pl-alerts__footer { padding: 0.75rem 0; color: var(--pl-muted); font-size: 0.88rem; }
.pl-alerts__empty { display: flex; align-items: center; gap: 0.5rem; }
.pl-alerts__empty i { color: var(--pl-ok); }
.pl-alerts__footer { text-align: center; }

@media (max-width: 760px) {
  .pl-alert { align-items: flex-start; flex-wrap: wrap; }
  .pl-alert__body { flex-basis: calc(100% - 3.5rem); }
  .pl-alert > :deep(.p-button) { margin-right: 3.5rem; }
}

/* ───────────── فیلترها ───────────── */
.pl-filters {
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
}

.pl-filters__form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.875rem;
  align-items: center;
}

.pl-filters__search {
  grid-column: span 2;
}

.pl-filters__actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.pl-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--pl-border);
}

.pl-chips__label {
  font-size: 0.85rem;
  color: var(--pl-muted);
}

.pl-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--pl-gold) 70%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--pl-gold) 14%, transparent);
  color: var(--pl-text);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}
.pl-chip:hover {
  background: color-mix(in srgb, var(--pl-gold) 28%, transparent);
}
.pl-chip i {
  font-size: 0.7rem;
  color: var(--pl-muted);
}

.pl-error { margin-bottom: 1.25rem; }
.pl-error__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

/* ───────────── جدول ───────────── */
.pl-table { overflow: hidden; }

.pl-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--pl-border);
}

.pl-toolbar__total {
  font-size: 0.9rem;
  color: var(--pl-muted);
  font-variant-numeric: tabular-nums;
}

/* کنترل بخش‌بندی‌شده برای وضعیت */
.pl-seg {
  display: inline-flex;
  padding: 0.25rem;
  gap: 0.25rem;
  border-radius: 12px;
  background: var(--pl-ground);
  border: 1px solid var(--pl-border);
}

.pl-seg__btn {
  padding: 0.4rem 1.1rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--pl-muted);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pl-seg__btn:hover:not(.is-active):not(:disabled) { color: var(--pl-text); }
.pl-seg__btn:disabled { cursor: default; opacity: 0.7; }
.pl-seg__btn.is-active { box-shadow: 0 1px 3px rgba(20, 33, 61, 0.2); color: #fff; }
.pl-seg__btn--all.is-active { background: var(--pl-ink); }
.pl-seg__btn--ok.is-active { background: var(--pl-ok); }
.pl-seg__btn--bad.is-active { background: var(--pl-bad); }

/* ظاهر جدول PrimeVue */
.pl-table :deep(.p-datatable) { background: transparent; }

.pl-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.75rem 1.25rem;
  background: var(--pl-ground);
  border-bottom: 1px solid var(--pl-border);
  color: var(--pl-muted);
  font-size: 0.85rem;
  font-weight: 700;
  text-align: right;
}

.pl-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid color-mix(in srgb, var(--pl-border) 60%, transparent);
  vertical-align: middle;
  text-align: right;
}

.pl-table :deep(.p-datatable-tbody > tr:last-child > td) { border-bottom: 0; }
.pl-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: color-mix(in srgb, var(--pl-ground) 70%, transparent);
}

/* ردیف ناموفق: رنگ ملایم و نوار قرمز سمت شروع */
.pl-table :deep(.p-datatable-tbody > tr.row--failed > td) {
  background: color-mix(in srgb, var(--pl-bad) 4%, transparent);
}
.pl-table :deep(.p-datatable-tbody > tr.row--failed > td:first-child) {
  box-shadow: inset -3px 0 0 var(--pl-bad);
}

/* زمان */
.pl-time { display: flex; flex-direction: column; line-height: 1.6; }
.pl-time__date { font-weight: 700; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.pl-time__clock { font-size: 0.8rem; color: var(--pl-muted); font-variant-numeric: tabular-nums; }

/* کاربر */
.pl-user { display: flex; align-items: center; gap: 0.625rem; min-width: 0; }
.pl-user__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--pl-ink);
  color: var(--pl-gold);
  font-size: 0.9rem;
  font-weight: 700;
}
.pl-user__avatar.is-deleted { background: var(--pl-ground); color: var(--pl-muted); border: 1px dashed var(--pl-border); }
.pl-user__name { font-size: 0.9rem; font-weight: 600; overflow-wrap: anywhere; }
.pl-user__name.is-deleted { color: var(--pl-muted); font-weight: 500; }

/* رویداد */
.pl-event { display: flex; align-items: center; gap: 0.75rem; }
.pl-event__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  font-size: 1rem;
}
.pl-event__icon.is-ok { background: color-mix(in srgb, var(--pl-ok) 12%, transparent); color: var(--pl-ok); }
.pl-event__icon.is-bad { background: color-mix(in srgb, var(--pl-bad) 12%, transparent); color: var(--pl-bad); }
.pl-event__text { display: flex; flex-direction: column; min-width: 0; }
.pl-event__name { font-weight: 700; font-size: 0.925rem; }
.pl-event__module { font-size: 0.8rem; color: var(--pl-muted); }

/* وضعیت */
.pl-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}
.pl-status__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pl-status.is-ok { background: color-mix(in srgb, var(--pl-ok) 12%, transparent); color: var(--pl-ok); }
.pl-status.is-bad { background: color-mix(in srgb, var(--pl-bad) 12%, transparent); color: var(--pl-bad); }

/* جزئیات */
.pl-meta { display: flex; flex-direction: column; gap: 0.25rem; }
.pl-meta__item { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--pl-muted); }
.pl-meta__item i { font-size: 0.75rem; }
.pl-meta__item b { color: var(--pl-text); font-weight: 700; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }

.pl-ip {
  display: inline-block;
  direction: ltr;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: var(--pl-ground);
  border: 1px solid var(--pl-border);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.8rem;
}
.pl-dash { color: var(--pl-muted); }

/* حالت خالی */
.pl-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3.5rem 1rem;
  text-align: center;
}
.pl-empty__icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--pl-ground);
  border: 1px solid var(--pl-border);
  color: var(--pl-muted);
  font-size: 1.9rem;
}
.pl-empty h2 { margin: 0.25rem 0 0; font-size: 1.1rem; font-weight: 700; }
.pl-empty p { margin: 0; color: var(--pl-muted); }

/* صفحه‌بندی */
.pl-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-top: 1px solid var(--pl-border);
  background: var(--pl-ground);
}
.pl-pager__info { font-size: 0.9rem; color: var(--pl-muted); font-variant-numeric: tabular-nums; }
.pl-pager__nav { display: flex; align-items: center; gap: 0.25rem; }

/* ───────────── عرض‌های کوچک‌تر: فقط جلوگیری از به‌هم‌ریختگی ───────────── */
@media (max-width: 1023px) {
  .pl { padding: 1rem 1rem 2rem; }
  .pl-filters__form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pl-filters__search,
  .pl-filters__actions { grid-column: 1 / -1; }
  .pl-filters__actions { justify-content: stretch; }
  .pl-filters__actions > * { flex: 1; }
}
</style>
