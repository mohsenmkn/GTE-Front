<!-- resources/js/Modules/Payroll/Components/PayslipItems.vue -->
<template>
  <section class="pit">
    <h2 class="pit__title">ریز اقلام حقوقی</h2>

    <div class="pit__scroll">
      <table class="pit__table">
        <thead>
        <tr>
          <th class="col col--work">
            <i class="pi pi-clock" aria-hidden="true"></i>
            کارکرد
          </th>
          <th class="col col--benefit">
            <i class="pi pi-arrow-up" aria-hidden="true"></i>
            مزایا
          </th>
          <th class="col col--deduction">
            <i class="pi pi-arrow-down" aria-hidden="true"></i>
            کسورات
          </th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="row in tableRows" :key="row.index">
          <td class="col col--work">
            <div v-if="row.work" class="cell">
              <span class="cell__title">{{ row.work.title }}</span>
              <span class="cell__amount">{{ formatNumber(row.work.amount) }}</span>
            </div>
          </td>

          <td class="col col--benefit">
            <div v-if="row.benefit" class="cell">
              <span class="cell__title">{{ row.benefit.title }}</span>
              <span class="cell__amount">{{ formatNumber(row.benefit.amount) }}</span>
            </div>
          </td>

          <td class="col col--deduction">
            <div v-if="row.deduction" class="cell">
              <span class="cell__title">{{ row.deduction.title }}</span>
              <span class="cell__amount">{{ formatNumber(row.deduction.amount) }}</span>
            </div>
          </td>
        </tr>
        </tbody>

        <tfoot>
        <tr>
          <td class="col col--work"></td>
          <td class="col col--benefit">
            <div class="cell cell--total">
              <span class="cell__title">جمع مزایا</span>
              <span class="cell__amount">{{ formatNumber(summary?.total_benefits || 0) }}</span>
            </div>
          </td>
          <td class="col col--deduction">
            <div class="cell cell--total">
              <span class="cell__title">جمع کسورات</span>
              <span class="cell__amount">{{ formatNumber(summary?.total_deductions || 0) }}</span>
            </div>
          </td>
        </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatter } from '@/composables/useFormatter.js';

const { formatNumber } = useFormatter();

const props = defineProps({
  groupedItems: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  summary: {
    type: Object,
    default: () => ({
      total_benefits: 0,
      total_deductions: 0,
      net_pay: 0,
      effective_days: 0,
    }),
  },
});

/**
 * تبدیل آیتم‌های گروه‌بندی‌شده به ردیف‌های جدول ۳ ستونه
 */
const tableRows = computed(() => {
  const workItems = props.groupedItems['کارکرد'] || [];
  const benefitItems = props.groupedItems['مزایا'] || [];
  const deductionItems = props.groupedItems['کسورات'] || [];

  const maxRows = Math.max(
      workItems.length,
      benefitItems.length,
      deductionItems.length
  );

  const rows = [];

  for (let i = 0; i < maxRows; i++) {
    rows.push({
      index: i,
      work: workItems[i] || null,
      benefit: benefitItems[i] || null,
      deduction: deductionItems[i] || null,
    });
  }

  return rows;
});
</script>

<style scoped>
.pit {
  --c-surface: var(--ps-surface, var(--surface-card, #ffffff));
  --c-ground: var(--ps-ground, var(--surface-ground, #f3f4f7));
  --c-border: var(--ps-border, var(--surface-border, #e4e7ee));
  --c-text: var(--ps-text, var(--text-color, #1b2233));
  --c-muted: var(--ps-muted, var(--text-color-secondary, #667085));

  --work: #6d28d9;
  --benefit: #15803d;
  --deduction: #b91c1c;

  direction: rtl;
}

/* عنوان بخش، هم‌سبک عنوان‌های صفحه */
.pit__title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--c-text);
}

.pit__title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--c-border);
}

.pit__scroll {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: 14px;
  background: var(--c-surface);
}

.pit__table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  table-layout: fixed;
}

/* جداکنندهٔ ستون‌ها */
.col + .col {
  border-inline-start: 1px solid var(--c-border);
}

/* سربرگ */
thead th {
  padding: 0.875rem 1rem;
  background: var(--c-ground);
  border-bottom: 1px solid var(--c-border);
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
}

thead th i {
  margin-inline-end: 0.375rem;
  font-size: 0.85rem;
}

th.col--work { color: var(--work); }
th.col--benefit { color: var(--benefit); }
th.col--deduction { color: var(--deduction); }

/* ردیف‌ها */
tbody td {
  padding: 0.625rem 1rem;
  vertical-align: top;
}

tbody tr + tr td {
  border-top: 1px solid color-mix(in srgb, var(--c-border) 55%, transparent);
}

tbody tr:hover td {
  background: color-mix(in srgb, var(--c-ground) 60%, transparent);
}

td.col--work { color: var(--work); }
td.col--benefit { color: var(--benefit); }
td.col--deduction { color: var(--deduction); }

.cell {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 1.75rem;
}

.cell__title {
  min-width: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--c-text);
}

.cell__amount {
  flex: none;
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ردیف جمع‌ها */
tfoot td {
  padding: 0.875rem 1rem;
  background: var(--c-ground);
  border-top: 2px solid var(--c-border);
}

.cell--total .cell__title {
  font-weight: 700;
  color: inherit;
}

.cell--total .cell__amount {
  font-size: 1.05rem;
  font-weight: 800;
}

@media print {
  .pit__scroll {
    overflow: visible;
    border-radius: 0;
  }
  .pit__table {
    min-width: 0;
  }
}
</style>