<!-- resources/js/Modules/Payroll/Components/PayslipSummary.vue -->
<template>
  <div class="psum" :class="{ 'psum--three': showNet }">
    <!-- جمع مزایا -->
    <div class="psum__card psum__card--benefit">
      <span class="psum__icon" aria-hidden="true">
        <i class="pi pi-arrow-up"></i>
      </span>
      <div class="psum__body">
        <span class="psum__label">جمع کل مزایا</span>
        <strong class="psum__value">{{ formatCurrency(summary?.total_benefits || 0) }}</strong>
        <span class="psum__sub">{{ formatToToman(summary?.total_benefits || 0) }}</span>
      </div>
    </div>

    <!-- جمع کسورات -->
    <div class="psum__card psum__card--deduction">
      <span class="psum__icon" aria-hidden="true">
        <i class="pi pi-arrow-down"></i>
      </span>
      <div class="psum__body">
        <span class="psum__label">جمع کل کسورات</span>
        <strong class="psum__value">{{ formatCurrency(summary?.total_deductions || 0) }}</strong>
        <span class="psum__sub">{{ formatToToman(summary?.total_deductions || 0) }}</span>
      </div>
    </div>

    <!-- خالص پرداختی (به‌صورت پیش‌فرض مخفی است چون در بالای فیش نمایش داده می‌شود) -->
    <div v-if="showNet" class="psum__card psum__card--net">
      <span class="psum__icon" aria-hidden="true">
        <i class="pi pi-wallet"></i>
      </span>
      <div class="psum__body">
        <span class="psum__label">خالص پرداختی</span>
        <strong class="psum__value">{{ formatCurrency(summary?.net_pay || 0) }}</strong>
        <span class="psum__sub">{{ formatToToman(summary?.net_pay || 0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormatter } from '@/composables/useFormatter.js';

const { formatCurrency, formatToToman } = useFormatter();

defineProps({
  summary: {
    type: Object,
    default: () => ({
      total_benefits: 0,
      total_deductions: 0,
      net_pay: 0,
      effective_days: 0,
    }),
  },
  // نمایش کارت خالص پرداختی (پیش‌فرض: خیر)
  showNet: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.psum {
  --c-surface: var(--ps-surface, var(--surface-card, #ffffff));
  --c-border: var(--ps-border, var(--surface-border, #e4e7ee));
  --c-muted: var(--ps-muted, var(--text-color-secondary, #667085));

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.psum--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.psum__card {
  --accent: #15803d;
  --tint: rgba(21, 128, 61, 0.1);

  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.125rem 1.25rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 14px;
  overflow: hidden;
}

/* نوار رنگی کنار کارت */
.psum__card::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 4px;
  background: var(--accent);
}

.psum__card--deduction {
  --accent: #b91c1c;
  --tint: rgba(185, 28, 28, 0.1);
}

.psum__card--net {
  --accent: #14213d;
  --tint: rgba(20, 33, 61, 0.1);
}

.psum__icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--tint);
  color: var(--accent);
  font-size: 1.1rem;
}

.psum__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.psum__label {
  font-size: 0.875rem;
  color: var(--c-muted);
}

.psum__value {
  margin-top: 0.125rem;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1.4;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.psum__sub {
  font-size: 0.8rem;
  color: var(--c-muted);
}

@media (max-width: 1023px) {
  .psum,
  .psum--three {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>