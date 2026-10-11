<template>
  <main class="trip-expense-page" dir="rtl">
    <!-- Page header -->
    <header class="page-hero">
      <div class="hero-copy">
        <div class="eyebrow">
          <span class="status-dot" aria-hidden="true"></span>
          <span>ماژول هزینه‌های سفر فعال است</span>
        </div>
        <h1>مدیریت سفرهای رانندگان</h1>
        <p>ثبت، مشاهده و پیگیری هزینه‌های سفرهای بین‌شهری</p>

        <span v-if="isDriver" class="access-pill access-driver">
          <i class="pi pi-user" aria-hidden="true"></i>
          سفرهای من
        </span>
        <span v-else class="access-pill access-manager">
          <i class="pi pi-eye" aria-hidden="true"></i>
          دسترسی مدیر · مشاهده همه سفرها
        </span>
      </div>

      <button
          v-if="canCreateTrip"
          type="button"
          class="primary-button create-button"
          @click="router.push({ name: 'trip-expense.trips.create' })"
      >
        <i class="pi pi-plus" aria-hidden="true"></i>
        <span>ثبت سفر جدید</span>
      </button>
    </header>

    <!-- Filters -->
    <section class="surface filters-panel" aria-labelledby="filters-title">
      <div class="section-heading filters-heading">
        <div class="heading-icon"><i class="pi pi-sliders-h" aria-hidden="true"></i></div>
        <div>
          <h2 id="filters-title">فیلتر سفرها</h2>
          <p>برای پیدا کردن سفر موردنظر، فیلترها را تنظیم کنید.</p>
        </div>
        <button type="button" class="text-button reset-button" @click="resetFilters">
          <i class="pi pi-refresh" aria-hidden="true"></i>
          <span>حذف فیلترها</span>
        </button>
      </div>

      <div class="filters-grid">
        <div class="field">
          <label for="trip-status">وضعیت سفر</label>
          <Select
              input-id="trip-status"
              v-model="filters.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="همه وضعیت‌ها"
              class="filter-control"
              @change="onFiltersChanged"
          />
        </div>

        <div class="field">
          <label for="trip-from-date">از تاریخ</label>
          <DatePicker
              input-id="trip-from-date"
              v-model="filters.from_date"
              date-format="yy/mm/dd"
              placeholder="انتخاب تاریخ شروع"
              class="filter-control"
              show-icon
              icon-display="input"
              @date-select="onFiltersChanged"
              @clear-click="onFiltersChanged"
          />
        </div>

        <div class="field">
          <label for="trip-to-date">تا تاریخ</label>
          <DatePicker
              input-id="trip-to-date"
              v-model="filters.to_date"
              date-format="yy/mm/dd"
              placeholder="انتخاب تاریخ پایان"
              class="filter-control"
              show-icon
              icon-display="input"
              @date-select="onFiltersChanged"
              @clear-click="onFiltersChanged"
          />
        </div>
      </div>
    </section>

    <!-- Loading -->
    <section v-if="store.loading" class="surface loading-panel" aria-label="در حال بارگذاری سفرها">
      <div class="loading-title skeleton"></div>
      <div v-for="item in 4" :key="item" class="skeleton-trip">
        <span class="skeleton skeleton-avatar"></span>
        <span class="skeleton skeleton-line"></span>
        <span class="skeleton skeleton-line short"></span>
      </div>
    </section>

    <template v-else>
      <!-- Results heading -->
      <section class="surface results-panel">
        <div class="section-heading results-heading">
          <div class="heading-icon route-icon"><i class="pi pi-map-marker" aria-hidden="true"></i></div>
          <div class="results-title">
            <h2>لیست سفرها</h2>
            <p>جزئیات و عملیات مربوط به هر سفر</p>
          </div>
          <span class="record-count">{{ formatNumber(store.pagination.total) }} سفر</span>
        </div>

        <!-- Mobile cards -->
        <div v-if="store.trips.length" class="mobile-trip-list">
          <article v-for="trip in store.trips" :key="trip.id" class="trip-card">
            <div class="trip-card-top">
              <div class="trip-identity">
                <span class="trip-number">#{{ trip.id }}</span>
                <span class="status-pill" :class="getStatusClasses(trip.status)">
                  <i :class="getStatusConfig(trip.status).icon" aria-hidden="true"></i>
                  {{ getStatusConfig(trip.status).label }}
                </span>
              </div>
              <div class="trip-amount">
                <span class="meta-label">مبلغ کل</span>
                <strong>{{ formatMoney(trip.total_expenses) }}</strong>
              </div>
            </div>

            <div class="trip-route">
              <div class="route-point">
                <span class="route-marker origin-marker" aria-hidden="true"></span>
                <div>
                  <span class="meta-label">مبدأ</span>
                  <strong>{{ trip.origin || '—' }}</strong>
                </div>
              </div>
              <div class="route-connector" aria-hidden="true"></div>
              <div class="route-point">
                <span class="route-marker destination-marker" aria-hidden="true"></span>
                <div>
                  <span class="meta-label">مقصد</span>
                  <strong>{{ trip.destination || '—' }}</strong>
                </div>
              </div>
            </div>

            <div class="trip-details-grid">
              <div class="detail-item">
                <span class="detail-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
                <div class="detail-copy">
                  <span class="meta-label">راننده</span>
                  <strong>{{ trip.driver?.name || '—' }}</strong>
                  <small>کد پرسنلی: {{ trip.driver?.personnel_code || '—' }}</small>
                </div>
              </div>
              <div class="detail-item">
                <span class="detail-icon"><i class="pi pi-truck" aria-hidden="true"></i></span>
                <div class="detail-copy">
                  <span class="meta-label">خودرو</span>
                  <strong>کد {{ trip.truck?.code || '—' }}</strong>
                  <small class="ltr-text">{{ trip.truck?.plate_number || '—' }}</small>
                </div>
              </div>
              <div class="detail-item date-detail">
                <span class="detail-icon"><i class="pi pi-calendar" aria-hidden="true"></i></span>
                <div class="detail-copy">
                  <span class="meta-label">تاریخ شروع</span>
                  <strong class="ltr-text">{{ toJalali(trip.start_date) || '—' }}</strong>
                </div>
              </div>
            </div>

            <div class="trip-actions">
              <button type="button" class="action-button action-view" @click="viewDetail(trip.id)">
                <i class="pi pi-eye" aria-hidden="true"></i>
                مشاهده جزئیات
              </button>
              <button
                  v-if="canCreateExpense && trip.status === 'in_progress'"
                  type="button"
                  class="icon-action action-expense"
                  aria-label="ثبت هزینه برای این سفر"
                  title="ثبت هزینه"
                  @click="addExpense(trip.id)"
              >
                <i class="pi pi-wallet" aria-hidden="true"></i>
              </button>
              <button
                  v-if="canFinishTrip && trip.status === 'in_progress'"
                  type="button"
                  class="icon-action action-finish"
                  aria-label="پایان این سفر"
                  title="پایان سفر"
                  @click="finishTrip(trip.id)"
              >
                <i class="pi pi-flag" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        </div>

        <!-- Desktop / tablet data table -->
        <div v-if="store.trips.length" class="desktop-table">
          <DataTable
              :value="store.trips"
              data-key="id"
              paginator
              :rows="store.pagination.per_page"
              :total-records="store.pagination.total"
              :first="(store.pagination.current_page - 1) * store.pagination.per_page"
              @page="onPage"
              striped-rows
              class="trip-data-table"
              table-class="min-w-full"
              :pt="{
              paginator: { root: 'table-paginator' },
              header: { class: 'table-header' }
            }"
          >
            <Column field="id" header="#" style="width: 72px">
              <template #body="{ data }"><span class="table-id">#{{ data.id }}</span></template>
            </Column>
            <Column header="راننده">
              <template #body="{ data }">
                <div class="table-person">
                  <span class="table-avatar"><i class="pi pi-user" aria-hidden="true"></i></span>
                  <div><strong>{{ data.driver?.name || '—' }}</strong><small>کد: {{ data.driver?.personnel_code || '—' }}</small></div>
                </div>
              </template>
            </Column>
            <Column header="کامیون">
              <template #body="{ data }">
                <div class="table-truck"><strong>کد {{ data.truck?.code || '—' }}</strong><small class="ltr-text">{{ data.truck?.plate_number || '—' }}</small></div>
              </template>
            </Column>
            <Column header="مسیر">
              <template #body="{ data }">
                <div class="table-route"><span>{{ data.origin || '—' }}</span><i class="pi pi-arrow-left" aria-hidden="true"></i><span>{{ data.destination || '—' }}</span></div>
              </template>
            </Column>
            <Column header="تاریخ شروع">
              <template #body="{ data }"><span class="ltr-text table-date">{{ toJalali(data.start_date) || '—' }}</span></template>
            </Column>
            <Column header="مبلغ کل">
              <template #body="{ data }"><strong class="table-money">{{ formatMoney(data.total_expenses) }}</strong></template>
            </Column>
            <Column header="وضعیت">
              <template #body="{ data }">
                <span class="status-pill" :class="getStatusClasses(data.status)">
                  <i :class="getStatusConfig(data.status).icon" aria-hidden="true"></i>
                  {{ getStatusConfig(data.status).label }}
                </span>
              </template>
            </Column>
            <Column header="عملیات" style="width: 150px">
              <template #body="{ data }">
                <div class="table-actions">
                  <button type="button" class="icon-action action-view" title="مشاهده جزئیات" aria-label="مشاهده جزئیات" @click="viewDetail(data.id)"><i class="pi pi-eye" aria-hidden="true"></i></button>
                  <button v-if="canCreateExpense && data.status === 'in_progress'" type="button" class="icon-action action-expense" title="ثبت هزینه" aria-label="ثبت هزینه" @click="addExpense(data.id)"><i class="pi pi-wallet" aria-hidden="true"></i></button>
                  <button v-if="canFinishTrip && data.status === 'in_progress'" type="button" class="icon-action action-finish" title="پایان سفر" aria-label="پایان سفر" @click="finishTrip(data.id)"><i class="pi pi-flag" aria-hidden="true"></i></button>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Empty state -->
        <div v-if="!store.trips.length" class="empty-state">
          <span class="empty-icon"><i class="pi pi-map" aria-hidden="true"></i></span>
          <h3>سفری برای نمایش وجود ندارد</h3>
          <p>فیلترها را تغییر دهید یا در صورت نیاز یک سفر جدید ثبت کنید.</p>
          <button v-if="canCreateTrip" type="button" class="primary-button empty-create" @click="router.push({ name: 'trip-expense.trips.create' })">
            <i class="pi pi-plus" aria-hidden="true"></i>
            ثبت سفر جدید
          </button>
        </div>

        <!-- Mobile pagination -->
        <nav v-if="store.trips.length && totalPages > 1" class="mobile-pagination" aria-label="صفحه‌بندی سفرها">
          <button type="button" class="page-button" :disabled="store.pagination.current_page <= 1" @click="changeMobilePage(store.pagination.current_page - 1)">
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
            قبلی
          </button>
          <span>صفحه {{ formatNumber(store.pagination.current_page) }} از {{ formatNumber(totalPages) }}</span>
          <button type="button" class="page-button" :disabled="store.pagination.current_page >= totalPages" @click="changeMobilePage(store.pagination.current_page + 1)">
            بعدی
            <i class="pi pi-chevron-left" aria-hidden="true"></i>
          </button>
        </nav>
      </section>
    </template>
  </main>

  <Dialog
      v-model:visible="showFinishDialog"
      modal
      dir="rtl"
      :closable="!finishingTrip"
      :close-on-escape="!finishingTrip"
      :dismissable-mask="!finishingTrip"
      :style="{ width: 'min(92vw, 430px)' }"
      class="finish-trip-dialog"
  >
    <template #header>
      <div class="finish-dialog-heading">
      <span class="finish-dialog-icon">
        <i class="pi pi-flag" aria-hidden="true"></i>
      </span>
        <div>
          <h3>پایان سفر</h3>
          <p>تأیید نهایی عملیات</p>
        </div>
      </div>
    </template>

    <div class="finish-dialog-content">
      <h4>آیا از پایان این سفر اطمینان دارید؟</h4>
      <p>
        پس از تأیید، وضعیت سفر به پایان‌یافته تغییر می‌کند.
        لطفاً قبل از ادامه، از ثبت هزینه‌های موردنیاز اطمینان حاصل کنید.
      </p>

      <div class="finish-dialog-notice">
        <i class="pi pi-info-circle" aria-hidden="true"></i>
        <span>این عملیات را فقط در صورت اتمام سفر تأیید کنید.</span>
      </div>
    </div>

    <template #footer>
      <div class="finish-dialog-actions">
        <Button
            label="انصراف"
            icon="pi pi-times"
            severity="secondary"
            outlined
            :disabled="finishingTrip"
            @click="cancelFinishTrip"
        />

        <Button
            label="بله، پایان سفر"
            icon="pi pi-check"
            severity="success"
            :loading="finishingTrip"
            @click="confirmFinishTrip"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authold'
