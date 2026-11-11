<!-- resources/js/Modules/Payroll/Views/PayslipShow.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';

import MonthSelector from './MonthSelector.vue';
import PayslipHeader from './PayslipHeader.vue';
import PayslipItems from './PayslipItems.vue';
import PayslipSummary from './PayslipSummary.vue';

import { usePayroll } from '@/composables/usePayroll.js';
import { usePayslipPrint } from '@/composables/usePayslipPrint.js';

const toast = useToast();
const { printPayslip } = usePayslipPrint();

const {
  months,
  payslip,
  loading,
  error,
  selectedMonth,
  loadMonths,
  changeMonth,
} = usePayroll();

// فقط ۶ ماه اخیر (جدیدترین‌ها)
const recentMonths = computed(() => {
  if (!months.value || months.value.length === 0) return [];
  return months.value.slice(0, 6);
});

const netPayFormatted = computed(() =>
    Number(payslip.value?.summary?.net_pay ?? 0).toLocaleString('fa-IR')
);

const selectorRef = ref(null);

const scrollToSelector = () => {
  selectorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const retry = () => {
  if (selectedMonth.value) {
    changeMonth(selectedMonth.value);
  } else {
    loadMonths();
  }
};

const handlePrint = () => {
  if (!payslip.value) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'فیش حقوقی برای چاپ آماده نیست',
      life: 3000,
    });
    return;
  }
  printPayslip(payslip.value);

  toast.add({
    severity: 'success',
    summary: 'موفق',
    detail: 'در حال آماده‌سازی چاپ...',
    life: 2000,
  });
};

onMounted(() => {
  loadMonths();
});
</script>

<template>
  <div class="ps" dir="rtl">
    <!-- عنوان صفحه -->
    <header class="ps-top no-print">
      <div class="ps-top__title">
        <h1>فیش حقوقی</h1>
        <p>مشاهده و چاپ فیش حقوقی ماهانه</p>
      </div>

      <Button
          v-if="payslip && !error"
          label="چاپ فیش"
          icon="pi pi-print"
          class="ps-top__print"
          @click="handlePrint"
      />
    </header>

    <!-- انتخاب ماه -->
    <section ref="selectorRef" class="ps-months no-print" aria-label="انتخاب ماه">
      <MonthSelector
          v-model="selectedMonth"
          :months="recentMonths"
          @update:modelValue="changeMonth"
      />
    </section>

    <Transition name="ps-fade" mode="out-in">
      <!-- بارگذاری -->
      <div
          v-if="loading && !payslip"
          key="loading"
          class="sheet sheet--loading"
          role="status"
          aria-live="polite"
      >
        <Skeleton class="sk-hero" />
        <div class="sk-body">
          <Skeleton class="sk-row sk-row--info" />
          <Skeleton class="sk-row sk-row--summary" />
          <Skeleton class="sk-row sk-row--items" />
        </div>
        <span class="sr-only">در حال بارگذاری فیش حقوقی...</span>
      </div>

      <!-- خطا -->
      <div v-else-if="error" key="error" class="ps-state">
        <Message severity="error" :closable="false" class="ps-state__msg">
          <div class="ps-state__row">
            <i class="pi pi-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>
        </Message>
        <Button
            label="تلاش دوباره"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="retry"
        />
      </div>

      <!-- فیش حقوقی -->
      <article v-else-if="payslip" key="payslip" class="sheet">
        <!-- بخش اصلی: خالص پرداختی -->
        <section class="hero" aria-label="خالص پرداختی">
          <div class="hero__main">
            <span class="hero__label">خالص پرداختی</span>
            <div class="hero__amount">
              <span class="hero__value">{{ netPayFormatted }}</span>
              <span class="hero__currency">ریال</span>
            </div>
          </div>

          <span class="hero__month">
            <i class="pi pi-calendar" aria-hidden="true"></i>
            {{ payslip.year_month_label }}
          </span>
        </section>

        <!-- خط برش فیش -->
        <div class="tear" aria-hidden="true"></div>

        <div class="body">
          <section class="block">
            <PayslipHeader :payslip="payslip" />
          </section>

          <section class="block">
            <h2 class="block__title">خلاصه وضعیت</h2>
            <PayslipSummary :summary="payslip.summary" />
          </section>

          <!-- PayslipItems عنوان خودش را دارد؛ عنوان تکراری اضافه نمی‌شود -->
          <section class="block block__scroll">
            <PayslipItems
                :grouped-items="payslip.items"
                :summary="payslip.summary"
            />
          </section>
        </div>
      </article>

      <!-- خالی -->
      <div v-else-if="!loading" key="empty" class="ps-state ps-state--empty">
        <span class="ps-state__icon" aria-hidden="true">
          <i class="pi pi-inbox"></i>
        </span>
        <h2>فیش حقوقی یافت نشد</h2>
        <p>برای ماه انتخاب‌شده فیشی ثبت نشده است. ماه دیگری را انتخاب کنید.</p>
        <Button
            label="انتخاب ماه دیگر"
            icon="pi pi-calendar"
            severity="secondary"
            outlined
            @click="scrollToSelector"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ───────────── توکن‌ها ─────────────
   رنگ‌های سطح و متن از تم PrimeVue می‌آیند (سازگار با حالت تاریک)،
   رنگ‌های برند (سرمه‌ای و طلایی) ثابت‌اند. */
