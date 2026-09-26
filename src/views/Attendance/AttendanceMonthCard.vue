<template>
  <div
      class="bg-white rounded-2xl border border-slate-200/70 shadow-sm
           overflow-hidden hover:shadow-md transition-shadow duration-300"
  >
    <!-- Header -->
    <div
        class="bg-gradient-to-br from-slate-50 to-gray-50
             border-b border-slate-200/60 p-5"
    >
      <div class="flex items-center justify-between gap-3">

        <!-- عنوان -->
        <div class="flex items-center gap-3 min-w-0">

          <div
              class="w-10 h-10 rounded-xl flex items-center justify-center
                   border flex-shrink-0"
              :class="monthHeaderClass"
          >
            <i
                :class="[monthIcon, monthColor]"
                class="text-lg"
            ></i>
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-slate-800 text-base">
                {{ summary.month_title }}
              </h3>

              <span
                  class="inline-flex items-center px-2 py-0.5
                       rounded-md bg-slate-100 border border-slate-200
                       text-[10px] font-medium text-slate-500"
              >
                {{ summary.month_key }}
              </span>
            </div>

            <p class="text-slate-500 text-xs mt-0.5">
              خلاصه وضعیت تردد
            </p>
          </div>
        </div>

        <!-- نرخ حضور -->
        <div
            class="flex flex-col items-center justify-center
                 min-w-[54px] px-2 py-1.5 rounded-xl"
            :class="attendanceRateClass"
        >
          <span class="text-sm font-bold leading-none">
            {{ summary.attendance_rate }}%
          </span>

          <span class="text-[9px] mt-1 opacity-70">
            حضور
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-5">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div
              v-for="i in 4"
              :key="i"
              class="h-20 bg-slate-100 rounded-xl animate-pulse"
          ></div>
        </div>

        <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
        <div class="h-10 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    </div>

    <!-- Error -->
    <div
        v-else-if="error"
        class="p-6 text-center"
    >
      <div
          class="w-12 h-12 mx-auto mb-3 rounded-xl
               bg-red-50 border border-red-100
               flex items-center justify-center"
      >
        <i class="pi pi-exclamation-triangle text-red-500 text-xl"></i>
      </div>

      <p class="text-sm text-red-600">
        {{ error }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="p-5">

      <!-- آمار روزها -->
      <div class="grid grid-cols-2 gap-3">

        <!-- حضور -->
        <div
            class="group p-3 rounded-xl
                 bg-emerald-50/70 border border-emerald-100
                 hover:border-emerald-200 hover:bg-emerald-50
                 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div
                class="w-8 h-8 rounded-lg bg-white/70
                     flex items-center justify-center"
            >
              <i class="pi pi-check-circle text-emerald-600"></i>
            </div>

            <span class="text-xl font-bold text-emerald-700">
              {{ days.presence }}
            </span>
          </div>

          <div class="text-xs text-slate-500 mt-2">
            حضور
          </div>
        </div>

        <!-- غیبت -->
        <div
            class="group p-3 rounded-xl
                 bg-red-50/70 border border-red-100
                 hover:border-red-200 hover:bg-red-50
                 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div
                class="w-8 h-8 rounded-lg bg-white/70
                     flex items-center justify-center"
            >
              <i class="pi pi-times-circle text-red-600"></i>
            </div>

            <span class="text-xl font-bold text-red-700">
              {{ days.absence }}
            </span>
          </div>

          <div class="text-xs text-slate-500 mt-2">
            غیبت
          </div>
        </div>

        <!-- مرخصی -->
        <div
            class="group p-3 rounded-xl
                 bg-amber-50/70 border border-amber-100
                 hover:border-amber-200 hover:bg-amber-50
                 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div
                class="w-8 h-8 rounded-lg bg-white/70
                     flex items-center justify-center"
            >
              <i class="pi pi-calendar-minus text-amber-600"></i>
            </div>

            <span class="text-xl font-bold text-amber-700">
              {{ days.leave }}
            </span>
          </div>

          <div class="text-xs text-slate-500 mt-2">
            مرخصی
          </div>
        </div>

        <!-- مأموریت -->
        <div
            class="group p-3 rounded-xl
                 bg-blue-50/70 border border-blue-100
                 hover:border-blue-200 hover:bg-blue-50
                 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div
                class="w-8 h-8 rounded-lg bg-white/70
                     flex items-center justify-center"
            >
              <i class="pi pi-briefcase text-blue-600"></i>
            </div>

            <span class="text-xl font-bold text-blue-700">
              {{ days.mission }}
            </span>
          </div>

          <div class="text-xs text-slate-500 mt-2">
            مأموریت
          </div>
        </div>

      </div>

      <!-- زمان‌ها -->
      <div class="mt-5 pt-4 border-t border-slate-100 space-y-2">

        <!-- اضافه کاری -->
        <div
            class="flex items-center justify-between
                 py-2.5 px-3 rounded-xl
                 bg-slate-50/70 border border-slate-100
                 hover:bg-emerald-50/40 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span
                class="w-8 h-8 rounded-lg bg-emerald-50
                     flex items-center justify-center"
            >
              <i class="pi pi-arrow-up text-emerald-600"></i>
            </span>

            <span class="text-sm text-slate-500">
              {{ overtimeLabel }}
            </span>
          </div>

          <span class="font-mono font-bold text-emerald-700 text-sm">
            {{ time.overtime_formatted }}
          </span>
        </div>

        <!-- کسر حضور -->
        <div
            class="flex items-center justify-between
                 py-2.5 px-3 rounded-xl
                 bg-slate-50/70 border border-slate-100
                 hover:bg-red-50/40 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span
                class="w-8 h-8 rounded-lg bg-red-50
                     flex items-center justify-center"
            >
              <i class="pi pi-arrow-down text-red-600"></i>
            </span>

            <span class="text-sm text-slate-500">
              کسر حضور
            </span>
          </div>

          <span class="font-mono font-bold text-red-700 text-sm">
            {{ time.shortage_formatted }}
          </span>
        </div>

        <!-- تاخیر -->
        <div
            v-if="time.late_minutes > 0"
            class="flex items-center justify-between
                 py-2.5 px-3 rounded-xl
                 bg-slate-50/70 border border-slate-100
                 hover:bg-amber-50/40 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span
                class="w-8 h-8 rounded-lg bg-amber-50
                     flex items-center justify-center"
            >
              <i class="pi pi-clock text-amber-600"></i>
            </span>

            <span class="text-sm text-slate-500">
              تأخیر
            </span>
          </div>

          <span class="font-mono font-bold text-amber-700 text-sm">
            {{ time.late_formatted }}
          </span>
        </div>

      </div>

      <!-- نرخ حضور -->
      <div class="mt-5">

        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-slate-500">
            نرخ حضور
          </span>

          <span
              class="text-xs font-bold"
              :class="attendanceTextClass"
          >
            {{ summary.attendance_rate }}%
          </span>
        </div>

        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
              class="h-full rounded-full transition-all duration-700"
              :class="attendanceBarClass"
              :style="{
              width: `${Math.min(
                Math.max(Number(summary.attendance_rate) || 0,
                0),
                100
              )}%`
            }"
          ></div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
})