import { useTripStore } from '@/stores/tripStore'
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()
const router = useRouter()
const authStore = useAuthStore()
const store = useTripStore()

const isDriver = computed(() =>
    authStore.can('trip_expense.create_expense') && !authStore.can('trip_expense.manage')
)
const canCreateTrip = computed(() => authStore.can('trip_expense.create_trip'))
const canCreateExpense = computed(() => authStore.can('trip_expense.create_expense'))
const canFinishTrip = computed(() => authStore.can('trip_expense.create_trip'))

const STATUS_CONFIG = {
  pending: {
    label: 'در انتظار شروع',
    icon: 'pi pi-clock',
    bg: 'status-pending'
  },
  in_progress: {
    label: 'در حال انجام',
    icon: 'pi pi-sync',
    bg: 'status-progress'
  },
  completed: {
    label: 'پایان یافته',
    icon: 'pi pi-check-circle',
    bg: 'status-completed'
  },
  cancelled: {
    label: 'لغو شده',
    icon: 'pi pi-times-circle',
    bg: 'status-cancelled'
  }
}

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    label: config.label,
    value
  }))
]

const getStatusConfig = (status) =>
    STATUS_CONFIG[status] || { label: status || 'نامشخص', icon: 'pi pi-question-circle', bg: 'status-unknown' }