.ps {
  --ps-ground: var(--surface-ground, #f3f4f7);
  --ps-surface: var(--surface-card, #ffffff);
  --ps-border: var(--surface-border, #e4e7ee);
  --ps-text: var(--text-color, #1b2233);
  --ps-muted: var(--text-color-secondary, #667085);

  --ps-ink: #14213d;
  --ps-ink-soft: #1f2f52;
  --ps-gold: #d9b865;
  --ps-paper: #f6f1e4;

  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
  background: var(--ps-ground);
  color: var(--ps-text);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

/* ───────────── عنوان صفحه ───────────── */
.ps-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.ps-top h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.4;
}

.ps-top p {
  margin: 0.125rem 0 0;
  font-size: 0.95rem;
  color: var(--ps-muted);
}

.ps-top__print {
  background: var(--ps-ink);
  border-color: var(--ps-ink);
  color: var(--ps-paper);
}

.ps-top__print:hover {
  background: var(--ps-ink-soft) !important;
  border-color: var(--ps-ink-soft) !important;
  color: #fff !important;
}

.ps-months {
  margin-bottom: 1.5rem;
}

/* ───────────── برگه فیش ───────────── */
.sheet {
  position: relative;
  border-radius: 20px;
  background: var(--ps-surface);
  border: 1px solid var(--ps-border);
  box-shadow:
      0 1px 2px rgba(20, 33, 61, 0.06),
      0 18px 40px -18px rgba(20, 33, 61, 0.28);
}

/* ───────────── بخش خالص پرداختی ───────────── */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.75rem 2.25rem 2.25rem;
  border-radius: 19px 19px 0 0;
  background: var(--ps-ink);
  color: var(--ps-paper);
}

/* حلقه‌های ظریف تزئینی، تداعی‌کنندهٔ گیلوشِ اسناد رسمی */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
      repeating-radial-gradient(
          circle at 0% 120%,
          transparent 0 26px,
          rgba(217, 184, 101, 0.13) 26px 27px
      );
}

.hero__main,
.hero__month {
  position: relative;
}

.hero__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--ps-gold);
}

.hero__amount {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.hero__value {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.hero__currency {
  font-size: 1.1rem;
  opacity: 0.75;
}

.hero__month {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid rgba(217, 184, 101, 0.55);
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ps-gold);
  white-space: nowrap;
}

/* ───────────── خط برش (نشان‌دهندهٔ ظاهر فیش) ───────────── */
.tear {
  position: relative;
  height: 0;
  z-index: 1;
}

.tear::before,
.tear::after {
  content: '';
  position: absolute;
  top: -13px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ps-ground);
  box-shadow: inset 0 0 0 1px var(--ps-border);
}

.tear::before { right: -14px; }
.tear::after { left: -14px; }

/* ───────────── بدنه: تک‌ستونه و تمام‌عرض ─────────────
   خلاصه (۳ کارت کنار هم) و جدول اقلام به عرض کامل نیاز دارند. */
.body {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2.25rem 2.25rem 2.5rem;
}

.block {
  min-width: 0;
}

.block__title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--ps-text);
}

.block__title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ps-border);
}

.block__scroll {
  overflow-x: auto;
}

/* ───────────── اسکلت بارگذاری ───────────── */
.sheet--loading {
  overflow: hidden;
}

.sk-hero {
  height: 150px !important;
  border-radius: 0 !important;
}

.sk-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2.25rem;
}

.sk-row { border-radius: 12px !important; }
.sk-row--info { height: 110px !important; }
.sk-row--summary { height: 150px !important; }
.sk-row--items { height: 280px !important; }

/* ───────────── خطا و حالت خالی ───────────── */
.ps-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}

.ps-state__msg { width: 100%; }

.ps-state__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: start;
}

.ps-state--empty {
  padding: 4rem 1rem;
  border: 1px dashed var(--ps-border);
  border-radius: 20px;
  background: var(--ps-surface);
}

.ps-state__icon {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--ps-ground);
  border: 1px solid var(--ps-border);
  color: var(--ps-muted);
  font-size: 2.1rem;
}

.ps-state h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.ps-state p {
  margin: 0;
  max-width: 28rem;
  line-height: 1.9;
  color: var(--ps-muted);
}

/* ───────────── انتقال ───────────── */
.ps-fade-enter-active,
.ps-fade-leave-active {
  transition: opacity 0.2s ease;
}

.ps-fade-enter-from,
.ps-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ps-fade-enter-active,
  .ps-fade-leave-active {
    transition: none;
  }
}

/* ───────────── عرض‌های کوچک‌تر از دسکتاپ: فقط جلوگیری از به‌هم‌ریختگی ───────────── */
@media (max-width: 1023px) {
  .ps { padding: 1rem 1rem 2rem; }
  .hero { flex-direction: column-reverse; align-items: flex-start; padding: 1.5rem; }
  .hero__value { font-size: 2.25rem; }
  .body,
  .sk-body { padding: 1.25rem; }
}

/* ───────────── چاپ ───────────── */
@media print {
  .no-print,
  .tear {
    display: none !important;
  }

  .ps { padding: 0; max-width: none; background: #fff; }

  .sheet {
    border: 1px solid #999;
    box-shadow: none;
    border-radius: 0;
  }

  .hero {
    background: #fff;
    color: #000;
    border-radius: 0;
    border-bottom: 2px solid #000;
  }

  .hero::before { display: none; }
  .hero__label,
  .hero__month { color: #000; border-color: #000; }

  .body { padding: 1rem; }
  .block { break-inside: avoid; }
}
</style>