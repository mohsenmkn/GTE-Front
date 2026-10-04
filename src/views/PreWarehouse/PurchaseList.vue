<template>
  <div class="pre-warehouse-page">
    <!-- ═════════════════════════════════════════════
         HERO SECTION
    ═════════════════════════════════════════════ -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="hero-status"></span>
            <span class="text-xs text-slate-500 font-medium">ماژول پیش‌انبار فعال است</span>
          </div>
          <h1 class="hero-title">
            مدیریت پیش‌انبار 📦
          </h1>
          <p class="hero-subtitle">
            مدیریت فرآیند دریافت، تخصیص و کنترل کالا
          </p>

          <!-- نشانگر فیلتر خودکار واحد سازمانی (فقط برای متولیان) -->
          <div v-if="store.isCustodian && store.userUnitId" class="mt-3 inline-flex">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                <i class="pi pi-filter"></i>
                نمایش خریدهای واحد: <strong class="mr-1">{{ store.userUnitTitle }}</strong>
            </span>
                  </div>
                  <div v-else-if="store.canViewAll" class="mt-3 inline-flex">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                <i class="pi pi-eye"></i>
                نمایش همه خریدها (دسترسی کامل)
            </span>
          </div>
        </div>

        <div v-if="canCreate" class="flex justify-start md:justify-end">
          <button
              type="button"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-violet-600 hover:bg-violet-700 text-white
                   shadow-lg shadow-violet-500/20
                   transition-all duration-300 transform hover:-translate-y-0.5
                   font-medium text-sm"
              @click="$router.push({ name: 'pre-warehouse.create' })"
          >
            <i class="pi pi-plus text-base"></i>
            <span>ثبت خرید جدید</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
         SKELETON LOADING
    ═════════════════════════════════════════════ -->
    <div v-if="store.loading" class="space-y-5">
      <div class="dashboard-card p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="space-y-2">
            <div class="skeleton w-24 h-4"></div>
            <div class="skeleton w-full h-10 rounded-xl"></div>
          </div>
        </div>
      </div>
      <div class="dashboard-card p-5 space-y-4">
        <div class="skeleton w-48 h-6"></div>
        <div v-for="i in 5" :key="i" class="skeleton w-full h-12 rounded-lg"></div>
      </div>
    </div>

    <!-- ═════════════════════════════════════════════
         MAIN CONTENT (FILTERS & TABLE)
    ═════════════════════════════════════════════ -->
    <div v-else class="space-y-5">
      <!-- Filters -->
      <div class="dashboard-card p-5">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Search -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">جستجو</label>
            <div class="relative">
              <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input
                  v-model="filters.search"
                  type="text"
                  placeholder="جستجو در نام کالا..."
                  class="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50
                       text-sm text-slate-700 placeholder-slate-400
                       focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100
                       transition-all duration-200"
                  @input="debounceSearch"
              />
            </div>
          </div>

          <!-- Status -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">وضعیت</label>
            <Select
                v-model="filters.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="همه وضعیت‌ها"
                class="w-full"
                :pt="{
                  root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                  panel: 'rounded-xl border border-slate-200 shadow-lg',
                }"
                @change="loadData"
            />
          </div>

          <!-- Date From -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">از تاریخ</label>
            <DatePicker
                v-model="filters.date_from"
                date-format="yyyy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
                :pt="{
                  root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                  panel: 'rounded-xl border border-slate-200 shadow-lg',
                }"
                @change="loadData"
            />
          </div>

          <!-- Date To -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">تا تاریخ</label>
            <DatePicker
                v-model="filters.date_to"
                date-format="yyyy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
                :pt="{
                  root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                  panel: 'rounded-xl border border-slate-200 shadow-lg',
                }"
                @change="loadData"
            />
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="dashboard-card overflow-hidden">
        <!-- Table Header -->
        <div class="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
              <i class="pi pi-list text-violet-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">لیست درخواست‌های خرید</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">مدیریت و پیگیری وضعیت کالاها</p>
            </div>
          </div>
          <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
            {{ store.pagination.total }} رکورد
          </span>
        </div>

        <!-- DataTable -->
        <DataTable
            :value="store.purchases"
            :loading="store.loading"
            paginator
            :rows="store.pagination.per_page"
            :total-records="store.pagination.total"
            @page="onPage"
            striped-rows
            class="w-full [&_th]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-semibold [&_th]:text-xs [&_th]:py-3.5 [&_th]:border-b [&_th]:border-slate-100 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:py-3.5 [&_td]:border-b [&_td]:border-slate-50 hover:[&_tr]:bg-violet-50/30 transition-colors"
            table-class="min-w-full"
            :pt="{
              paginator: {
                root: 'border-t border-slate-100 p-3 bg-white',
                pageButton: 'w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-all',
                currentPageReport: 'text-xs text-slate-500 px-2'
              }
            }"
        >
          <Column field="id" header="#" class="text-center text-slate-400 font-mono text-xs" style="width: 60px" />

          <Column field="item.name" header="کالا" class="font-medium text-slate-800">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-box text-slate-400 text-xs"></i>
                <span>{{ data.item?.name || '-' }}</span>
              </div>
            </template>
          </Column>

          <Column header="مقدار">
            <template #body="{ data }">
              <span class="font-bold text-slate-700">
                {{ data.quantity }}
                <span class="text-[11px] text-slate-400 font-normal mr-1">{{ data.unit_of_measurement }}</span>
              </span>
            </template>
          </Column>

          <Column header="واحد هدف">
            <template #body="{ data }">
              <span class="text-slate-500 text-xs">{{ data.target_unit?.title || '-' }}</span>
            </template>
          </Column>

          <Column header="ثبت‌کننده">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                  <i class="pi pi-user text-slate-400 text-[10px]"></i>
                </div>
                <span class="text-xs text-slate-600">{{ data.commercial_user?.name || '-' }}</span>
              </div>
            </template>
          </Column>

          <Column header="وضعیت">
            <template #body="{ data }">
              <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  :class="getStatusClasses(data.status)"
              >
                <i :class="getStatusConfig(data.status).icon"></i>
                {{ getStatusConfig(data.status).label }}
              </span>
            </template>
          </Column>

          <Column header="پیشرفت تخصیص">
            <template #body="{ data }">
              <div class="flex flex-col gap-1.5 w-full max-w-[100px]">
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="getProgressBarColor(data.allocation_progress)"
                      :style="{ width: `${data.allocation_progress}%` }"
                  ></div>
                </div>
                <span class="text-[10px] text-slate-400 text-left dir-ltr font-mono">
                  {{ data.allocation_progress }}%
                </span>
              </div>
            </template>
          </Column>

          <Column header="تاریخ ثبت">
            <template #body="{ data }">
              <span class="text-xs text-slate-500 dir-ltr text-left block font-mono">
                {{ toJalaliDate(data.created_at) }}
              </span>
            </template>
          </Column>

          <Column header="عملیات" style="width: 200px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    @click="viewDetail(data.id)"
                    title="مشاهده جزئیات"
                >
                  <i class="pi pi-eye text-xs"></i>
                </button>

                <button
                    v-if="canAllocate && ['registered', 'pending_allocation', 'pending_reallocation'].includes(data.status)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    @click="goAllocate(data.id)"
                    title="تخصیص انبار"
                >
                  <i class="pi pi-send text-xs"></i>
                </button>

                <button
                    v-if="canReceive && isAllocated(data.status)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    @click="goReceive(data.id)"
                    title="دریافت کالا"
                >
                  <i class="pi pi-download text-xs"></i>
                </button>

                <button
                    v-if="canApprove && data.status === 'pending_custodian_approval'"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-violet-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                    @click="goApprove(data.id)"
                    title="تأیید متولی"
                >
                  <i class="pi pi-check text-xs"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authold'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useJalaliDate } from '@/composables/useJalaliDate'

