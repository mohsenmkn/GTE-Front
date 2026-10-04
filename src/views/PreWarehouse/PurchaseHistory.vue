<template>
  <div class="p-6 space-y-5 animate-fade-in">
    <!-- Header -->
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
      </div>
    </div>

    <!-- Summary Card -->
    <div v-if="purchase" class="page-card">
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
                {{ translateStatus(currentStatusColor.label) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline -->
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
            align="left"
            class="custom-timeline"
        >
          <template #content="slotProps">
            <div class="space-y-3">
              <!-- Header: Action + Date -->
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                                    <span
                                        class="px-3 py-1 rounded-lg text-xs font-bold"
                                        :class="getActionStyle(slotProps.item.action).bg"
                                    >
                                        {{ translateAction(slotProps.item.action) }}
                                    </span>
                  <span class="text-sm text-slate-600 font-medium">
                                        {{ toJalali(slotProps.item.created_at) }}
                                    </span>
                  <span class="text-xs text-slate-400">
                                        ({{ timeAgo(slotProps.item.created_at) }})
                                    </span>
                </div>
              </div>

              <!-- User Info -->
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

                <!-- Status Change -->
                <div v-if="slotProps.item.from_status || slotProps.item.to_status"
                     class="flex items-center gap-2 flex-wrap bg-white rounded-lg p-2 border border-slate-200">
                  <Tag
                      v-if="slotProps.item.from_status"
                      :value="translateStatus(slotProps.item.from_status)"
                      :class="[
                                            getStatusColor(slotProps.item.from_status).bg,
                                            getStatusColor(slotProps.item.from_status).text
                                        ]"
                  />
                  <i class="pi pi-arrow-left text-slate-400 text-xs"></i>
                  <Tag
                      v-if="slotProps.item.to_status"
                      :value="translateStatus(slotProps.item.to_status)"
                      :class="[
                                            getStatusColor(slotProps.item.to_status).bg,
                                            getStatusColor(slotProps.item.to_status).text
                                        ]"
                  />
                </div>

                <!-- Notes / Reason -->
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

                <!-- نمایش ویژه خروج موقت -->
                <div
                    v-if="slotProps.item.changes?.temporary_exit_details?.length"
                    class="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3"
                >
                  <div class="mb-2 font-semibold text-orange-800">
                    جزئیات خروج موقت
                  </div>

                  <div class="mb-3 text-sm text-gray-700">
                    تعداد خروج‌ها:
                    {{ slotProps.item.changes.temporary_exits_count || 0 }}

                    <span class="mx-2">|</span>

                    مجموع مقدار خروج:
                    {{ slotProps.item.changes.total_temporary_exit_qty || 0 }}
                  </div>

                  <div
                      v-for="(exit, index) in slotProps.item.changes.temporary_exit_details"
                      :key="exit.allocation_id ?? index"
                      class="mb-3 rounded-md border border-gray-200 bg-white p-3 last:mb-0"
                  >
                    <div class="mb-2 font-semibold text-gray-800">
                      خروج شماره {{ index + 1 }}
                    </div>

                    <div class="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                      <div>
                        <span class="font-medium">انبار:</span>
                        {{ exit.warehouse_name || 'نامشخص' }}
                      </div>

                      <div>
                        <span class="font-medium">شناسه انبار:</span>
                        {{ exit.warehouse_id ?? '—' }}
                      </div>

                      <div>
                        <span class="font-medium">شناسه تخصیص:</span>
                        {{ exit.allocation_id ?? '—' }}
                      </div>

                      <div>
                        <span class="font-medium">مقدار خروج:</span>
                        {{ exit.quantity ?? 0 }}
                      </div>

                      <div>
                        <span class="font-medium">نوع مقصد:</span>
                        {{ exit.target_type || '—' }}
                      </div>

                      <div>
                        <span class="font-medium">کد تجهیز/وسیله:</span>
                        {{ exit.target_code || '—' }}
                      </div>

                      <div class="md:col-span-2">
                        <span class="font-medium">توضیحات محل مصرف:</span>
                        {{ exit.target_description || '—' }}
                      </div>

                      <div class="md:col-span-2">
                        <span class="font-medium">سایت مقصد:</span>
                        {{ exit.site_name || '—' }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- جزئیات ثبت اولیه خرید -->
                <div
                    v-if="
        slotProps.item.action === 'created' &&
        slotProps.item.changes
    "
                    class="mt-3"
                >
                  <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">

                    <div class="flex items-center gap-2 mb-3">
                      <i class="pi pi-shopping-cart text-blue-600"></i>

                      <p class="font-bold text-sm text-blue-800">
                        جزئیات ثبت خرید
                      </p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">

                      <!-- کالا -->
                      <div class="bg-white rounded-lg p-2 border border-blue-100">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-box text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        کالا
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.item_name || '-' }}
                          </strong>
                        </div>
                      </div>

                      <!-- کد کالا -->
                      <div class="bg-white rounded-lg p-2 border border-blue-100">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-tag text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        کد کالا
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.item_code || '-' }}
                          </strong>
                        </div>
                      </div>

                      <!-- مقدار -->
                      <div class="bg-white rounded-lg p-2 border border-blue-100">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-hashtag text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        مقدار
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.quantity || 0 }}
                            {{ slotProps.item.changes.unit_of_measurement || '' }}
                          </strong>
                        </div>
                      </div>

                      <!-- واحد هدف -->
                      <div class="bg-white rounded-lg p-2 border border-blue-100">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-building text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        واحد هدف
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.target_unit_name || '-' }}
                          </strong>
                        </div>
                      </div>

                      <!-- تاریخ تحویل -->
                      <div class="bg-white rounded-lg p-2 border border-blue-100">
                        <div class="flex items-center gap-2">
                          <i class="pi pi-calendar text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        تاریخ تحویل به انبار
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.purchase_date || '-' }}
                          </strong>
                        </div>
                      </div>

                      <!-- تأمین‌کننده -->
                      <div
                          v-if="slotProps.item.changes.supplier"
                          class="bg-white rounded-lg p-2 border border-blue-100"
                      >
                        <div class="flex items-center gap-2">
                          <i class="pi pi-truck text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        تأمین‌کننده
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.supplier }}
                          </strong>
                        </div>
                      </div>

                      <!-- برند -->
                      <div
                          v-if="slotProps.item.changes.brand"
                          class="bg-white rounded-lg p-2 border border-blue-100"
                      >
                        <div class="flex items-center gap-2">
                          <i class="pi pi-bookmark text-slate-400"></i>

                          <span class="text-xs text-slate-500">
                        برند
                    </span>

                          <strong class="text-xs text-slate-800 mr-auto">
                            {{ slotProps.item.changes.brand }}
                          </strong>
                        </div>
                      </div>

                    </div>

                    <!-- توضیحات -->
                    <div
                        v-if="slotProps.item.changes.description"
                        class="mt-2 bg-white rounded-lg p-2 border border-blue-100"
                    >
                      <div class="flex items-start gap-2">
                        <i class="pi pi-info-circle text-slate-400 mt-0.5"></i>

                        <div>
                    <span class="text-xs text-slate-500">
                        توضیحات
                    </span>

                          <p class="text-xs text-slate-700 mt-1">
                            {{ slotProps.item.changes.description }}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>


                <!-- Changes (Metadata) -->
                <div v-if="slotProps.item.changes && Object.keys(slotProps.item.changes).length"
                     class="mt-2 text-xs text-slate-500">
                  <p class="font-medium mb-1">جزئیات:</p>
                  <ul class="space-y-1">
                    <li v-for="(value, key) in slotProps.item.changes"
                        :key="key"
                        v-if="key !== 'temporary_exit_details' && formatChangeValue(key, value) !== null"
                        class="flex items-start gap-2">
                      <i class="pi pi-circle-fill text-[6px] text-slate-400 mt-1"></i>
                      <span class="font-medium text-slate-600 min-w-[120px]">
                                                {{ translateKey(key) }}:
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

    <!-- Statistics Cards -->
    <div v-if="history.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
