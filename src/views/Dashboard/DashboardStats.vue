<template>

  <div
      class="grid grid-cols-2
             lg:grid-cols-5
             gap-3 md:gap-4"
  >

    <!-- ═══════════════════════════════
         ATTENDANCE RATE
    ═══════════════════════════════ -->

    <button class="stat-card attendance-view-card" type="button" @click="openAttendanceDialog">
      <div class="stat-icon bg-indigo-50 border-indigo-100 text-indigo-600">
        <i class="pi pi-calendar-clock"></i>
      </div>
      <div class="min-w-0 flex-1 text-right">
        <p class="stat-label">مشاهده تردد</p>
        <p class="stat-value">ترددهای ماه جاری</p>
        <p class="stat-meta">برای مشاهده جزئیات کلیک کنید</p>
      </div>
      <i class="pi pi-arrow-left text-slate-400" aria-hidden="true"></i>
    </button>

    <div class="stat-card aggregate-card">
      <div class="stat-icon bg-emerald-50 border-emerald-100 text-emerald-600"><i class="pi pi-stopwatch"></i></div>
      <div class="min-w-0">
        <p class="stat-label">جمع اضافه‌کار</p>
        <p class="aggregate-value">{{ aggregateValue(monthlyOvertimeMinutes) }}</p>
        <p class="stat-meta">ماه جاری</p>
      </div>
    </div>

    <div class="stat-card aggregate-card">
      <div class="stat-icon bg-amber-50 border-amber-100 text-amber-600"><i class="pi pi-sun"></i></div>
      <div class="min-w-0">
        <p class="stat-label">جمع تعطیل‌کار</p>
        <p class="aggregate-value">{{ aggregateValue(monthlyHolidayWorkMinutes) }}</p>
        <p class="stat-meta">پنجشنبه و جمعه · ماه جاری</p>
      </div>
    </div>


    <!-- ═══════════════════════════════
         LEAVE
    ═══════════════════════════════ -->

    <div class="stat-card">

      <template v-if="loading">

        <div class="stat-icon-skeleton"></div>

        <div class="flex-1 space-y-2">

          <div class="skeleton w-20 h-3"></div>
          <div class="skeleton w-14 h-6"></div>
          <div class="skeleton w-16 h-2"></div>

        </div>

      </template>

      <template v-else>

        <div
            class="stat-icon
                   bg-emerald-50
                   border-emerald-100
                   text-emerald-600"
        >
          <i class="pi pi-calendar-minus"></i>
        </div>

        <div class="min-w-0">

          <p class="stat-label">
            مانده مرخصی
          </p>

          <div class="flex items-baseline gap-1">

            <span class="stat-value">
              {{ leaveDays }}
            </span>

            <span class="text-xs text-slate-400">
              روز
            </span>

          </div>

          <p class="stat-meta">
            استحقاقی
          </p>

        </div>

      </template>

    </div>


    <!-- ═══════════════════════════════
         LATEST ATTENDANCE
    ═══════════════════════════════ -->

    <div class="stat-card">

      <!-- Skeleton -->

      <template v-if="latestAttendanceLoading">

        <div class="stat-icon-skeleton"></div>

        <div class="flex-1 space-y-2">

          <div class="skeleton w-20 h-3"></div>
          <div class="skeleton w-28 h-6"></div>
          <div class="skeleton w-24 h-2"></div>

        </div>

      </template>


      <!-- Content -->

      <template v-else>

        <div
            class="stat-icon"
            :class="attendanceIconClass"
        >
          <i :class="attendanceIcon"></i>
        </div>


        <div class="min-w-0 flex-1">

          <div class="flex items-center justify-between gap-2">

            <p class="stat-label">
              آخرین تردد
            </p>

            <!-- تعداد تردد -->

            <span
                v-if="latestAttendance"
                class="attendance-count"
            >
              <i class="pi pi-sync text-[9px]"></i>

              {{ latestAttendance.punch_count || 0 }}

              تردد
            </span>

          </div>


          <!-- وقتی تردد وجود دارد -->

          <template v-if="latestAttendance">

            <!-- ساعات ورود / خروج -->

            <div
                class="flex items-center
                       flex-wrap gap-2 mt-1"
            >

              <!-- ورود -->

              <div class="attendance-time">

                <i
                    class="pi pi-sign-in
                           text-emerald-500
                           text-[10px]"
                ></i>

                <span>
                  {{ latestAttendance.first_time || '--:--' }}
                </span>

              </div>


              <span class="text-slate-300">
                →
              </span>


              <!-- خروج -->

              <div class="attendance-time">

                <i
                    class="pi pi-sign-out
                           text-amber-500
                           text-[10px]"
                ></i>

                <span
                    v-if="
                      latestAttendance.last_time &&
                      latestAttendance.last_time !== '--:--'
                    "
                >
                  {{ latestAttendance.last_time }}
                </span>

                <span
                    v-else
                    class="text-[10px]
                           text-amber-600
                           font-medium"
                >
                  بدون خروج
                </span>

              </div>

            </div>


            <!-- تاریخ + وضعیت -->

            <div
                class="flex items-center
                       justify-between
                       gap-2 mt-1"
            >

              <p class="stat-meta">
                {{ latestAttendance.date }}
              </p>


              <!-- وضعیت حضور -->

              <span
                  class="attendance-status"
                  :class="attendanceStatus.class"
              >

                <i :class="attendanceStatus.icon"></i>

                {{ attendanceStatus.label }}

              </span>

            </div>

          </template>


          <!-- بدون تردد -->

          <template v-else>

            <p
                class="text-sm
                       text-slate-400
                       mt-1"
            >
              هنوز ترددی ثبت نشده است
            </p>

            <p class="stat-meta">
              امروز
            </p>

          </template>

        </div>

      </template>

    </div>


  </div>

  <div v-if="attendanceDialogVisible" class="attendance-dialog-backdrop" @click.self="attendanceDialogVisible = false">
    <section class="attendance-dialog" role="dialog" aria-modal="true" aria-labelledby="attendance-dialog-title" dir="rtl">
      <header class="attendance-dialog-header">
        <div class="dialog-title-group">
          <span class="dialog-title-icon"><i class="pi pi-calendar-clock"></i></span>
          <div>
            <h2 id="attendance-dialog-title">گزارش تردد ماه جاری</h2>
            <p>سوابق ثبت‌شده برای حساب کاربری شما</p>
          </div>
        </div>
        <button type="button" class="dialog-close" aria-label="بستن" @click="attendanceDialogVisible = false">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <div v-if="attendanceLoading" class="dialog-message"><i class="pi pi-spin pi-spinner"></i><span>در حال دریافت ترددها…</span></div>
      <div v-else-if="attendanceError" class="dialog-message error-message">
        <i class="pi pi-exclamation-circle"></i>
        <p>{{ attendanceError }}</p>
        <button type="button" class="retry-button" @click="loadMyAttendance">تلاش دوباره</button>
      </div>
      <template v-else>
        <div v-if="attendanceSummary" class="attendance-summary">
          <div class="summary-item"><span>روزهای حضور</span><strong>{{ faNumber(attendanceSummary.presence_days) }} <small>روز</small></strong></div>
          <div class="summary-item"><span>روزهای غیبت</span><strong>{{ faNumber(attendanceSummary.absence_days) }} <small>روز</small></strong></div>
          <div class="summary-item summary-rate"><span>نرخ حضور</span><strong>{{ faNumber(attendanceSummary.attendance_rate) }}٪</strong></div>
          <div class="summary-item summary-month"><span>دوره</span><strong>{{ attendanceSummary.month_key || attendanceSummary.month_title || 'ماه جاری' }}</strong></div>
        </div>
        <div v-if="attendanceDays.length" class="attendance-table-wrap">
          <table class="attendance-table">
            <thead><tr><th>روز و تاریخ</th><th>وضعیت</th><th>ورود</th><th>خروج</th><th>تردد</th><th>کارکرد</th><th>اضافه‌کار</th><th>کسری</th></tr></thead>
            <tbody>
              <tr v-for="(day, index) in attendanceDays" :key="day.date || index" :class="{ 'attendance-weekend': isWeekend(day) }">
                <td><span class="day-name">{{ day.weekday }}</span><span class="day-date">{{ day.date }}</span></td>
                <td><span class="status-pill" :class="isWeekend(day) ? 'status-holiday' : 'status-workday'">{{ isWeekend(day) ? 'تعطیل' : (day.status || '—') }}</span></td>
                <td>{{ day.first_time || '—' }}</td><td>{{ day.last_time || '—' }}</td>
                <td>{{ faNumber(day.punch_count) }}</td><td>{{ day.presence_formatted || '—' }}</td>
                <td><span class="overtime-value">{{ durationHours(day.overtime_minutes) }}</span></td><td>{{ day.shortage_formatted || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="dialog-message empty-message"><i class="pi pi-calendar-times"></i><span>برای ماه جاری ترددی ثبت نشده است.</span></div>
        <footer class="dialog-footnote"><i class="pi pi-info-circle"></i> روزهای پنجشنبه و جمعه به‌عنوان تعطیل نمایش داده می‌شوند.</footer>
      </template>
    </section>
  </div>

</template>


<script setup>

import { computed, onMounted, ref } from 'vue'
import api from '@/api/axios.js'


const props = defineProps({

  attendanceRate: {
    type: [Number, String],
    default: 0
  },

  leaveDays: {
    type: [Number, String],
    default: 0
  },

  unreadAnnouncements: {
    type: Number,
    default: 0
  },

  latestAttendance: {
    type: Object,
    default: null
  },

  latestAttendanceLoading: {
    type: Boolean,
    default: false
  },

  loading: {
    type: Boolean,
    default: false
  }

})

const attendanceDialogVisible = ref(false)
const attendanceLoading = ref(false)
const attendanceError = ref('')
const attendanceDays = ref([])
const attendanceSummary = ref(null)
const attendanceDataLoaded = ref(false)

const monthlyOvertimeMinutes = computed(() => attendanceDays.value.reduce(
  (total, day) => total + (Number(day.overtime_minutes) || 0), 0
))

const monthlyHolidayWorkMinutes = computed(() => attendanceDays.value.reduce(
  (total, day) => total + (isWeekend(day) ? (Number(day.presence_minutes) || 0) : 0), 0
))

onMounted(() => loadMyAttendance())

async function openAttendanceDialog() {
  attendanceDialogVisible.value = true
  await loadMyAttendance()
}

async function loadMyAttendance() {
  attendanceLoading.value = true
  attendanceError.value = ''
  try {
    const response = await api.get('/attendance/me/daily')
    const result = response.data?.data || {}
    attendanceDays.value = result.daily || []
    attendanceSummary.value = result.summary || null
  } catch (error) {
    attendanceError.value = error.response?.data?.message || 'دریافت اطلاعات تردد با خطا روبه‌رو شد.'
  } finally {
    attendanceDataLoaded.value = true
    attendanceLoading.value = false
  }
}

function faNumber(value) {
  return Number(value || 0).toLocaleString('fa-IR')
}

function isWeekend(day) {
  return ['پنجشنبه', 'جمعه'].includes((day.weekday || '').trim())
}

function durationHours(minutes) {
  const totalMinutes = Math.max(0, Number(minutes) || 0)
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  if (!hours && !remainingMinutes) return '۰ ساعت'
  return [hours ? `${faNumber(hours)} ساعت` : '', remainingMinutes ? `${faNumber(remainingMinutes)} دقیقه` : '']
    .filter(Boolean)
    .join(' و ')
}

function aggregateValue(minutes) {
  if (!attendanceDataLoaded.value) return '…'
  if (attendanceError.value && !attendanceSummary.value && !attendanceDays.value.length) return '—'
  return durationHours(minutes)
}


/* ═══════════════════════════════════════
   وضعیت آخرین تردد
═══════════════════════════════════════ */

const attendanceStatus = computed(() => {

  if (!props.latestAttendance) {

    return {
      label: 'بدون تردد',
      icon: 'pi pi-minus',
      class: 'status-neutral'
    }

  }


  /*
   * حالت ایده‌آل:
   *
   * API باید last_punch_type را
   * به صورت entry / exit برگرداند.
   */

  const type =
      props.latestAttendance.last_punch_type


  if (type === 'entry') {

    return {

      label: 'داخل سازمان',

      icon: 'pi pi-sign-in',

      class: 'status-inside'

    }

  }


  if (type === 'exit') {

    return {

      label: 'خارج سازمان',

      icon: 'pi pi-sign-out',

      class: 'status-outside'

    }

  }


  /*
   * Fallback برای API فعلی
   *
   * اگر خروج ثبت نشده باشد،
   * احتمالاً آخرین تردد ورود است.
   */

  const lastTime =
      props.latestAttendance.last_time


  if (
      !lastTime ||
      lastTime === '--:--'
  ) {

    return {

      label: 'داخل سازمان',

      icon: 'pi pi-sign-in',

      class: 'status-inside'

    }

  }


  return {

    label: 'خارج سازمان',

    icon: 'pi pi-sign-out',

    class: 'status-outside'

  }

})


/* ═══════════════════════════════════════
   آیکون کارت
═══════════════════════════════════════ */

const attendanceIcon = computed(() => {

  if (!props.latestAttendance) {
    return 'pi pi-sign-in'
  }

  if (
      props.latestAttendance.last_punch_type === 'exit'
  ) {

    return 'pi pi-sign-out'

  }

  return 'pi pi-sign-in'

})


/* ═══════════════════════════════════════
   رنگ آیکون
═══════════════════════════════════════ */

const attendanceIconClass = computed(() => {

  if (!props.latestAttendance) {

    return [
      'bg-slate-50',
      'border-slate-100',
      'text-slate-400'
    ]

  }


  if (
      props.latestAttendance.last_punch_type === 'exit'
  ) {

    return [
      'bg-amber-50',
      'border-amber-100',
      'text-amber-600'
    ]

  }


  return [
    'bg-sky-50',
    'border-sky-100',
    'text-sky-600'
  ]

})

</script>


<style scoped>

.stat-card {

  @apply bg-white
  rounded-2xl
  border border-slate-200/70
  p-4 md:p-5
  flex items-center gap-3
  transition-all duration-300;

}

.attendance-view-card {
  width: 100%;
  text-align: right;
  cursor: pointer;
}

.aggregate-card { min-width: 0; }
.aggregate-value { color: #0f172a; font-size: 1.15rem; font-weight: 800; line-height: 1.4; white-space: nowrap; }

.attendance-view-card:focus-visible, .dialog-close:focus-visible, .retry-button:focus-visible {
  outline: 3px solid rgb(99 102 241 / 45%);
  outline-offset: 2px;
}

.attendance-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(15 23 42 / 55%);
}

.attendance-dialog {
  width: min(1180px, 100%);
  max-height: min(88vh, 860px);
  overflow: auto;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  background: white;
  box-shadow: 0 30px 80px rgb(15 23 42 / 30%);
}

.attendance-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin: -1.5rem -1.5rem 1.25rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(120deg, #f8fafc, #eef2ff);
}

.dialog-title-group { display: flex; align-items: center; gap: .85rem; }
.dialog-title-icon { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border-radius: .9rem; background: #e0e7ff; color: #4f46e5; font-size: 1.2rem; }
.attendance-dialog-header h2 { font-size: 1.15rem; font-weight: 800; color: #0f172a; }
.attendance-dialog-header p { margin-top: .3rem; font-size: .8rem; color: #64748b; }
.dialog-close { display: grid; width: 2.25rem; height: 2.25rem; place-items: center; border-radius: .7rem; background: white; color: #64748b; box-shadow: 0 1px 3px rgb(15 23 42 / 10%); }
.dialog-close:hover { background: #fee2e2; color: #b91c1c; }
.dialog-message { display: flex; min-height: 10rem; flex-direction: column; align-items: center; justify-content: center; gap: .65rem; padding: 2rem 1rem; text-align: center; color: #64748b; }
.dialog-message > i { font-size: 1.5rem; }
.error-message { color: #b91c1c; }
.retry-button { margin-top: .35rem; padding: .55rem 1rem; border-radius: .65rem; background: #4f46e5; color: white; font-weight: 600; }
.retry-button:hover { background: #4338ca; }
.attendance-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin-bottom: 1.25rem; }
.summary-item { display: flex; min-height: 5rem; flex-direction: column; justify-content: center; gap: .35rem; padding: .8rem 1rem; border: 1px solid #e2e8f0; border-radius: .9rem; background: #fff; }
.summary-item > span { color: #64748b; font-size: .75rem; }
.summary-item strong { color: #0f172a; font-size: 1.05rem; }
.summary-item small { color: #94a3b8; font-size: .7rem; font-weight: 500; }
.summary-rate { border-color: #c7d2fe; background: #eef2ff; }
.summary-rate strong { color: #4338ca; }
.summary-month { background: #f8fafc; }
.attendance-table-wrap { overflow: auto; border: 1px solid #e2e8f0; border-radius: .9rem; }
.attendance-table { width: 100%; min-width: 790px; border-collapse: separate; border-spacing: 0; font-size: .8rem; }
.attendance-table th, .attendance-table td { padding: .8rem .7rem; border-bottom: 1px solid #f1f5f9; text-align: right; white-space: nowrap; }
.attendance-table th { position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #475569; font-size: .72rem; font-weight: 700; }
.attendance-table tbody tr:last-child td { border-bottom: 0; }
.attendance-table tbody tr:hover { background: #fafbff; }
.attendance-table .attendance-weekend { background: #fffaf0; color: #64748b; }
.attendance-table .attendance-weekend:hover { background: #fff7e6; }
.day-name { display: block; color: #334155; font-weight: 700; }
.day-date { display: block; margin-top: .15rem; color: #94a3b8; font-size: .72rem; }
.status-pill { display: inline-flex; padding: .25rem .6rem; border-radius: 999px; font-size: .7rem; font-weight: 700; }
.status-workday { background: #ecfdf5; color: #047857; }
.status-holiday { background: #ffedd5; color: #c2410c; }
.overtime-value { color: #047857; font-weight: 700; }
.dialog-footnote { display: flex; align-items: center; gap: .4rem; margin-top: .85rem; color: #94a3b8; font-size: .72rem; }
.dialog-footnote i { color: #6366f1; }
.empty-message { min-height: 8rem; }

@media (max-width: 700px) {
  .attendance-dialog { padding: 1rem; border-radius: 1rem; }
  .attendance-dialog-header { margin: -1rem -1rem 1rem; padding: 1rem; }
  .attendance-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; }
  .summary-item { min-height: 4.5rem; padding: .65rem .75rem; }
}


.stat-card:hover {

  @apply border-indigo-100 shadow-md;

  transform:
      translateY(-2px);

}


.stat-icon {

  @apply w-11 h-11
  md:w-12 md:h-12
  rounded-xl
  border
  flex items-center
  justify-center
  flex-shrink-0
  transition-transform duration-300;

}


.stat-card:hover .stat-icon {

  transform:
      scale(1.06);

}


.stat-icon i {

  @apply text-lg md:text-xl;

}


/* ═══════════════════════════════════════
   ATTENDANCE
═══════════════════════════════════════ */

.attendance-time {

  @apply flex
  items-center
  gap-1
  text-base
  md:text-lg
  font-bold
  text-slate-800;

}


.attendance-count {

  @apply inline-flex
  items-center
  gap-1
  px-1.5
  py-0.5
  rounded-full
  bg-indigo-50
  text-indigo-600
  text-[9px]
  font-medium
  whitespace-nowrap;

}


.attendance-status {

  @apply inline-flex
  items-center
  gap-1
  px-1.5
  py-0.5
  rounded-full
  text-[9px]
  font-medium
  whitespace-nowrap;

}


.status-inside {

  @apply bg-emerald-50
  text-emerald-600;

}


.status-outside {

  @apply bg-amber-50
  text-amber-600;

}


.status-neutral {

  @apply bg-slate-50
  text-slate-500;

}


/* ═══════════════════════════════════════
   TEXT
═══════════════════════════════════════ */

.stat-label {

  @apply text-xs
  text-slate-500
  mb-1;

}


.stat-value {

  @apply text-xl md:text-2xl
  font-bold
  text-slate-800
  tracking-tight;

}


.stat-meta {

  @apply text-[10px]
  md:text-[11px]
  text-slate-400
  mt-0.5;

}


/* ═══════════════════════════════════════
   SKELETON
═══════════════════════════════════════ */

.stat-icon-skeleton {

  @apply w-11 h-11
  md:w-12 md:h-12
  rounded-xl
  bg-slate-200
  flex-shrink-0
  relative
  overflow-hidden;

}


.stat-icon-skeleton::after {

  content: '';

  @apply absolute inset-0;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgb(255 255 255 / 60%),
          transparent
      );

  animation:
      skeleton-shimmer 1.5s infinite;

}


.skeleton {

  @apply relative
  overflow-hidden
  rounded-md
  bg-slate-200/70;

}


.skeleton::after {

  content: '';

  @apply absolute inset-0;

  background:
      linear-gradient(
          90deg,
          transparent,
          rgb(255 255 255 / 60%),
          transparent
      );

  transform:
      translateX(-100%);

  animation:
      skeleton-shimmer 1.5s infinite;

}


@keyframes skeleton-shimmer {

  100% {

    transform:
        translateX(100%);

  }

}

</style>