const getStatusClasses = (status) => getStatusConfig(status).bg

const filters = ref({
  status: null,
  from_date: null,
  to_date: null
})

const totalPages = computed(() => {
  const perPage = Number(store.pagination.per_page) || 1
  return Math.max(1, Math.ceil((Number(store.pagination.total) || 0) / perPage))
})

const formatDate = (date) => {
  if (!date) return null
  if (!(date instanceof Date)) return date

  // Use local calendar parts instead of toISOString() to avoid timezone date shifts.
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadData = async () => {
  const params = {
    per_page: store.pagination.per_page,
    page: store.pagination.current_page
  }

  if (filters.value.status) params.status = filters.value.status
  if (filters.value.from_date) params.from_date = formatDate(filters.value.from_date)
  if (filters.value.to_date) params.to_date = formatDate(filters.value.to_date)

  if (isDriver.value) {
    await store.fetchMyTrips(params)
  } else {
    await store.fetchAllTrips(params)
  }
}

const onFiltersChanged = () => {
  store.pagination.current_page = 1
  loadData()
}

const resetFilters = () => {
  filters.value = { status: null, from_date: null, to_date: null }
  store.pagination.current_page = 1
  loadData()
}

const onPage = (event) => {
  store.pagination.current_page = event.page + 1
  loadData()
}

const changeMobilePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  store.pagination.current_page = page
  loadData()
}