const history = ref([])  // ✅ تغییر از null به []
const loading = ref(true)

// Computed
const purchaseTitle = computed(() => {
  if (!purchase.value) return 'در حال بارگذاری...'
  return `${purchase.value.item?.name || 'کالا'} - ${purchase.value.quantity || 0} ${purchase.value.unit_of_measurement || ''}`
})

const currentStatusColor = computed(() => {
  return getStatusColor(purchase.value?.status, 'purchase')
})

const sortedHistory = computed(() => {
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
    history.value.filter(h => h.action === 'approved' || h.action === 'custodian_approved').length
)

const rejectionsCount = computed(() =>
    history.value.filter(h => h.action === 'rejected').length
)

// Action Styles
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
    custodian_approved: {
      label: 'تایید متولی',
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
    voucher_entered: {
      label: 'ورود حواله',
      bg: 'bg-teal-100 text-teal-700',
      marker: 'bg-teal-500',
      icon: 'pi pi-file',
      avatar: 'bg-teal-200 text-teal-700',
      noteBg: 'bg-teal-50 border border-teal-100',
      noteIcon: 'pi pi-file text-teal-500',
    },
    receipt_entered: {
      label: 'ورود رسید انبار',
      bg: 'bg-emerald-100 text-emerald-700',
      marker: 'bg-emerald-500',
      icon: 'pi pi-inbox',
      avatar: 'bg-emerald-200 text-emerald-700',
      noteBg: 'bg-emerald-50 border border-emerald-100',
      noteIcon: 'pi pi-inbox text-emerald-500',
    },
    fully_received: {
      label: 'دریافت کامل شد',
      bg: 'bg-slate-700 text-white',
      marker: 'bg-slate-800',
      icon: 'pi pi-check-double',
      avatar: 'bg-slate-300 text-slate-800',
      noteBg: 'bg-slate-100 border border-slate-200',
      noteIcon: 'pi pi-check-double text-slate-600',
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
    custodian_rejected: {
      label: 'توسط متوالی تایید نشد.',
      bg: 'bg-red-100 text-red-700',
      marker: 'bg-red-500',
      icon: 'pi pi-times',
      avatar: 'bg-red-200 text-red-700',
      noteBg: 'bg-red-50 border border-red-100',
      noteIcon: 'pi pi-exclamation-triangle text-red-500',
    },
    supplier_returned: {
      label: 'مرجوع شد.',
      bg: 'bg-slate-700 text-white',
      marker: 'bg-slate-800',
      icon: 'pi pi-check-double',
      avatar: 'bg-slate-300 text-slate-800',
      noteBg: 'bg-slate-100 border border-slate-200',
      noteIcon: 'pi pi-check-double text-slate-600',
    },
  }
  return styles[action] || {
    label: translateAction(action),
    bg: 'bg-gray-100 text-gray-700',
    marker: 'bg-gray-500',
    icon: 'pi pi-circle',
    avatar: 'bg-gray-200 text-gray-700',
    noteBg: 'bg-gray-50 border border-gray-100',
    noteIcon: 'pi pi-info-circle text-gray-500',
  }
}

// ترجمه کلیدهای تغییرات
const translateKey = (key) => {
  const labels = {
    'status': 'وضعیت',
    'from_status': 'وضعیت قبلی',
    'to_status': 'وضعیت جدید',
    'item_name': 'کالا',
    'quantity': 'مقدار',
    'unit_of_measurement': 'واحد اندازه‌گیری',
    'target_unit_id': 'شناسه واحد متوالی',
    'description': 'توضیحات',
    'supplier': 'تامین‌کننده',
    'brand': 'برند',
    'item_code': 'کد کالا',
    'allocated_qty': 'مقدار تخصیص‌یافته',
    'warehouse_id': 'انبار',
    'total_allocated_qty': 'مجموع تخصیص‌یافته',
    'available_for_allocation': 'قابل بازتخصیص',
    'temporary_exits_count': 'تعداد خروج‌های موقت',
    'total_temporary_exit_qty': 'مجموع مقدار خروج موقت',
    'temporary_exit_details': 'جزئیات خروج موقت',
    'voucher_number': 'شماره حواله',
    'receipt_number': 'شماره رسید انبار',
    'warehouse_receipt_number': 'شماره رسید انبار',
    'remaining_qty_for_storage': 'مقدار باقیمانده برای انبار',
    'remaining_in_quarantine': 'باقیمانده در قرنطینه',
    'notes': 'یادداشت',
    'reason': 'دلیل',
    'approval_notes': 'یادداشت تایید',
    'rejection_reason': 'دلیل رد',
    'pending_warehouse_return': 'برگشت به انبار',
    'commercial_received': 'برگشت به بازرگانی',
    'supplier_returned': 'عودت به تامین کننده',
    'allocations':'تخصیص داده شده به',
    'item_id':'شناسه کالا',
    'purchase_date':'تاریخ تحویل به انبار',
    'target_unit_name':'واحد متوالی'
  }
  return labels[key] || key
}

// ترجمه مقادیر وضعیت
const translateStatus = (status) => {
  const statusLabels = {
    'registered': 'ثبت شده',
    'pending_warehouse_approval': 'در انتظار تایید انبار',
    'approved_by_warehouse': 'تایید شده توسط انبار',
    'pending_custodian_approval': 'در انتظار تایید متولی',
    'pending_allocation': 'در انتظار تخصیص',
    'allocated': 'تخصیص داده شده',
    'in_quarantine': 'در قرنطینه',
    'pending_location_assignment': 'در انتظار تعیین محل',
    'location_assigned': 'محل تعیین شده',
    'pending_commercial_voucher': 'در انتظار حواله بازرگانی',
    'voucher_entered': 'حواله وارد شد',
    'pending_warehouse_receipt': 'در انتظار رسید انبار',
    'receipt_entered': 'رسید انبار وارد شد',
    'pending_final_allocation': 'در انتظار تخصیص نهایی',
    'fully_received': 'دریافت کامل شد',
    'rejected_by_warehouse': 'رد شده توسط انبار',
    'rejected_by_custodian': 'رد شده توسط متولی',
    'rejected_by_destination': 'رد شده توسط انبار مقصد',
    'pending_reallocation': 'در انتظار تخصیص مجدد',
    'returned_to_warehouse': 'برگشت به انبار (عدم انطباق)',
    'purchase_date': 'تاریخ تحویل به انبار',
    'pending_warehouse_return': 'برگشت به انبار (عدم انطباق)',
    'commercial_received': 'برگشت به بازرگانی',
    'supplier_returned': 'عودت به تامین کننده',
    'warehouse_return_scheduled': 'عودت به انبار',

  }
  return statusLabels[status] || status
}

// ترجمه نوع اکشن
const translateAction = (action) => {
  const actionLabels = {
    'created': 'ایجاد',
    'updated': 'ویرایش',
    'approved': 'تایید',
    'rejected': 'رد شدن',
    'allocated': 'تخصیص انبار',
    'location_assigned': 'تعیین محل',
    'finalized': 'نهایی‌سازی',
    'received': 'دریافت',
    'voucher_entered': 'ورود حواله',
    'receipt_entered': 'ورود رسید انبار',
    'custodian_approved': 'تایید متولی',
    'temporary_exit': 'خروج موقت',
    'fully_received': 'دریافت کامل شد',
    'commercial_received': 'برگشت به بازرگانی',
    'supplier_returned': 'عودت به تامین کننده',
    'custodian_rejected': 'عودت به مسئول خرید',
  }
  return actionLabels[action] || action
}

// ترجمه نوع هدف خروج موقت
const getTargetTypeLabel = (type) => {
  const labels = {
    'equipment': 'تجهیز',
    'vehicle': 'وسیله نقلیه',
    'project': 'پروژه',
    'other': 'سایر',
  }
  return labels[type] || type
}

// فرمت‌کننده ویژه برای allocations
const formatAllocations = (allocations) => {
  if (!Array.isArray(allocations)) return JSON.stringify(allocations)

  return allocations.map(a => {
    const name = a.warehouse_name || a.warehouse?.name || `انبار #${a.warehouse_id}`
    return `${name}: ${a.allocated_qty} عدد`
  }).join(' | ')
}

// فرمت مقدار تغییر
const formatChangeValue = (key, value) => {
  if (key === 'status' || key === 'from_status' || key === 'to_status') {
    return translateStatus(value)
  }
  if (key === 'action') {
    return translateAction(value)
  }
  if (key === 'allocations') {
    return formatAllocations(value)
  }
  if (key === 'temporary_exit_details') {
    return null
  }
  if (value === null || value === undefined) return '-'
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// Actions
const loadHistory = async () => {
  loading.value = true
  try {
    purchase.value = await store.fetchPurchase(purchaseId)
    const response = await store.fetchHistory(purchaseId)
    history.value = response?.data || []
  } catch (error) {
    console.error('Error loading history:', error)
  } finally {
    loading.value = false
  }
}

const printHistory = () => {
  window.print()
}

// Lifecycle
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.45s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.custom-timeline {
  direction: rtl;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  flex: 0 0 80px;
  text-align: left;
  padding-left: 1rem;
}

.custom-timeline :deep(.p-timeline-event-content) {
  text-align: right;
  padding-right: 1.5rem;
  padding-bottom: 2rem;
}

.custom-timeline :deep(.p-timeline-event-connector) {
  background-color: #e2e8f0;
  width: 2px;
}

.custom-timeline :deep(.p-timeline-event-marker) {
  padding: 0;
  background: transparent;
  border: none;
  margin: 0;
}

@media print {
  .no-print {
    display: none !important;
  }
  .page-card {
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
  }
}

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