const days = computed(() => {
  if (props.summary?.days) return props.summary.days

  return {
    presence: props.summary?.presence_days || 0,
    absence: props.summary?.absence_days || 0,
    leave: props.summary?.leave_days || 0,
    mission: props.summary?.mission_days || 0,
    holiday: props.summary?.holiday_days || 0,
    rest: props.summary?.rest_days || 0,
    work: props.summary?.work_days || 0,
    total: props.summary?.total_days || 0,
  }
})

const time = computed(() => {
  if (props.summary?.time) return props.summary.time

  return {
    overtime_formatted:
        props.summary?.overtime_formatted || '00:00',

    shortage_formatted:
        props.summary?.shortage_formatted || '00:00',

    late_formatted:
        props.summary?.late_formatted || '00:00',

    late_minutes:
        props.summary?.total_late_minutes || 0,
  }
})

const attendanceRate = computed(() => {
  return Number(props.summary?.attendance_rate) || 0
})

const attendanceSeverity = computed(() => {
  const rate = attendanceRate.value

  if (rate >= 90) return 'success'
  if (rate >= 75) return 'warning'

  return 'danger'
})

const attendanceRateClass = computed(() => {
  const classes = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    danger: 'bg-red-50 border-red-100 text-red-700',
  }

  return classes[attendanceSeverity.value]
})

const attendanceTextClass = computed(() => {
  const classes = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }

  return classes[attendanceSeverity.value]
})

const attendanceBarClass = computed(() => {
  const classes = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  }

  return classes[attendanceSeverity.value]
})

const monthIcon = computed(() => {
  return props.summary?.month_title === 'ماه جاری'
      ? 'pi pi-calendar'
      : 'pi pi-history'
})

const monthColor = computed(() => {
  return props.summary?.month_title === 'ماه جاری'
      ? 'text-indigo-600'
      : 'text-slate-500'
})

const monthHeaderClass = computed(() => {
  return props.summary?.month_title === 'ماه جاری'
      ? 'bg-indigo-50 border-indigo-100'
      : 'bg-slate-100 border-slate-200'
})

const overtimeLabel = computed(() => {
  return props.summary?.month_title === 'ماه جاری'
      ? 'اضافه کاری'
      : 'اضافه کاری / تعطیل کاری'
})
</script>