const viewDetail = (id) => router.push({ name: 'trip-expense.trips.show', params: { id } })
const addExpense = (id) => router.push({ name: 'trip-expense.expenses.create', params: { tripId: id } })

const showFinishDialog = ref(false)
const finishingTripId = ref(null)
const finishingTrip = ref(false)

const finishTrip = (id) => {
  finishingTripId.value = id
  showFinishDialog.value = true
}

const confirmFinishTrip = async () => {
  if (!finishingTripId.value || finishingTrip.value) return

  finishingTrip.value = true

  try {
    await store.finishTrip(finishingTripId.value)

    showFinishDialog.value = false
    finishingTripId.value = null

    await loadData()
  } catch (error) {
    console.error('خطا در پایان سفر:', error)
  } finally {
    finishingTrip.value = false
  }
}

const cancelFinishTrip = () => {
  if (finishingTrip.value) return

  showFinishDialog.value = false
  finishingTripId.value = null
}
const formatNumber = (value) => Number(value || 0).toLocaleString('fa-IR')

const formatMoney = (value) => `${formatNumber(value)} تومان`

onMounted(loadData)
</script>

<style scoped>


.finish-dialog-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.finish-dialog-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 14px;
  color: #b77913;
  background: #fff6df;
  font-size: 1.2rem;
}

.finish-dialog-heading h3 {
  margin: 0;
  color: #202940;
  font-size: 1rem;
  font-weight: 800;
}

