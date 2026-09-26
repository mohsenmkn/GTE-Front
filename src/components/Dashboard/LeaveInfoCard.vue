<template>
  <DashboardCard
      title="وضعیت مرخصی"
      :subtitle="headerSubtitle"
      icon="pi pi-calendar-minus"
      icon-class="bg-emerald-50 border-emerald-100 text-emerald-600"
  >

    <div v-if="loading" class="space-y-3">
      <div class="skeleton h-24"></div>
      <div class="skeleton h-10"></div>
      <div class="skeleton h-10"></div>
    </div>

    <template v-else>

      <!-- Balance -->
      <div
          class="rounded-2xl p-4
               bg-gradient-to-br
               from-emerald-50 to-teal-50
               border border-emerald-100"
      >

        <div class="flex items-start justify-between gap-3">

          <div>
            <p class="text-xs text-slate-500">
              مانده مرخصی استحقاقی
            </p>

            <div class="mt-1">
              <span class="text-2xl font-bold text-emerald-700">
                {{ formatDaysHuman(remainderDays) }}
              </span>
            </div>
          </div>

          <div
              class="w-9 h-9 rounded-xl
                   bg-white/70
                   flex items-center justify-center"
          >
            <i class="pi pi-check-circle text-emerald-600"></i>
          </div>

        </div>

        <div class="mt-4">
          <div class="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div
                class="h-full bg-emerald-500 rounded-full
                     transition-all duration-700"
                :style="{ width: `${remainderPercentage}%` }"
            ></div>
          </div>
        </div>

        <div class="flex justify-between mt-2">
          <span class="text-[10px] text-slate-400">
            استفاده شده
          </span>

          <span class="text-[10px] text-slate-400">
            {{ faNum(entitledDays) }} روز استحقاق
          </span>
        </div>

      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 mt-4">

        <div class="mini-stat">
          <span class="mini-stat-icon bg-amber-50 text-amber-600">
            <i class="pi pi-calendar"></i>
          </span>

          <div>
            <span class="mini-stat-label">
              این ماه
            </span>

            <strong class="text-amber-600">
              {{ faNum(usedMonth) }}
            </strong>

            <small>روز</small>
          </div>
        </div>

        <div class="mini-stat">
          <span class="mini-stat-icon bg-blue-50 text-blue-600">
            <i class="pi pi-chart-bar"></i>
          </span>

          <div>
            <span class="mini-stat-label">
              امسال
            </span>

            <strong class="text-blue-600">
              {{ faNum(usedYear) }}
            </strong>

            <small>روز</small>
          </div>
        </div>

      </div>

      <!-- Recent -->
      <div
          v-if="recentLeaves.length"
          class="mt-5 pt-4 border-t border-slate-100"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-bold text-slate-700">
            مرخصی‌های اخیر
          </h4>

          <span class="text-[10px] text-slate-400">
            {{ recentLeaves.length }} مورد
          </span>
        </div>

        <div class="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">

          <div
              v-for="leave in recentLeaves"
              :key="leave.LeaveRequestID"
              class="leave-item"
          >
            <div class="min-w-0">
              <p class="text-xs font-semibold text-slate-700 truncate">
                {{ leave.LeaveTypeName }}
              </p>

              <p class="text-[10px] text-slate-400 mt-1">
                {{ formatDate(leaveStart(leave)) }}
                تا
                {{ formatDate(leaveEnd(leave)) }}
              </p>
            </div>

            <span class="text-xs font-bold text-indigo-600">
              {{ faNum(leaveDays(leave)) }}
              روز
            </span>
          </div>

        </div>
      </div>

      <div
          v-else
          class="text-center py-5"
      >
        <i class="pi pi-calendar text-2xl text-slate-300"></i>

        <p class="text-xs text-slate-400 mt-2">
          مرخصی ثبت‌شده‌ای وجود ندارد
        </p>
      </div>

    </template>

  </DashboardCard>
</template>

<script setup>
import { computed } from 'vue'
import DashboardCard from '@/views/Dashboard/DashboardCard.vue'

const props = defineProps({
  leaveData: {
    type: Object,
    default: () => ({})
  },

  loading: {
    type: Boolean,
    default: false
  }
})

const summary = computed(() => props.leaveData?.summary || {})

const recentLeaves = computed(() =>
    props.leaveData?.used_leaves_current_month || []
)

const remainderDays = computed(() =>
    summary.value.current_remainder_days ??
    summary.value.total_remainder_days ??
    0
)

const entitledDays = computed(() =>
    summary.value.total_entitled_days ?? 0
)

const usedYear = computed(() =>
    summary.value.used_days_this_year ??
    summary.value.total_used_days_year ??
    summary.value.total_used_days ??
    0
)

const usedMonth = computed(() =>
    summary.value.used_days_this_month ?? 0
)

const currentYear = computed(() =>
    new Date().toLocaleDateString('fa-IR', {
      year: 'numeric'
    })
)

const headerSubtitle = computed(() => {
  if (summary.value.processed_month_name) {
    return `تا پایان ${summary.value.processed_month_name} ${summary.value.processed_year}`
  }

  return `سال ${currentYear.value}`
})

const remainderPercentage = computed(() => {
  if (!entitledDays.value) return 0

  return Math.min(
      (remainderDays.value / entitledDays.value) * 100,
      100
  )
})

const formatDaysHuman = (days) => {
  const total = Math.round((Number(days) || 0) * 440)

  const d = Math.floor(total / 440)
  const rest = total % 440
  const h = Math.floor(rest / 60)
  const m = rest % 60

  const fa = n => n.toLocaleString('fa-IR')

  const parts = []

  if (d) parts.push(`${fa(d)} روز`)
  if (h) parts.push(`${fa(h)} ساعت`)
  if (m) parts.push(`${fa(m)} دقیقه`)

  return parts.join(' و ') || '۰ روز'
}

const faNum = value => {
  return Number(value ?? 0).toLocaleString('fa-IR', {
    maximumFractionDigits: 2
  })
}

const leaveDays = leave =>
    leave.DaysCountInMonth ??
    leave.DaysCount ??
    0

const leaveStart = leave =>
    leave.FromDateTime ??
    leave.StartDate

const leaveEnd = leave =>
    leave.ToDateTime ??
    leave.EndDate

const formatDate = dateString => {
  if (!dateString) return ''

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.mini-stat {
  @apply flex items-center gap-2
  rounded-xl border border-slate-100
  bg-slate-50/60 p-3;
}

.mini-stat-icon {
  @apply w-8 h-8 rounded-lg
  flex items-center justify-center
  flex-shrink-0;
}

.mini-stat-label {
  @apply block text-[10px] text-slate-400 mb-0.5;
}

.mini-stat strong {
  @apply text-sm font-bold;
}

.mini-stat small {
  @apply text-[9px] text-slate-400 mr-1;
}

.leave-item {
  @apply flex items-center justify-between gap-3
  p-3 rounded-xl
  bg-slate-50/60 border border-slate-100
  transition-colors;
}

.leave-item:hover {
  @apply bg-indigo-50/40 border-indigo-100;
}

.skeleton {
  @apply bg-slate-100 rounded-xl animate-pulse;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
</style>