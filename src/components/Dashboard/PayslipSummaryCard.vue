<template>
  <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">

    <!-- ═══════════════════════════════════════════
         HEADER
         ═══════════════════════════════════════════ -->
    <div class="bg-gradient-to-br from-slate-50 to-gray-50 border-b border-slate-200/60 p-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <i class="pi pi-money-bill text-emerald-600 text-lg"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-base">فیش حقوقی</h3>
            <p class="text-slate-500 text-xs mt-0.5">{{ monthLabel }}</p>
          </div>
        </div>
        <router-link
            v-if="payslip"
            :to="{ name: 'payroll.payslip' }"
            class="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
        >
          مشاهده جزئیات
        </router-link>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <div v-if="loading" class="space-y-3">
        <div class="h-4 bg-slate-100 rounded animate-pulse"></div>
        <div class="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
        <div class="h-4 bg-slate-100 rounded animate-pulse w-1/2"></div>
      </div>

      <div v-else-if="!payslip" class="text-center py-6">
        <i class="pi pi-inbox text-4xl text-slate-300 mb-3"></i>
        <p class="text-slate-500 text-sm">فیش حقوقی یافت نشد</p>
      </div>

      <div v-else class="space-y-1">
        <div class="flex items-center justify-between py-2.5 border-b border-slate-100">
          <span class="text-sm text-slate-500 flex items-center gap-2">
            <i class="pi pi-plus-circle text-emerald-500"></i>
            مزایا
          </span>
          <span class="font-bold text-emerald-600">{{ formatCurrency(payslip.TotalBenefits) }}</span>
        </div>
        <div class="flex items-center justify-between py-2.5 border-b border-slate-100">
          <span class="text-sm text-slate-500 flex items-center gap-2">
            <i class="pi pi-minus-circle text-red-500"></i>
            کسورات
          </span>
          <span class="font-bold text-red-600">{{ formatCurrency(payslip.TotalDeductions) }}</span>
        </div>
        <div class="flex items-center justify-between py-3 bg-gradient-to-l from-indigo-50/70 to-purple-50/70 rounded-xl px-4 border border-indigo-100 mt-2">
          <span class="text-sm font-bold text-slate-700 flex items-center gap-2">
            <i class="pi pi-wallet text-indigo-600"></i>
            خالص پرداختی
          </span>
          <span class="font-bold text-xl text-indigo-700">{{ formatCurrency(payslip.NetPay) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  payslip: { type: Object, default: null },
  month: { type: [Number, String], default: null },
  loading: { type: Boolean, default: false }
})

const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

const monthLabel = computed(() => {
  if (!props.month) return 'بدون اطلاعات'
  const year = Math.floor(props.month / 100)
  const month = props.month % 100
  return `${persianMonths[month - 1] || ''} ${year}`
})

const formatCurrency = (value) => {
  if (!value) return '۰'
  return new Intl.NumberFormat('fa-IR').format(Math.round(value)) + ' ریال'
}
</script>