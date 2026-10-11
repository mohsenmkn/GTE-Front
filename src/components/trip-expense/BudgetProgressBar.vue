<!-- src/components/trip-expense/BudgetProgressBar.vue -->

<template>
  <div v-if="limitInfo" class="space-y-2">
    <div class="flex items-center justify-between text-xs">
      <span class="font-semibold text-slate-700">{{ title }}</span>
      <span class="font-mono dir-ltr text-slate-500">
                {{ formatMoney(limitInfo.used) }} / {{ formatMoney(limitInfo.limit) }}
            </span>
    </div>
    <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressColor"
          :style="{ width: `${Math.min(percentage, 100)}%` }"
      ></div>
    </div>
    <div class="flex items-center justify-between text-[10px]">
            <span :class="remainingColor" class="font-medium">
                باقی‌مانده: {{ formatMoney(limitInfo.remaining) }}
            </span>
      <span class="font-mono dir-ltr text-slate-400">{{ percentage }}%</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: 'سقف' },
  limitInfo: {
    type: Object,
    default: null,
    // { limit, used, remaining }
  },
})

const percentage = computed(() => {
  if (!props.limitInfo || !props.limitInfo.limit) return 0
  return Math.round((props.limitInfo.used / props.limitInfo.limit) * 100)
})

const progressColor = computed(() => {
  if (percentage.value >= 100) return 'bg-rose-500'
  if (percentage.value >= 80) return 'bg-amber-500'
  if (percentage.value >= 50) return 'bg-violet-500'
  return 'bg-emerald-500'
})

const remainingColor = computed(() => {
  if (percentage.value >= 100) return 'text-rose-600'
  if (percentage.value >= 80) return 'text-amber-600'
  return 'text-emerald-600'
})

const formatMoney = (value) => {
  if (value === null || value === undefined) return '-'
  return Number(value).toLocaleString('fa-IR') + ' تومان'
}
</script>