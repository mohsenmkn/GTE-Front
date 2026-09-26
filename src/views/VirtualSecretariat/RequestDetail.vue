<template>
  <!-- حالت لودینگ -->
  <div v-if="!request" class="text-center py-10">
    <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
    <p class="text-gray-500 mt-2">در حال بارگذاری اطلاعات...</p>
  </div>

  <!-- محتوای اصلی -->
  <div v-else class="p-4 max-w-4xl mx-auto">
    <div class="p-4 md:p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">

      <!-- هدر صفحه -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-3">
          <Button
              icon="pi pi-arrow-right"
              rounded
              text
              severity="secondary"
              @click="$router.back()"
              v-tooltip="'بازگشت به لیست'"
          />
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-gray-800">جزئیات درخواست شماره {{ request.id }}</h1>
            <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <i class="pi pi-calendar text-xs"></i>
              ثبت شده در تاریخ {{ request.created_at }}
            </p>
          </div>
        </div>
        <Tag
            :value="request.status_label"
            :severity="getStatusSeverity(request.status)"
            class="text-sm px-4 py-2 font-medium shadow-sm"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- کارت اطلاعات اصلی نامه -->
        <Card class="lg:col-span-2 shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
          <template #title>
            <div class="flex items-center gap-2 text-gray-800 font-bold">
              <i class="pi pi-file text-blue-600 text-lg"></i>
              <span>اطلاعات اصلی نامه</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 p-2">

              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-tag text-blue-600"></i>
                </div>
                <div>
                  <span class="block text-xs text-gray-500 mb-1">موضوع نامه</span>
                  <span class="font-semibold text-gray-800 leading-relaxed">{{ request.title }}</span>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-bookmark text-indigo-600"></i>
                </div>
                <div>
                  <span class="block text-xs text-gray-500 mb-1">نوع نامه (قالب)</span>
                  <span class="font-semibold text-gray-800">{{ request.template?.name || '-' }}</span>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-hashtag text-emerald-600"></i>
                </div>
                <div>
                  <span class="block text-xs text-gray-500 mb-1">شماره نامه در اتوماسیون</span>
                  <Tag
                      v-if="request.automation_letter_number"
                      :value="request.automation_letter_number"
                      severity="success"
                      class="font-bold font-mono text-sm"
                  />
                  <span v-else class="text-sm text-gray-400 italic">در انتظار صدور</span>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-send text-amber-600"></i>
                </div>
                <div>
                  <span class="block text-xs text-gray-500 mb-1">تاریخ ارسال به اتوماسیون</span>
                  <span class="font-semibold text-gray-800">{{ request.sent_at || 'هنوز ارسال نشده' }}</span>
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- کارت اطلاعات گیرنده -->
        <Card class="shadow-sm border-0 bg-white rounded-2xl overflow-hidden h-fit">
          <template #title>
            <div class="flex items-center gap-2 text-gray-800 font-bold">
              <i class="pi pi-users text-purple-600 text-lg"></i>
              <span>اطلاعات گیرنده</span>
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4 p-2">
              <div class="p-3 bg-purple-50 rounded-xl border border-purple-100" v-if="request.request_data?.receiver_org">
                <span class="block text-xs text-purple-600 mb-1 font-medium">سازمان / مقام گیرنده</span>
                <span class="font-bold text-gray-800">{{ request.request_data.receiver_org }}</span>
              </div>

              <div class="p-3 bg-purple-50 rounded-xl border border-purple-100" v-if="request.request_data?.receiver_name">
                <span class="block text-xs text-purple-600 mb-1 font-medium">به (شخص گیرنده)</span>
                <span class="font-bold text-gray-800">{{ request.request_data.receiver_name }}</span>
              </div>

              <Divider v-if="request.request_data?.receiver_org || request.request_data?.receiver_name" />

              <div class="text-center text-gray-400 text-sm" v-if="!request.request_data?.receiver_org && !request.request_data?.receiver_name">
                اطلاعات گیرنده ثبت نشده است.
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- کارت گردش کار -->
      <Card class="shadow-sm border-0 bg-white rounded-2xl overflow-hidden">
        <template #title>
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2 text-gray-800 font-bold">
              <i class="pi pi-history text-indigo-600 text-lg"></i>
              <span>گردش کار در اتوماسیون</span>
            </div>
            <Button
                icon="pi pi-refresh"
                rounded
                text
                severity="secondary"
                size="small"
                @click="fetchWorkflow"
                :loading="workflowLoading"
                v-tooltip="'به‌روزرسانی وضعیت'"
            />
          </div>
        </template>

        <template #content>
          <!-- حالت لودینگ -->
          <div v-if="workflowLoading" class="text-center py-12">
            <i class="pi pi-spin pi-spinner text-4xl text-indigo-400 mb-3"></i>
            <p class="text-gray-500">در حال دریافت آخرین وضعیت از اتوماسیون...</p>
          </div>

          <!-- حالت خالی -->
          <div v-else-if="workflow.length === 0" class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 m-2">
            <i class="pi pi-inbox text-5xl text-gray-300 mb-3"></i>
            <p class="text-gray-500 font-medium">هنوز گردش کاری برای این نامه ثبت نشده است</p>
            <p class="text-xs text-gray-400 mt-1">پس از بررسی توسط دبیرخانه، وضعیت در اینجا نمایش داده می‌شود.</p>
          </div>

          <!-- تایم‌لاین گردش کار -->
          <Timeline v-else :value="workflow" align="right" class="custom-timeline">
            <template #marker="slotProps">
            <span
                class="flex w-10 h-10 rounded-full items-center justify-center shadow-md ring-4 ring-white transition-transform hover:scale-110"
                :class="getStateMarkerClass(slotProps.item.state)"
            >
              <i :class="getStateIcon(slotProps.item.state)" class="text-white text-lg"></i>
            </span>
            </template>

            <template #content="slotProps">
              <div class="mb-6 ml-4">
                <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300">

                  <!-- هدر کارت گردش -->
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-2 flex-wrap">
                      <i class="pi pi-user text-gray-400"></i>
                      <span class="font-bold text-gray-800 text-base">{{ slotProps.item.receiver_role_name }}</span>
                    </div>
                    <Tag
                        :value="slotProps.item.state_label"
                        :severity="getStateSeverity(slotProps.item.state)"
                        class="font-medium w-fit"
                    />
                  </div>

                  <!-- جزئیات گردش -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div class="flex items-center gap-2 text-gray-700">
                      <i class="pi pi-bookmark text-indigo-500"></i>
                      <span class="font-medium">{{ slotProps.item.action_name }}</span>
                    </div>

                    <div class="flex items-center gap-2 text-gray-600">
                      <i class="pi pi-calendar text-green-600"></i>
                      <span>دریافت: <span class="font-mono font-medium text-gray-800">{{ slotProps.item.receive_date }}</span></span>
                    </div>

                    <div v-if="slotProps.item.response_date" class="flex items-center gap-2 text-gray-600 md:col-span-2">
                      <i class="pi pi-check-circle text-green-600"></i>
                      <span>پاسخ: <span class="font-mono font-medium text-gray-800">{{ slotProps.item.response_date }}</span></span>
                    </div>
                  </div>

                  <!-- متن پاسخ / توضیحات -->
                  <div v-if="slotProps.item.response_text" class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed relative">
                    <i class="pi pi-quote-right absolute top-2 left-2 text-gray-200 text-3xl -z-10"></i>
                    <span class="relative z-10" v-html="slotProps.item.response_text"></span>
                  </div>

                </div>
              </div>
            </template>
          </Timeline>
        </template>
      </Card>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { Card, Tag, Timeline, Button, Divider } from 'primevue'