// --- Composables & Stores ---
const router = useRouter()
const authStore = useAuthStore()
const store = usePreWarehouseStore()
const { toJalaliDate } = useJalaliDate()

// --- Permissions ---
const canCreate = computed(() => authStore.can('pre_warehouse.commercial_create'))
const canAllocate = computed(() => authStore.can('pre_warehouse.warehouse_allocate'))
const canReceive = computed(() => authStore.can('pre_warehouse.warehouse_receive'))
const canApprove = computed(() => authStore.can('pre_warehouse.custodian_approve'))

// --- Standardized Status Configuration (کامل‌شده با تمام وضعیت‌های بک‌اند) ---
const STATUS_CONFIG = {
  registered:                   { label: 'ثبت شده', icon: 'pi pi-file', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  pending_warehouse_approval:  { label: 'در انتظار تایید انبار', icon: 'pi pi-clock', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  approved_by_warehouse:       { label: 'تایید شده توسط انبار', icon: 'pi pi-check-circle', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  pending_custodian_approval:  { label: 'در انتظار تایید متولی', icon: 'pi pi-user-check', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  pending_allocation:          { label: 'در انتظار تخصیص', icon: 'pi pi-share-alt', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  allocated:                   { label: 'تخصیص یافته', icon: 'pi pi-send', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
  in_quarantine:               { label: 'در قرنطینه', icon: 'pi pi-shield', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },  // ✅ جدید
  pending_commercial_voucher:  { label: 'در انتظار حواله بازرگانی', icon: 'pi pi-file-edit', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' },
  voucher_entered:             { label: 'حواله وارد شد', icon: 'pi pi-file-check', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
  pending_warehouse_receipt:   { label: 'در انتظار رسید انبار', icon: 'pi pi-inbox', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  pending_final_allocation:    { label: 'در انتظار تخصیص نهایی انبار و تعیین محل', icon: 'pi pi-map-marker', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
  receipt_entered:             { label: 'رسید انبار وارد شد', icon: 'pi pi-inbox', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-100' },
  fully_received:              { label: 'دریافت کامل شد', icon: 'pi pi-check-double', bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-900' },
  rejected_by_warehouse:       { label: 'رد شده توسط انبار', icon: 'pi pi-times-circle', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  rejected_by_custodian:       { label: 'رد شده توسط متولی', icon: 'pi pi-times-circle', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  rejected_by_destination:     { label: 'رد شده توسط مقصد', icon: 'pi pi-ban', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' },
  pending_reallocation:        { label: 'در انتظار تخصیص مجدد', icon: 'pi pi-refresh', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-100' },
  pending_warehouse_return: {
    label: 'در انتظار تعیین تاریخ تحویل به بازرگانی',
    icon: 'pi pi-clock',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-100'
  },
  warehouse_return_scheduled: {
    label: 'تاریخ تحویل به بازرگانی تعیین شد',
    icon: 'pi pi-calendar',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-100'
  },
  commercial_received: {
    label: 'تحویل بازرگانی شد',
    icon: 'pi pi-check',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-100'
  },
  supplier_returned: {
    label: 'برگشت به تأمین‌کننده',
    icon: 'pi pi-undo',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-100'
  },
}

const statusOptions = [
  { label: 'همه وضعیت‌ها', value: null },
  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    label: config.label,
    value: value
  }))
]

const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || { label: status || 'نامشخص', icon: 'pi pi-question', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
}

const getStatusClasses = (status) => {
  const config = getStatusConfig(status)
  return `${config.bg} ${config.text} ${config.border}`
}

const getProgressBarColor = (progress) => {
  if (progress >= 100) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-violet-500'
  if (progress > 0) return 'bg-amber-400'
  return 'bg-slate-200'
}

// --- State ---
const filters = ref({
  search: '',
  status: null,
  date_from: null,
  date_to: null,
})

let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.pagination.current_page = 1
    loadData()
  }, 500)
}

// --- Actions ---
const loadData = async () => {
  await store.fetchPurchases({
    ...filters.value,
    per_page: store.pagination.per_page,
    page: store.pagination.current_page,
  })
}

const onPage = (event) => {
  store.pagination.current_page = event.page + 1
  loadData()
}

const viewDetail = (id) => router.push({ name: 'pre-warehouse.show', params: { id } })
const goAllocate = (id) => router.push({ name: 'pre-warehouse.allocate', params: { id } })
const goReceive = (id) => router.push({ name: 'pre-warehouse.receive', params: { id } })
const goApprove = (id) => router.push({ name: 'pre-warehouse.approve', params: { id } })

// بررسی وضعیت‌هایی که امکان عملیات دریافت/محل در آن‌ها وجود دارد
const isAllocated = (status) => {
  return ['allocated', 'pending_location_assignment', 'location_assigned', 'partially_received'].includes(status)
}

// --- Lifecycle ---
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ═══════════════════════════════════════
   PAGE ANIMATION & LAYOUT
═══════════════════════════════════════ */
.pre-warehouse-page {
  @apply space-y-5;
  animation: dashboard-enter 0.45s ease-out;
}

.dir-ltr {
  direction: ltr;
}

/* ═══════════════════════════════════════
   SKELETON LOADING
═══════════════════════════════════════ */
.skeleton {
  @apply relative overflow-hidden rounded-lg bg-slate-200/70;
}

.skeleton::after {
  content: '';
  @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent);
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

/* ═══════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════ */
.dashboard-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(238 242 255), rgb(248 250 252) 55%, rgb(245 243 255));
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}

.hero-decoration {
  @apply absolute rounded-full pointer-events-none;
  filter: blur(50px);
}

.hero-decoration-one {
  width: 220px;
  height: 220px;
  background: rgb(129 140 248 / 12%);
  top: -100px;
  left: -60px;
}

.hero-decoration-two {
  width: 180px;
  height: 180px;
  background: rgb(167 139 250 / 12%);
  bottom: -100px;
  right: -50px;
}

.hero-title {
  @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight;
}

.hero-subtitle {
  @apply text-sm md:text-base text-slate-500 mt-1;
}

.hero-status {
  @apply w-2 h-2 rounded-full bg-emerald-500;
  box-shadow: 0 0 0 4px rgb(16 185 129 / 10%);
}

/* ═══════════════════════════════════════
   CARD
═══════════════════════════════════════ */
.dashboard-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

/* ═══════════════════════════════════════
   ANIMATION
═══════════════════════════════════════ */
@keyframes dashboard-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>