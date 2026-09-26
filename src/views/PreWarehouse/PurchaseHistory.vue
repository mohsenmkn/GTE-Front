<template>
  <div class="p-6 space-y-5 animate-fade-in">
    <!-- ══════════════════════════════════════
         Header
    ═══════════════════════════════════════ -->
    <div class="flex justify-between items-start">
      <div>
        <Button
            icon="pi pi-arrow-right"
            label="بازگشت"
            severity="secondary"
            @click="$router.back()"
            class="mb-3"
        />
        <h1 class="text-2xl font-bold text-slate-800">
          تاریخچه خرید
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          خرید #{{ purchaseId }} - {{ purchaseTitle }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
            icon="pi pi-print"
            label="چاپ"
            severity="secondary"
            size="small"
            @click="printHistory"
        />
        <Button
            icon="pi pi-download"
            label="خروجی PDF"
            severity="secondary"
            size="small"
            @click="exportPdf"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Summary Card
    ═══════════════════════════════════════ -->
    <div class="page-card">
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <i class="pi pi-box text-blue-600"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500">کالا</p>
              <p class="font-bold text-slate-800 text-sm">
                {{ purchase?.item?.name || '-' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i class="pi pi-hashtag text-purple-600"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500">مقدار</p>
              <p class="font-bold text-slate-800 text-sm">
                {{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <i class="pi pi-building text-amber-600"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500">واحد هدف</p>
              <p class="font-bold text-slate-800 text-sm">
                {{ purchase?.target_unit?.title || '-' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                 :class="currentStatusColor.bg">
              <i :class="currentStatusColor.icon"></i>
            </div>
            <div>
              <p class="text-xs text-slate-500">وضعیت فعلی</p>
              <p class="font-bold text-sm" :class="currentStatusColor.text">
                {{ currentStatusColor.label }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Timeline
    ═══════════════════════════════════════ -->
    <div class="page-card">
      <div class="p-5 border-b border-slate-100 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <i class="pi pi-history text-slate-600"></i>
          <h2 class="font-bold text-slate-800">گردش کار خرید</h2>
        </div>
        <span class="text-xs text-slate-500">
                    {{ history.length }} رویداد ثبت شده
                </span>
      </div>

      <div class="p-6">
        <div v-if="loading" class="flex justify-center p-12">
          <ProgressSpinner />
        </div>

        <div v-else-if="!history.length" class="text-center py-12">
          <i class="pi pi-inbox text-5xl text-slate-300 mb-3"></i>
          <p class="text-slate-500">تاریخچه‌ای ثبت نشده است</p>
        </div>

        <Timeline
            v-else
            :value="sortedHistory"
            align="right"
            class="custom-timeline"

        >
          <template #content="slotProps">
            <div class="space-y-3">
              <!-- ═══ Header: Action + Date ═══ -->
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                                    <span
                                        class="px-3 py-1 rounded-lg text-xs font-bold"
                                        :class="getActionStyle(slotProps.item.action).bg"
                                    >
                                        {{ getActionStyle(slotProps.item.action).label }}
                                    </span>
                  <span class="text-sm text-slate-600 font-medium">
                                        {{ toJalali(slotProps.item.created_at) }}
                                    </span>
                  <span class="text-xs text-slate-400">
                                        ({{ timeAgo(slotProps.item.created_at) }})
                                    </span>
                </div>
              </div>

              <!-- ═══ User Info ═══ -->
              <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div class="flex items-center gap-3 mb-3">
                  <Avatar
                      :label="slotProps.item.user?.name?.charAt(0) || '?'"
                      size="small"
                      shape="circle"
                      :class="getActionStyle(slotProps.item.action).avatar"
                  />
                  <div>
                    <p class="font-bold text-sm text-slate-800">
                      {{ slotProps.item.user?.name || 'سیستم' }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ slotProps.item.user?.position || '-' }}
                    </p>
                  </div>
                </div>

                <!-- ═══ Status Change ═══ -->
                <div v-if="slotProps.item.from_status || slotProps.item.to_status"
                     class="flex items-center gap-2 flex-wrap bg-white rounded-lg p-2 border border-slate-200">
                  <Tag
                      v-if="slotProps.item.from_status"
                      :value="getStatusLabel(slotProps.item.from_status)"
                      :class="[
                                            getStatusColor(slotProps.item.from_status).bg,
                                            getStatusColor(slotProps.item.from_status).text
                                        ]"
                  />
                  <i class="pi pi-arrow-left text-slate-400 text-xs"></i>
                  <Tag
                      v-if="slotProps.item.to_status"
                      :value="getStatusLabel(slotProps.item.to_status)"
                      :class="[
                                            getStatusColor(slotProps.item.to_status).bg,
                                            getStatusColor(slotProps.item.to_status).text
                                        ]"
                  />
                </div>

                <!-- ═══ Notes / Reason ═══ -->
                <div v-if="slotProps.item.notes || slotProps.item.reason"
                     class="mt-2 p-2 rounded-lg text-sm"
                     :class="getActionStyle(slotProps.item.action).noteBg">
                  <div class="flex items-start gap-2">
                    <i :class="getActionStyle(slotProps.item.action).noteIcon"
                       class="mt-0.5"></i>
                    <p class="text-slate-700">
                      {{ slotProps.item.notes || slotProps.item.reason }}
                    </p>
                  </div>
                </div>

                <!-- ═══ Changes (Metadata) ═══ -->
                <div v-if="slotProps.item.changes && Object.keys(slotProps.item.changes).length"
                     class="mt-2 text-xs text-slate-500">
                  <p class="font-medium mb-1">تغییرات:</p>
                  <ul class="space-y-1">
                    <li v-for="(value, key) in slotProps.item.changes"
                        :key="key"
                        class="flex items-center gap-2">
                      <i class="pi pi-circle-fill text-[6px] text-slate-400"></i>
                      <span class="font-medium text-slate-600">
                                                {{ formatChangeKey(key) }}:
                                            </span>
                      <span class="text-slate-700">
                                                {{ formatChangeValue(key, value) }}
                                            </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </template>

          <template #opposite="slotProps">
            <div class="text-xs text-slate-400 text-left pl-3">
              {{ toJalaliTime(slotProps.item.created_at) }}
            </div>
          </template>

          <template #marker="slotProps">
                        <span
                            class="flex items-center justify-center w-10 h-10 rounded-full shadow-md border-2 border-white"
                            :class="getActionStyle(slotProps.item.action).marker"
                        >
                            <i :class="getActionStyle(slotProps.item.action).icon"
                               class="text-white text-sm"></i>
                        </span>
          </template>

          <template #connector="slotProps">
            <div class="w-0.5 h-full bg-slate-200"></div>
          </template>
        </Timeline>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         Statistics Cards
    ═══════════════════════════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="page-card">
        <div class="p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <i class="pi pi-clock text-blue-600 text-xl"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500">مدت زمان کل فرآیند</p>
            <p class="font-bold text-slate-800">{{ totalDuration }}</p>
          </div>
        </div>
      </div>
      <div class="page-card">
        <div class="p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <i class="pi pi-check-circle text-green-600 text-xl"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500">تعداد تاییدها</p>
            <p class="font-bold text-slate-800">{{ approvalsCount }}</p>
          </div>
        </div>
      </div>
      <div class="page-card">
        <div class="p-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <i class="pi pi-times-circle text-red-600 text-xl"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500">تعداد رد شدن‌ها</p>
            <p class="font-bold text-slate-800">{{ rejectionsCount }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useJalaliDate } from '@/composables/useJalaliDate'
import { getStatusColor, purchaseStatusColors } from '@/utils/statusColors'

const route = useRoute()
const store = usePreWarehouseStore()
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()

const purchaseId = route.params.id
const purchase = ref(null)
const history = ref([])
const loading = ref(true)

// ═══════════════════════════════════════
// Computed
// ═══════════════════════════════════════
const purchaseTitle = computed(() => {
  if (!purchase.value) return '-'
  return `${purchase.value.item?.name || 'کالا'} - ${purchase.value.quantity} ${purchase.value.unit_of_measurement}`
})

const currentStatusColor = computed(() => {
  return getStatusColor(purchase.value?.status, 'purchase')
})

const sortedHistory = computed(() => {
  // مرتب‌سازی از جدیدترین به قدیمی‌ترین
  return [...history.value].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
  )
})

const totalDuration = computed(() => {
  if (history.value.length < 2) return '-'
  const first = new Date(history.value[history.value.length - 1].created_at)
  const last = new Date(history.value[0].created_at)
  const diffHours = Math.round((last - first) / (1000 * 60 * 60))
  if (diffHours < 1) return 'کمتر از یک ساعت'
  if (diffHours < 24) return `${diffHours} ساعت`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} روز`
})

const approvalsCount = computed(() =>
    history.value.filter(h => h.action === 'approved').length
)

const rejectionsCount = computed(() =>
    history.value.filter(h => h.action === 'rejected').length
)

// ══════════════════════════════════════
// Action Styles
// ═══════════════════════════════════════
const getActionStyle = (action) => {
  const styles = {
    created: {
      label: 'ایجاد',
      bg: 'bg-blue-100 text-blue-700',
      marker: 'bg-blue-500',
      icon: 'pi pi-plus',
      avatar: 'bg-blue-200 text-blue-700',
      noteBg: 'bg-blue-50 border border-blue-100',
      noteIcon: 'pi pi-info-circle text-blue-500',
    },
    approved: {
      label: 'تأیید',
      bg: 'bg-green-100 text-green-700',
      marker: 'bg-green-500',
      icon: 'pi pi-check',
      avatar: 'bg-green-200 text-green-700',
      noteBg: 'bg-green-50 border border-green-100',
      noteIcon: 'pi pi-check-circle text-green-500',
    },
    rejected: {
      label: 'رد شده',
      bg: 'bg-red-100 text-red-700',
      marker: 'bg-red-500',
      icon: 'pi pi-times',
      avatar: 'bg-red-200 text-red-700',
      noteBg: 'bg-red-50 border border-red-100',
      noteIcon: 'pi pi-exclamation-triangle text-red-500',
    },
    allocated: {
      label: 'تخصیص انبار',
      bg: 'bg-purple-100 text-purple-700',
      marker: 'bg-purple-500',
      icon: 'pi pi-share-alt',
      avatar: 'bg-purple-200 text-purple-700',
      noteBg: 'bg-purple-50 border border-purple-100',
      noteIcon: 'pi pi-share-alt text-purple-500',
    },
    location_assigned: {
      label: 'تعیین محل',
      bg: 'bg-cyan-100 text-cyan-700',
      marker: 'bg-cyan-500',
      icon: 'pi pi-map-marker',
      avatar: 'bg-cyan-200 text-cyan-700',
      noteBg: 'bg-cyan-50 border border-cyan-100',
      noteIcon: 'pi pi-map-marker text-cyan-500',
    },
    finalized: {
      label: 'نهایی‌سازی',
      bg: 'bg-slate-700 text-white',
      marker: 'bg-slate-800',
      icon: 'pi pi-flag',
      avatar: 'bg-slate-300 text-slate-800',
      noteBg: 'bg-slate-100 border border-slate-200',
      noteIcon: 'pi pi-flag text-slate-600',
    },
    received: {
      label: 'دریافت',
      bg: 'bg-emerald-100 text-emerald-700',
      marker: 'bg-emerald-500',
      icon: 'pi pi-download',
      avatar: 'bg-emerald-200 text-emerald-700',
      noteBg: 'bg-emerald-50 border border-emerald-100',
      noteIcon: 'pi pi-download text-emerald-500',
    },
    updated: {
      label: 'ویرایش',
      bg: 'bg-amber-100 text-amber-700',
      marker: 'bg-amber-500',
      icon: 'pi pi-pencil',
      avatar: 'bg-amber-200 text-amber-700',
      noteBg: 'bg-amber-50 border border-amber-100',
      noteIcon: 'pi pi-pencil text-amber-500',
    },
  }
  return styles[action] || {
    label: action,
    bg: 'bg-gray-100 text-gray-700',
    marker: 'bg-gray-500',
    icon: 'pi pi-circle',
    avatar: 'bg-gray-200 text-gray-700',
    noteBg: 'bg-gray-50 border border-gray-100',
    noteIcon: 'pi pi-info-circle text-gray-500',
  }
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
const getStatusLabel = (status) => {
  return purchaseStatusColors[status]?.label || status
}

const formatChangeKey = (key) => {
  const labels = {
    item_name: 'کالا',
    quantity: 'مقدار',
    unit_of_measurement: 'واحد',
    target_unit_id: 'واحد هدف',
    description: 'توضیحات',
    status: 'وضعیت',
    allocated_qty: 'مقدار تخصیص',
    warehouse_id: 'انبار',
    voucher_number: 'شماره حواله',
    notes: 'یادداشت',
    reason: 'دلیل',
  }
  return labels[key] || key
}

const formatChangeValue = (key, value) => {
  if (key === 'item_name' && typeof value === 'number') {
    return `کالای #${value}`
  }
  if (key === 'target_unit_id' && typeof value === 'number') {
    return `واحد #${value}`
  }
  if (key === 'warehouse_id' && typeof value === 'number') {
    return `انبار #${value}`
  }
  if (value === null || value === undefined) return '-'
  return String(value)
}

// ═══════════════════════════════════════
// Actions
// ═══════════════════════════════════════
const loadHistory = async () => {
  loading.value = true
  try {
    const response = await store.fetchHistory(purchaseId)
    history.value = response.data || []

    // دریافت اطلاعات خرید برای نمایش در header
    purchase.value = await store.fetchPurchase(purchaseId)
  } catch (error) {
    console.error('Error loading history:', error)
  } finally {
    loading.value = false
  }
}

const printHistory = () => {
  window.print()
}

const exportPdf = () => {
  // TODO: پیاده‌سازی خروجی PDF
  alert('این قابلیت در نسخه بعدی اضافه خواهد شد')
}

// ═══════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   Timeline RTL - راست‌چین کامل
═══════════════════════════════════════════ */
.custom-timeline {
  direction: rtl;
}

/* آیکون‌ها (Marker) در سمت راست */
.custom-timeline :deep(.p-timeline-event-opposite) {
  flex: 0 0 80px;
  text-align: left;
  padding-left: 1rem;
}

/* محتوا در سمت چپ آیکون */
.custom-timeline :deep(.p-timeline-event-content) {
  text-align: right;
  padding-right: 1.5rem;
  padding-bottom: 2rem;
}

/* خط اتصال (Connector) */
.custom-timeline :deep(.p-timeline-event-connector) {
  background-color: #e2e8f0;
  width: 2px;
  margin-right: auto;
  margin-left: auto;
}

/* Marker بدون padding پیش‌فرض */
.custom-timeline :deep(.p-timeline-event-marker) {
  padding: 0;
  background: transparent;
  border: none;
  margin: 0;
}

/* ═══════════════════════════════════════════
   Print Styles
═══════════════════════════════════════════ */
@media print {
  .no-print {
    display: none !important;
  }

  .page-card {
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
  }
}

/* ═══════════════════════════════════════════
   Animations
═══════════════════════════════════════════ */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.custom-timeline :deep(.p-timeline-event) {
  animation: slideIn 0.4s ease-out;
}

.custom-timeline :deep(.p-timeline-event:nth-child(1)) { animation-delay: 0.05s; }
.custom-timeline :deep(.p-timeline-event:nth-child(2)) { animation-delay: 0.1s; }
.custom-timeline :deep(.p-timeline-event:nth-child(3)) { animation-delay: 0.15s; }
.custom-timeline :deep(.p-timeline-event:nth-child(4)) { animation-delay: 0.2s; }
.custom-timeline :deep(.p-timeline-event:nth-child(5)) { animation-delay: 0.25s; }
.custom-timeline :deep(.p-timeline-event:nth-child(6)) { animation-delay: 0.3s; }
</style>