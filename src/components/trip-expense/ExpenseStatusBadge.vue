<!-- src/components/trip-expense/ExpenseStatusBadge.vue -->

<template>
    <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
        :class="config.bg + ' ' + config.text + ' ' + config.border"
    >
        <i :class="config.icon"></i>
        {{ config.label }}
    </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  exceeded: { type: Boolean, default: false },
})

const STATUS_CONFIG = {
  pending: {
    label: 'در انتظار تایید',
    icon: 'pi pi-clock',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-100',
  },
  approved: {
    label: 'تایید شده',
    icon: 'pi pi-check-circle',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  rejected: {
    label: 'رد شده',
    icon: 'pi pi-times-circle',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-100',
  },
}

const config = computed(() => {
  const base = STATUS_CONFIG[props.status] || {
    label: props.status,
    icon: 'pi pi-question',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  }

  // اگر از سقف تجاوز کرده و وضعیت pending است، رنگ را تغییر بده
  if (props.exceeded && props.status === 'pending') {
    return {
      label: 'تجاوز از سقف',
      icon: 'pi pi-exclamation-triangle',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    }
  }

  return base
})
</script>