.finish-dialog-heading p {
  margin: 4px 0 0;
  color: #8991a1;
  font-size: 0.75rem;
}

.finish-dialog-content h4 {
  margin: 0 0 10px;
  color: #293247;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.8;
}

.finish-dialog-content > p {
  margin: 0;
  color: #697386;
  font-size: 0.82rem;
  line-height: 2;
}

.finish-dialog-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 18px;
  padding: 12px;
  border: 1px solid #f5e6bf;
  border-radius: 12px;
  color: #8a6415;
  background: #fffbef;
  font-size: 0.75rem;
  line-height: 1.9;
}

.finish-dialog-notice i {
  margin-top: 4px;
  flex-shrink: 0;
}

.finish-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}

.finish-dialog-actions :deep(.p-button) {
  flex: 1;
  justify-content: center;
  min-height: 44px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 480px) {
  .finish-dialog-actions {
    flex-direction: column-reverse;
  }

  .finish-dialog-actions :deep(.p-button) {
    width: 100%;
  }
}
.trip-expense-page {
  --trip-primary: #5b4be8;
  --trip-primary-dark: #4535cf;
  --trip-ink: #172033;
  --trip-muted: #697386;
  --trip-border: #e7eaf1;
  --trip-surface: #ffffff;
  display: grid;
  gap: 1.15rem;
  min-width: 0;
  color: var(--trip-ink);
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  animation: page-enter 260ms ease-out both;
}

.trip-expense-page,
.trip-expense-page * {
  box-sizing: border-box;
}

.page-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  min-width: 0;
  overflow: hidden;
  padding: clamp(1.15rem, 3vw, 2rem);
  border: 1px solid #e4e5ff;
  border-radius: 1.35rem;
  background:
      radial-gradient(circle at 8% 0%, rgb(129 140 248 / 17%), transparent 34%),
      radial-gradient(circle at 92% 100%, rgb(167 139 250 / 14%), transparent 30%),
      linear-gradient(125deg, #f5f6ff 0%, #fbfcff 54%, #f7f4ff 100%);
  box-shadow: 0 8px 28px rgb(49 46 129 / 5%);
}

