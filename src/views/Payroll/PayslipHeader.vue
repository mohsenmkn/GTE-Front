<!-- resources/js/Modules/Payroll/Components/PayslipHeader.vue -->
<template>
  <div class="ph">
    <div class="ph__name">
      <span class="ph__avatar" aria-hidden="true">
        <i class="pi pi-user"></i>
      </span>
      <div class="ph__name-text">
        <span class="ph__label">نام و نام خانوادگی</span>
        <strong class="ph__employee">{{ payslip.employee_name }}</strong>
      </div>
    </div>

    <dl class="ph__fields">
      <div class="ph__field">
        <dt>کد پرسنلی</dt>
        <dd>{{ formatPlain(payslip.personnel_code) }}</dd>
      </div>
      <div class="ph__field">
        <dt>کد ملی</dt>
        <dd>{{ formatPlain(payslip.national_id) }}</dd>
      </div>
      <div v-if="payslip.father_name" class="ph__field">
        <dt>نام پدر</dt>
        <dd>{{ payslip.father_name }}</dd>
      </div>
      <div class="ph__field">
        <dt>دوره</dt>
        <dd>{{ formatYearMonth(payslip.year_month) }}</dd>
      </div>
      <div class="ph__field">
        <dt>روزهای کارکرد</dt>
        <dd>{{ formatPlain(payslip.summary.effective_days) }} روز</dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { useFormatter } from '@/composables/useFormatter.js';

const { formatPlain, formatYearMonth } = useFormatter();

defineProps({
  payslip: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.ph {
  --c-border: var(--ps-border, var(--surface-border, #e4e7ee));
  --c-ground: var(--ps-ground, var(--surface-ground, #f3f4f7));
  --c-text: var(--ps-text, var(--text-color, #1b2233));
  --c-muted: var(--ps-muted, var(--text-color-secondary, #667085));

  display: grid;
  grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  align-items: center;
  gap: 1.5rem 2rem;
  padding: 1.25rem 1.5rem;
  background: var(--c-ground);
  border: 1px solid var(--c-border);
  border-radius: 16px;
}

/* نام کارمند */
.ph__name {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 0;
}

.ph__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #14213d;
  color: #d9b865;
  font-size: 1.2rem;
}

.ph__name-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ph__label {
  font-size: 0.8rem;
  color: var(--c-muted);
}

.ph__employee {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.5;
  color: var(--c-text);
}

/* سایر مشخصات */
.ph__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 1rem 1.5rem;
  margin: 0;
  padding-inline-start: 2rem;
  border-inline-start: 1px solid var(--c-border);
}

.ph__field {
  min-width: 0;
}

.ph__field dt {
  font-size: 0.8rem;
  color: var(--c-muted);
}

.ph__field dd {
  margin: 0.125rem 0 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--c-text);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

@media (max-width: 1023px) {
  .ph {
    grid-template-columns: minmax(0, 1fr);
  }
  .ph__fields {
    padding-inline-start: 0;
    border-inline-start: 0;
    padding-top: 1rem;
    border-top: 1px solid var(--c-border);
  }
}
</style>