import moment from 'moment-jalaali'

const route = useRoute()
const request = ref(null)
const workflow = ref([])
const workflowLoading = ref(false)

const fetchRequest = async () => {
  try {
    const { data } = await api.get(`/virtual-secretariat/requests/${route.params.id}`)
    request.value = data.data
  } catch (error) {
    console.error('خطا در دریافت جزئیات درخواست:', error)
  }
}

const fetchWorkflow = async () => {
  workflowLoading.value = true
  try {
    const { data } = await api.get(`/virtual-secretariat/requests/${route.params.id}/workflow`)
    workflow.value = data.data || []
  } catch (error) {
    console.error('خطا در دریافت گردش کار:', error)
  } finally {
    workflowLoading.value = false
  }
}

const getStatusSeverity = (status) => ({
  pending: 'warn',
  processing: 'info',
  sent: 'info',
  completed: 'success',
  rejected: 'danger',
  failed: 'danger',
}[status] || 'secondary')

const getStateSeverity = (state) => ({
  waiting: 'warn',
  in_progress: 'info',
  finished: 'success',
  rejected: 'danger',
}[state] || 'secondary')

const getStateIcon = (state) => ({
  waiting: 'pi pi-clock',
  in_progress: 'pi pi-spin pi-spinner',
  finished: 'pi pi-check',
  rejected: 'pi pi-times',
}[state] || 'pi pi-circle-fill')

const getStateMarkerClass = (state) => ({
  waiting: 'bg-orange-500',
  in_progress: 'bg-blue-500',
  finished: 'bg-green-500',
  rejected: 'bg-red-500',
}[state] || 'bg-gray-400')

// تبدیل تاریخ SQL به شمسی
const formatSqlDate = (sqlDate) => {
  if (!sqlDate) return '-'
  try {
    // ✅ moment تاریخ میلادی SQL را parse می‌کند و به شمسی تبدیل می‌کند
    const m = moment(sqlDate)
    if (!m.isValid()) return sqlDate
    return m.format('jYYYY/jMM/jDD HH:mm')
  } catch {
    return sqlDate
  }
}

onMounted(() => {
  fetchRequest()
  fetchWorkflow()
})
</script>

<style scoped>
/* بهبود ظاهر تایم‌لاین در حالت راست‌چین */
.custom-timeline {
  direction: rtl;
}

.custom-timeline :deep(.p-timeline-event-marker) {
  margin-left: 1.5rem;
  margin-right: 0;
}

.custom-timeline :deep(.p-timeline-event-opposite) {
  display: none; /* حذف سمت چپ خالی برای تمرکز بیشتر روی محتوا */
}

.custom-timeline :deep(.p-timeline-event-connector) {
  background-color: #e5e7eb;
  width: 2px;
}

/* افکت‌های ظریف برای کارت‌ها */
.bg-gray-50 {
  background-color: #f9fafb;
}
</style>