.hero-copy { min-width: 0; }
.eyebrow {
  display: flex;
  align-items: center;
  gap: .55rem;
  margin-bottom: .7rem;
  color: #697386;
  font-size: .78rem;
  font-weight: 600;
}
.status-dot {
  width: .5rem;
  height: .5rem;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgb(16 185 129 / 12%);
}
.page-hero h1 {
  margin: 0;
  color: #1b2340;
  font-size: clamp(1.25rem, 2.5vw, 1.85rem);
  line-height: 1.55;
  font-weight: 800;
  letter-spacing: -.035em;
}
.page-hero p {
  margin: .25rem 0 0;
  color: #6b7280;
  font-size: .9rem;
  line-height: 1.8;
}
.access-pill {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  margin-top: .9rem;
  padding: .4rem .7rem;
  border: 1px solid;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 700;
}
.access-driver { color: #087f5b; background: #ecfdf5; border-color: #c7f3df; }
.access-manager { color: #6241c8; background: #f4f0ff; border-color: #e3d9ff; }

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  min-height: 2.8rem;
  padding: .7rem 1rem;
  border: 0;
  border-radius: .85rem;
  color: #fff;
  background: linear-gradient(135deg, var(--trip-primary), #7667f4);
  box-shadow: 0 7px 16px rgb(91 75 232 / 20%);
  font: inherit;
  font-size: .85rem;
  font-weight: 750;
  white-space: nowrap;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.primary-button:hover { background: var(--trip-primary-dark); box-shadow: 0 9px 20px rgb(91 75 232 / 25%); }
.primary-button:active { transform: translateY(1px); }

.surface {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--trip-border);
  border-radius: 1.15rem;
  background: var(--trip-surface);
  box-shadow: 0 2px 7px rgb(15 23 42 / 3%);
}
.filters-panel { padding: 1.15rem; }
.section-heading {
  display: flex;
  align-items: center;
  gap: .8rem;
  min-width: 0;
}
.filters-heading { margin-bottom: 1.1rem; }
.heading-icon {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border: 1px solid #e5e1ff;
  border-radius: .8rem;
  color: var(--trip-primary);
  background: #f5f3ff;
}
.section-heading h2 {
  margin: 0;
  color: #202940;
  font-size: .96rem;
  font-weight: 800;
}
.section-heading p {
  margin: .2rem 0 0;
  color: var(--trip-muted);
  font-size: .75rem;
  line-height: 1.65;
}
.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .55rem .65rem;
  border: 0;
  border-radius: .65rem;
  color: #6253d9;
  background: #f6f5ff;
  font: inherit;
  font-size: .75rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .15s ease;
}
.text-button:hover { background: #eeebff; }
.reset-button { margin-right: auto; flex: 0 0 auto; }

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.field { display: grid; gap: .45rem; min-width: 0; }
.field label {
  color: #586174;
  font-size: .76rem;
  font-weight: 700;
}
.filter-control { width: 100%; min-width: 0; }
:deep(.filter-control .p-select),
:deep(.filter-control.p-select),
:deep(.filter-control .p-datepicker),
:deep(.filter-control.p-datepicker) {
  width: 100%;
  min-height: 2.85rem;
  border-color: #e0e4ec;
  border-radius: .8rem;
  background: #fbfcfe;
  box-shadow: none;
}
:deep(.filter-control .p-select:hover),
:deep(.filter-control.p-select:hover),
:deep(.filter-control .p-datepicker:hover),
:deep(.filter-control.p-datepicker:hover) { border-color: #aaa1f7; }
:deep(.filter-control .p-select-label),
:deep(.filter-control input) {
  padding-block: .75rem;
  font-size: .82rem;
}
:deep(.filter-control input) { width: 100%; min-width: 0; }
:deep(.filter-control .p-select-label) { text-align: right; }

.results-panel { padding: 0; }
.results-heading {
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid #edf0f5;
  background: linear-gradient(110deg, #fff, #fbfbff);
}
.route-icon { color: #5948db; }
.results-title { min-width: 0; }
.record-count {
  margin-right: auto;
  padding: .4rem .7rem;
  border: 1px solid #e8eaf1;
  border-radius: 999px;
  color: #626b7c;
  background: #f7f8fb;
  font-size: .75rem;
  font-weight: 750;
  white-space: nowrap;
}

.mobile-trip-list { display: none; }
.desktop-table { min-width: 0; }
:deep(.trip-data-table .p-datatable-table-container) { overflow-x: auto; }
:deep(.trip-data-table .p-datatable-thead > tr > th) {
  padding: .95rem .85rem;
  border-color: #edf0f5;
  color: #586174;
  background: #f8f9fc;
  font-size: .75rem;
  font-weight: 800;
  text-align: right;
  white-space: nowrap;
}
:deep(.trip-data-table .p-datatable-tbody > tr > td) {
  padding: .9rem .85rem;
  border-color: #f0f2f6;
  color: #364152;
  font-size: .8rem;
  vertical-align: middle;
}
:deep(.trip-data-table .p-datatable-tbody > tr:hover) { background: #faf9ff; }
:deep(.trip-data-table .p-paginator) {
  justify-content: center;
  gap: .35rem;
  padding: .8rem;
  border-top: 1px solid #edf0f5;
  background: #fff;
}
:deep(.trip-data-table .p-paginator .p-paginator-page),
:deep(.trip-data-table .p-paginator .p-paginator-prev),
:deep(.trip-data-table .p-paginator .p-paginator-next),
:deep(.trip-data-table .p-paginator .p-paginator-first),
:deep(.trip-data-table .p-paginator .p-paginator-last) {
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: .65rem;
}
:deep(.trip-data-table .p-paginator .p-paginator-page.p-highlight) {
  color: #fff;
  background: var(--trip-primary);
}
.table-id { color: #8b93a4; font-variant-numeric: tabular-nums; }
.table-person { display: flex; align-items: center; gap: .6rem; min-width: 135px; }
.table-avatar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  border-radius: .7rem;
  color: #6455d9;
  background: #f0edff;
}
.table-person div, .table-truck { display: grid; gap: .22rem; }
.table-person strong, .table-truck strong { color: #293247; font-size: .78rem; font-weight: 750; }
.table-person small, .table-truck small { color: #8a92a2; font-size: .68rem; }
.table-route { display: flex; align-items: center; gap: .45rem; white-space: nowrap; }
.table-route i { color: #9aa1b0; font-size: .65rem; }
.ltr-text { direction: ltr; text-align: right; font-variant-numeric: tabular-nums; }
.table-date { color: #6f7889; font-size: .76rem; white-space: nowrap; }
.table-money { color: #293247; font-size: .77rem; white-space: nowrap; }
.table-actions { display: flex; align-items: center; gap: .35rem; }

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  min-height: 1.75rem;
  padding: .32rem .6rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 750;
  white-space: nowrap;
}
.status-pill i { font-size: .72rem; }
.status-pending { color: #596273; background: #f3f5f8; border-color: #e2e6ed; }
.status-progress { color: #2456b3; background: #edf5ff; border-color: #d2e5ff; }
.status-progress i { animation: soft-pulse 1.8s ease-in-out infinite; }
.status-completed { color: #087f5b; background: #eafaf3; border-color: #c9f0df; }
.status-cancelled { color: #b42338; background: #fff0f1; border-color: #ffd7dc; }
.status-unknown { color: #626b7c; background: #f5f6f8; border-color: #e3e6ec; }

.icon-action {
  display: inline-grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  border: 1px solid transparent;
  border-radius: .7rem;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, transform .15s ease;
}
.icon-action:active { transform: scale(.96); }
.action-view { color: #5e6676; }
.action-view:hover { color: #4f46e5; background: #f1efff; border-color: #e2ddff; }
.action-expense { color: #07835e; }
.action-expense:hover { background: #eafaf3; border-color: #c9f0df; }
.action-finish { color: #b77913; }
.action-finish:hover { background: #fff7e6; border-color: #f9e4b2; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.2rem 1.25rem;
  text-align: center;
}
.empty-icon {
  display: grid;
  place-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1.25rem;
  color: #7162df;
  background: #f3f1ff;
  font-size: 1.45rem;
}
.empty-state h3 { margin: 1rem 0 .25rem; color: #293247; font-size: 1rem; font-weight: 800; }
.empty-state p { max-width: 26rem; margin: 0; color: #7b8494; font-size: .82rem; line-height: 1.9; }
.empty-create { margin-top: 1.1rem; }

.mobile-pagination { display: none; }
.loading-panel { padding: 1.25rem; }
.skeleton {
  position: relative;
  overflow: hidden;
  border-radius: .6rem;
  background: #edf0f5;
}
.skeleton::after {
  position: absolute;
  inset: 0;
  content: '';
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 75%), transparent);
  animation: shimmer 1.4s infinite;
}
.loading-title { width: 9rem; height: 1.2rem; margin-bottom: 1.25rem; }
.skeleton-trip { display: flex; align-items: center; gap: .85rem; padding: .9rem 0; border-top: 1px solid #f0f2f6; }
.skeleton-avatar { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; border-radius: .8rem; }
.skeleton-line { width: 34%; height: .85rem; }
.skeleton-line.short { width: 18%; margin-right: auto; }

button:focus-visible,
:deep(button:focus-visible),
:deep(input:focus-visible) {
  outline: 3px solid rgb(99 102 241 / 35%);
  outline-offset: 2px;
}

@keyframes shimmer { to { transform: translateX(100%); } }
@keyframes page-enter { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes soft-pulse { 50% { opacity: .55; } }

@media (max-width: 900px) {
  .filters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .desktop-table :deep(.p-datatable-table-container) { overflow-x: auto; }
  :deep(.trip-data-table .p-datatable-table) { min-width: 850px; }
}

@media (max-width: 640px) {
  .trip-expense-page { gap: .85rem; }
  .page-hero {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 1.1rem;
  }
  .page-hero h1 { font-size: 1.3rem; }
  .page-hero p { max-width: 32rem; font-size: .82rem; }
  .eyebrow { font-size: .72rem; margin-bottom: .5rem; }
  .access-pill { margin-top: .7rem; }
  .create-button { width: 100%; min-height: 2.9rem; }
  .filters-panel { padding: 1rem; border-radius: 1rem; }
  .filters-heading { align-items: center; gap: .65rem; margin-bottom: .9rem; }
  .heading-icon { width: 2.25rem; height: 2.25rem; border-radius: .7rem; }
  .section-heading h2 { font-size: .9rem; }
  .section-heading p { font-size: .7rem; }
  .reset-button { padding: .5rem; font-size: .7rem; }
  .reset-button span { display: none; }
  .filters-grid { grid-template-columns: minmax(0, 1fr); gap: .8rem; }
  .field { gap: .4rem; }
  .field label { font-size: .75rem; }
  :deep(.filter-control .p-select),
  :deep(.filter-control.p-select),
  :deep(.filter-control .p-datepicker),
  :deep(.filter-control.p-datepicker) { min-height: 2.9rem; }
  .results-panel { border-radius: 1rem; }
  .results-heading { padding: 1rem; gap: .65rem; }
  .record-count { padding: .35rem .55rem; font-size: .69rem; }
  .desktop-table { display: none; }
  .mobile-trip-list { display: grid; gap: .75rem; padding: .8rem; }
  .trip-card {
    min-width: 0;
    padding: .9rem;
    border: 1px solid #e8ebf2;
    border-radius: .95rem;
    background: #fff;
    box-shadow: 0 2px 6px rgb(15 23 42 / 2%);
  }
  .trip-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: .65rem; }
  .trip-identity { display: grid; justify-items: start; gap: .45rem; min-width: 0; }
  .trip-number { color: #8790a0; font-size: .72rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  .trip-amount { display: grid; gap: .3rem; justify-items: end; min-width: 0; }
  .trip-amount strong { color: #282f43; font-size: .82rem; font-weight: 850; line-height: 1.7; text-align: left; overflow-wrap: anywhere; }
  .meta-label { display: block; color: #8991a1; font-size: .68rem; font-weight: 650; line-height: 1.6; }
  .trip-route {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: .6rem;
    margin-top: .9rem;
    padding: .85rem .75rem;
    border: 1px solid #eeecff;
    border-radius: .8rem;
    background: linear-gradient(115deg, #fbfaff, #f9fbff);
  }
  .route-point { display: flex; align-items: center; gap: .65rem; min-width: 0; }
  .route-point > div { min-width: 0; }
  .route-point strong { display: block; margin-top: .12rem; color: #293247; font-size: .84rem; font-weight: 800; overflow-wrap: anywhere; }
  .route-marker { width: .6rem; height: .6rem; flex: 0 0 auto; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 2px; }
  .origin-marker { color: #6d5ce7; background: #6d5ce7; }
  .destination-marker { color: #0eaa78; background: #0eaa78; }
  .route-connector { height: .55rem; margin-right: .25rem; border-right: 1px dashed #c9c5ef; }
  .trip-details-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .85rem .65rem; padding: .9rem .1rem; }
  .detail-item { display: flex; align-items: flex-start; gap: .5rem; min-width: 0; }
  .detail-icon { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; flex: 0 0 auto; border-radius: .6rem; color: #6e61cf; background: #f3f1ff; font-size: .75rem; }
  .detail-copy { min-width: 0; }
  .detail-copy strong { display: block; margin-top: .12rem; color: #354055; font-size: .75rem; line-height: 1.6; overflow-wrap: anywhere; }
  .detail-copy small { display: block; margin-top: .12rem; color: #8a92a2; font-size: .66rem; overflow-wrap: anywhere; }
  .date-detail { grid-column: 1 / -1; }
  .trip-actions { display: flex; align-items: center; gap: .45rem; padding-top: .75rem; border-top: 1px solid #f0f1f6; }
  .action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    min-height: 2.55rem;
    padding: .55rem .8rem;
    border: 1px solid #e5e7ef;
    border-radius: .7rem;
    background: #fff;
    font: inherit;
    font-size: .75rem;
    font-weight: 750;
    cursor: pointer;
  }
  .trip-actions .action-button { flex: 1; }
  .action-button.action-view { color: #5142c8; border-color: #e5e1ff; background: #f8f7ff; }
  .trip-actions .icon-action { width: 2.55rem; height: 2.55rem; border-color: #e8ebf2; background: #fff; }
  .empty-state { padding: 2.5rem 1rem; }
  .empty-state p { font-size: .78rem; }
  .mobile-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .5rem;
    padding: .8rem;
    border-top: 1px solid #edf0f5;
    color: #687184;
    font-size: .72rem;
  }
  .page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    min-height: 2.45rem;
    padding: .5rem .7rem;
    border: 1px solid #e3e6ef;
    border-radius: .7rem;
    color: #5142c8;
    background: #fff;
    font: inherit;
    font-weight: 750;
    cursor: pointer;
  }
  .page-button:disabled { color: #a6adba; background: #f8f9fb; cursor: not-allowed; }
}

@media (prefers-reduced-motion: reduce) {
  .trip-expense-page, .skeleton::after, .status-progress i { animation: none !important; }
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
}
</style>
