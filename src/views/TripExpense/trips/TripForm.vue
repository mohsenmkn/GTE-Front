```vue
<!-- src/views/TripExpense/trips/TripForm.vue -->

<template>
  <div class="trip-form-page">
    <!-- پیام‌های Toast -->
    <Toast position="top-left" />

    <!-- Hero -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="relative z-10">
        <button
            @click="$router.back()"
            class="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-600"
        >
          <i class="pi pi-arrow-right text-[10px]"></i>
          <span>بازگشت</span>
        </button>

        <h1 class="hero-title text-xl md:text-2xl">
          {{ isDriver ? 'ثبت سفر جدید 🚚' : 'ثبت سفر برای راننده 🚚' }}
        </h1>

        <p class="hero-subtitle text-sm mt-1">
          {{
            isDriver
                ? 'مشخصات سفر خود را وارد کنید. اطلاعات شما و کامیون‌تان به‌صورت خودکار وارد شده است.'
                : 'اطلاعات سفر بین شهری را وارد کنید'
          }}
        </p>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="pageLoading" class="dashboard-card p-6 space-y-4">
      <div class="skeleton w-64 h-6"></div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
            v-for="i in 4"
            :key="i"
            class="skeleton w-full h-20 rounded-xl"
        ></div>
      </div>
    </div>

    <!-- Form -->
    <form
        v-else
        @submit.prevent="submitForm"
        class="dashboard-card p-6 space-y-5"
    >
      <!-- حالت راننده -->
      <div v-if="isDriver" class="space-y-5">
        <!-- اطلاعات راننده -->
        <div
            class="info-box bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 p-4 rounded-xl"
        >
          <div class="flex items-center gap-2 mb-3">
            <div
                class="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center"
            >
              <i class="pi pi-user text-violet-600 text-sm"></i>
            </div>

            <label class="text-xs font-bold text-violet-700">
              راننده
            </label>
          </div>

          <div class="flex items-center gap-3">
            <div
                class="w-12 h-12 rounded-full bg-white border-2 border-violet-200 flex items-center justify-center shadow-sm"
            >
              <i class="pi pi-user text-violet-600 text-lg"></i>
            </div>

            <div>
              <div class="font-bold text-slate-800 text-sm">
                {{ currentUser?.name || 'نامشخص' }}
              </div>

              <div class="text-xs text-slate-500 mt-0.5">
                کد پرسنلی:
                <span class="font-mono dir-ltr">
                  {{ currentUser?.personnel_code || '—' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- اطلاعات کامیون -->
        <div
            class="info-box bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 p-4 rounded-xl"
        >
          <div class="flex items-center gap-2 mb-3">
            <div
                class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
            >
              <i class="pi pi-truck text-blue-600 text-sm"></i>
            </div>

            <label class="text-xs font-bold text-blue-700">
              کامیون اختصاصی شما
            </label>
          </div>

          <div v-if="currentTruck" class="flex items-center gap-3">
            <div
                class="w-12 h-12 rounded-xl bg-white border-2 border-blue-200 flex items-center justify-center shadow-sm"
            >
              <i class="pi pi-truck text-blue-600 text-lg"></i>
            </div>

            <div>
              <div class="font-bold text-slate-800 text-sm">
                کد {{ currentTruck.code }}
              </div>

              <div class="text-xs text-slate-500 mt-0.5 dir-ltr">
                {{ currentTruck.plate_number }}
              </div>

              <div
                  v-if="currentTruck.brand"
                  class="text-[10px] text-slate-400 mt-0.5"
              >
                {{ currentTruck.brand }}
                {{ currentTruck.model ? ' / ' + currentTruck.model : '' }}
              </div>
            </div>
          </div>

          <!-- کامیون اختصاص داده نشده -->
          <div
              v-else
              class="flex items-start gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200"
          >
            <i
                class="pi pi-exclamation-triangle text-rose-500 mt-0.5"
            ></i>

            <div>
              <p class="text-xs font-bold text-rose-700">
                کامیونی به شما اختصاص داده نشده است
              </p>

              <p class="text-[11px] text-rose-600 mt-1">
                لطفاً با مدیر سیستم تماس بگیرید تا کامیون به شما اختصاص داده شود.
              </p>
            </div>
          </div>
        </div>

        <!-- فیلدهای راننده -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              مبدأ <span class="text-rose-500">*</span>
            </label>

            <input
                v-model="form.origin"
                type="text"
                placeholder="مثلاً: تهران"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />

            <p v-if="errors.origin" class="text-xs text-rose-600">
              {{ errors.origin }}
            </p>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              مقصد <span class="text-rose-500">*</span>
            </label>

            <input
                v-model="form.destination"
                type="text"
                placeholder="مثلاً: اصفهان"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />

            <p v-if="errors.destination" class="text-xs text-rose-600">
              {{ errors.destination }}
            </p>
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">
              تاریخ شروع سفر <span class="text-rose-500">*</span>
            </label>

            <DatePicker
                v-model="form.start_date"
                date-format="yy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
                :pt="{
                root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                panel: 'rounded-xl border border-slate-200 shadow-lg',
              }"
            />

            <p v-if="errors.start_date" class="text-xs text-rose-600">
              {{ errors.start_date }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-600">
            توضیحات
          </label>

          <textarea
              v-model="form.description"
              rows="3"
              placeholder="توضیحات اختیاری درباره سفر..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
          ></textarea>
        </div>
      </div>

      <!-- حالت مدیر -->
      <div v-else class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- راننده -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              راننده <span class="text-rose-500">*</span>
            </label>

            <Select
                v-model="form.driver_id"
                :options="drivers"
                option-label="name"
                option-value="id"
                placeholder="انتخاب راننده"
                filter
                class="w-full"
                :loading="loadingDrivers"
                :pt="{
                root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                panel: 'rounded-xl border border-slate-200 shadow-lg',
              }"
            />

            <p v-if="errors.driver_id" class="text-xs text-rose-600">
              {{ errors.driver_id }}
            </p>
          </div>

          <!-- کامیون -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              کامیون <span class="text-rose-500">*</span>
            </label>

            <Select
                v-model="form.truck_id"
                :options="trucks"
                option-label="display"
                option-value="id"
                placeholder="انتخاب کامیون"
                filter
                class="w-full"
                :loading="loadingTrucks"
                :pt="{
                root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                panel: 'rounded-xl border border-slate-200 shadow-lg',
              }"
            />

            <p v-if="errors.truck_id" class="text-xs text-rose-600">
              {{ errors.truck_id }}
            </p>
          </div>

          <!-- مبدأ -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              مبدأ <span class="text-rose-500">*</span>
            </label>

            <input
                v-model="form.origin"
                type="text"
                placeholder="مثلاً: تهران"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />

            <p v-if="errors.origin" class="text-xs text-rose-600">
              {{ errors.origin }}
            </p>
          </div>

          <!-- مقصد -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">
              مقصد <span class="text-rose-500">*</span>
            </label>

            <input
                v-model="form.destination"
                type="text"
                placeholder="مثلاً: اصفهان"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />

            <p v-if="errors.destination" class="text-xs text-rose-600">
              {{ errors.destination }}
            </p>
          </div>

          <!-- تاریخ شروع -->
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">
              تاریخ شروع سفر <span class="text-rose-500">*</span>
            </label>

            <DatePicker
                v-model="form.start_date"
                date-format="yy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
                :pt="{
                root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all',
                panel: 'rounded-xl border border-slate-200 shadow-lg',
              }"
            />

            <p v-if="errors.start_date" class="text-xs text-rose-600">
              {{ errors.start_date }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold text-slate-600">
            توضیحات
          </label>

          <textarea
              v-model="form.description"
              rows="3"
              placeholder="توضیحات اختیاری درباره سفر..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
          ></textarea>
        </div>
      </div>

      <!-- دکمه‌ها -->
      <div
          class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100"
      >
        <button
            type="button"
            @click="$router.back()"
            class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-sm font-medium"
        >
          انصراف
        </button>

        <button
            type="submit"
            :disabled="submitting || (isDriver && !currentTruck)"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i v-if="submitting" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-check"></i>

          <span>
            {{ submitting ? 'در حال ثبت...' : 'ثبت سفر' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

import { useAuthStore } from '@/stores/authold'
import { useTripStore } from '@/stores/tripStore'
import { useTruckStore } from '@/stores/truckStore'

import tripExpenseService from '@/services/tripExpenseService'
import api from '@/api/axios.js'

const router = useRouter()
const toast = useToast()

const authStore = useAuthStore()
const tripStore = useTripStore()
const truckStore = useTruckStore()

// ═══════════════════════════════════════
// State
// ═══════════════════════════════════════

const drivers = ref([])
const trucks = ref([])
const currentTruck = ref(null)

const loadingDrivers = ref(false)
const loadingTrucks = ref(false)
const pageLoading = ref(true)
const submitting = ref(false)

// ═══════════════════════════════════════
// Toast helpers
// ═══════════════════════════════════════

const showSuccess = (summary, detail) => {
  toast.add({
    severity: 'success',
    summary,
    detail,
    life: 3500,
  })
}

const showError = (summary, detail) => {
  toast.add({
    severity: 'error',
    summary,
    detail,
    life: 5000,
  })
}

const showWarning = (summary, detail) => {
  toast.add({
    severity: 'warn',
    summary,
    detail,
    life: 4500,
  })
}

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return fallback
}

// ═══════════════════════════════════════
// Computed
// ═══════════════════════════════════════

const isDriver = computed(() => {
  if (typeof authStore.hasRole === 'function') {
    return authStore.hasRole('driver')
  }

  return (
      authStore.can('trip_expense.create_expense') &&
      !authStore.can('trip_expense.manage')
  )
})

const currentUser = computed(() => authStore.user)

// ═══════════════════════════════════════
// Form
// ═══════════════════════════════════════

const form = reactive({
  driver_id: null,
  truck_id: null,
  origin: '',
  destination: '',
  start_date: null,
  description: '',
})

const errors = reactive({
  driver_id: '',
  truck_id: '',
  origin: '',
  destination: '',
  start_date: '',
})

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════

const formatDate = (date) => {
  if (!date) return null

  if (date instanceof Date) {
    // جلوگیری از تغییر روز بر اثر اختلاف منطقه زمانی
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return date
}

// ═══════════════════════════════════════
// Fetch drivers
// ═══════════════════════════════════════

const fetchDrivers = async () => {
  loadingDrivers.value = true

  try {
    const response = await api.get('auth/users', {
      params: { role: 'driver' },
    })

    drivers.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Error fetching drivers:', error)

    drivers.value = []

    showError(
        'خطا در دریافت رانندگان',
        getErrorMessage(error, 'فهرست رانندگان دریافت نشد.')
    )
  } finally {
    loadingDrivers.value = false
  }
}

// ═══════════════════════════════════════
// Fetch trucks
// ═══════════════════════════════════════

const fetchTrucks = async () => {
  loadingTrucks.value = true

  try {
    await truckStore.fetchTrucks({ per_page: 1000 })

    trucks.value = (truckStore.trucks || []).map((truck) => ({
      ...truck,
      display: `کد ${truck.code} - ${truck.plate_number}`,
    }))
  } catch (error) {
    console.error('Error fetching trucks:', error)

    trucks.value = []

    showError(
        'خطا در دریافت کامیون‌ها',
        getErrorMessage(error, 'فهرست کامیون‌ها دریافت نشد.')
    )
  } finally {
    loadingTrucks.value = false
  }
}

// ═══════════════════════════════════════
// Fetch current driver's truck
// ═══════════════════════════════════════

const fetchCurrentTruck = async () => {
  try {
    const response = await tripExpenseService.getMyCurrentTruck()

    currentTruck.value = response.data || null

    if (currentTruck.value) {
      form.truck_id = currentTruck.value.id
    } else {
      form.truck_id = null

      showWarning(
          'کامیون اختصاص داده نشده',
          'برای ثبت سفر، ابتدا باید یک کامیون به شما اختصاص داده شود.'
      )
    }
  } catch (error) {
    console.error('Error fetching current truck:', error)

    currentTruck.value = null
    form.truck_id = null

    showError(
        'خطا در دریافت کامیون',
        getErrorMessage(
            error,
            'اطلاعات کامیون اختصاصی شما دریافت نشد.'
        )
    )
  }
}

// ═══════════════════════════════════════
// Fetch truck assigned to selected driver
// ═══════════════════════════════════════

const fetchDriverAssignedTruck = async (userId) => {
  if (!userId) {
    form.truck_id = null
    return
  }

  try {
    const response = await tripExpenseService.getDriverCurrentTruck(userId)

    if (response.data) {
      form.truck_id = response.data.id
    } else {
      form.truck_id = null

      showWarning(
          'کامیون اختصاص داده نشده',
          'برای راننده انتخاب‌شده کامیونی ثبت نشده است.'
      )
    }
  } catch (error) {
    console.error('Error fetching driver assigned truck:', error)

    form.truck_id = null

    showError(
        'خطا در دریافت کامیون',
        getErrorMessage(
            error,
            'اطلاعات کامیون اختصاص‌یافته به راننده دریافت نشد.'
        )
    )
  }
}

// ═══════════════════════════════════════
// Validation
// ═══════════════════════════════════════

const validate = () => {
  let valid = true

  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })

  if (isDriver.value) {
    if (!currentTruck.value) {
      showWarning(
          'امکان ثبت سفر وجود ندارد',
          'شما به هیچ کامیونی اختصاص داده نشده‌اید. لطفاً با مدیر سیستم تماس بگیرید.'
      )

      valid = false
    }
  } else {
    if (!form.driver_id) {
      errors.driver_id = 'انتخاب راننده الزامی است'
      valid = false
    }

    if (!form.truck_id) {
      errors.truck_id = 'انتخاب کامیون الزامی است'
      valid = false
    }
  }

  if (!form.origin.trim()) {
    errors.origin = 'مبدأ الزامی است'
    valid = false
  }

  if (!form.destination.trim()) {
    errors.destination = 'مقصد الزامی است'
    valid = false
  }

  if (!form.start_date) {
    errors.start_date = 'تاریخ شروع الزامی است'
    valid = false
  }

  if (!valid) {
    showWarning(
        'اطلاعات ناقص است',
        'لطفاً فیلدهای مشخص‌شده را بررسی و تکمیل کنید.'
    )
  }

  return valid
}

// ═══════════════════════════════════════
// Submit form
// ═══════════════════════════════════════

const submitForm = async () => {
  if (submitting.value) return

  if (!validate()) return

  submitting.value = true

  try {
    const payload = {
      driver_id: isDriver.value
          ? currentUser.value?.id
          : form.driver_id,

      truck_id: form.truck_id,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      start_date: formatDate(form.start_date),
      description: form.description?.trim() || null,
    }

    const trip = await tripStore.createTrip(payload)

    showSuccess(
        'ثبت سفر موفق بود',
        'سفر با موفقیت ثبت شد. در حال انتقال به صفحه جزئیات سفر...'
    )

    const tripId = trip?.id ?? trip?.data?.id

    if (tripId) {
      // فرصت نمایش پیام موفقیت پیش از خروج از صفحه
      setTimeout(() => {
        router.push({
          name: 'trip-expense.trips.show',
          params: { id: tripId },
        })
      }, 900)
    } else {
      showWarning(
          'سفر ثبت شد',
          'ثبت سفر انجام شد، اما شناسه سفر در پاسخ سرور دریافت نشد.'
      )
    }
  } catch (error) {
    console.error('Error creating trip:', error)

    showError(
        'خطا در ثبت سفر',
        getErrorMessage(error, 'ثبت سفر با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
    )
  } finally {
    submitting.value = false
  }
}

// ═══════════════════════════════════════
// Watchers
// ═══════════════════════════════════════

// با انتخاب راننده توسط مدیر، کامیون اختصاص‌یافته دریافت شود.
watch(
    () => form.driver_id,
    (newDriverId) => {
      if (!isDriver.value && newDriverId) {
        fetchDriverAssignedTruck(newDriverId)
      } else if (!newDriverId) {
        form.truck_id = null
      }
    }
)

// ═══════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════

onMounted(async () => {
  try {
    if (isDriver.value) {
      form.driver_id = currentUser.value?.id
      await fetchCurrentTruck()
    } else {
      await Promise.all([
        fetchDrivers(),
        fetchTrucks(),
      ])
    }
  } catch (error) {
    console.error('Error initializing form:', error)

    showError(
        'خطا در بارگذاری صفحه',
        'بارگذاری اطلاعات اولیه فرم با خطا مواجه شد.'
    )
  } finally {
    pageLoading.value = false
  }
})
</script>

<style scoped>
.trip-form-page {
  @apply space-y-5;
  animation: dashboard-enter 0.45s ease-out;
}

.skeleton {
  @apply relative overflow-hidden rounded-lg bg-slate-200/70;
}

.skeleton::after {
  content: '';
  @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(
      90deg,
      transparent,
      rgb(255 255 255 / 55%),
      transparent
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.dashboard-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;
  background: linear-gradient(
      135deg,
      rgb(238 242 255),
      rgb(248 250 252) 55%,
      rgb(245 243 255)
  );
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

.dashboard-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.info-box {
  transition: all 0.2s ease;
}

.info-box:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
}

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
```
