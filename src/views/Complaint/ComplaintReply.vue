<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        پاسخ به شکایت
      </h1>
      <Button
          label="بازگشت"
          icon="pi pi-arrow-right"
          class="p-button-secondary"
          @click="router.back()"
      />
    </div>

    <div v-if="loading" class="text-center py-10">
      <ProgressSpinner />
    </div>

    <template v-else-if="complaint">
      <!-- اطلاعات شکایت -->
      <Card>
        <template #title>
          اطلاعات شکایت
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="text-sm text-gray-500">کد پیگیری</div>
              <div class="font-bold mt-1">
                {{ complaint.tracking_code }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">وضعیت</div>
              <div class="mt-1">
                <Tag
                    :severity="getStatusSeverity(complaint.status)"
                    :value="complaint.status_label"
                />
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">اولویت</div>
              <div class="mt-1">
                <Tag
                    :severity="getPrioritySeverity(complaint.priority)"
                    :value="complaint.priority_label"
                />
              </div>
            </div>
            <div class="md:col-span-3">
              <div class="text-sm text-gray-500">موضوع</div>
              <div class="font-bold mt-1">
                {{ complaint.subject }}
              </div>
            </div>
            <div class="md:col-span-3">
              <div class="text-sm text-gray-500">شرح شکایت</div>
              <div class="mt-2 leading-7 text-gray-700 whitespace-pre-line">
                {{ complaint.description }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">شکایت‌دهنده</div>
              <div class="font-bold mt-1">
                {{ complaint.user?.name || '-' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">معاونت مقصد</div>
              <div class="font-bold mt-1">
                {{ complaint.organizational_unit?.title || '-' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">تاریخ ثبت</div>
              <div class="font-bold mt-1">
                {{ complaint.jalali_date }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- فرم پاسخ -->
      <Card>
        <template #title>
          ثبت پاسخ
        </template>
        <template #content>
          <form @submit.prevent="submitReply" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                متن پاسخ <span class="text-red-500">*</span>
              </label>
              <Textarea
                  v-model="replyContent"
                  rows="6"
                  class="w-full"
                  placeholder="پاسخ خود را بنویسید..."
                  :class="{ 'p-invalid': replyError }"
              />
              <small v-if="replyError" class="p-error">
                {{ replyError }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                تغییر وضعیت
              </label>
              <Select
                  v-model="newStatus"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
              />
            </div>

            <div class="flex gap-3">
              <Button
                  type="submit"
                  label="ثبت پاسخ"
                  icon="pi pi-send"
                  :loading="submitting"
              />
              <Button
                  type="button"
                  label="انصراف"
                  icon="pi pi-times"
                  class="p-button-secondary"
                  @click="router.back()"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- پاسخ‌های قبلی -->
      <Card v-if="complaint.replies?.length">
        <template #title>
          پاسخ‌های قبلی
        </template>
        <template #content>
          <Timeline
              :value="complaint.replies"
              align="alternate"
              dir="ltr"
          >
            <template #marker="slotProps">
              <span class="p-timeline-marker bg-blue-500"></span>
            </template>
            <template #content="slotProps">
              <div class="border rounded-lg p-4 bg-gray-50">
                <div class="text-sm text-gray-700 leading-6 whitespace-pre-line">
                  {{ slotProps.item.content }}
                </div>
                <div class="text-xs text-gray-400 mt-3">
                  {{ slotProps.item.user?.name }} - {{ formatDate(slotProps.item.created_at) }}
                </div>
              </div>
            </template>
          </Timeline>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const complaint = ref(null)
const loading = ref(false)
const replyContent = ref('')
const newStatus = ref('in_progress')
const submitting = ref(false)
const replyError = ref('')

const statusOptions = [
  { label: 'در حال رسیدگی', value: 'in_progress' },
  { label: 'پاسخ داده شده', value: 'answered' },
  { label: 'بسته شده', value: 'resolved' },
  { label: 'رد شده', value: 'rejected' },
]

const fetchComplaint = async () => {
  loading.value = true
  try {
    const { data } = await ComplaintService.getComplaint(route.params.id)
    complaint.value = data.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت اطلاعات شکایت با خطا مواجه شد.',
      life: 3000,
    })
    router.push({ name: 'complaints.assigned-to-me' })
  } finally {
    loading.value = false
  }
}

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    replyError.value = 'متن پاسخ الزامی است.'
    return
  }

  replyError.value = ''
  submitting.value = true

  try {
    await ComplaintService.storeReply(complaint.value.id, {
      content: replyContent.value,
      status: newStatus.value,
    })

    toast.add({
      severity: 'success',
      summary: 'ثبت شد',
      detail: 'پاسخ با موفقیت ثبت شد.',
      life: 3000,
    })

    router.push({ name: 'complaints.assigned-to-me' })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'ثبت پاسخ با خطا مواجه شد.',
      life: 3000,
    })
  } finally {
    submitting.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warning',
    in_progress: 'info',
    answered: 'success',
    resolved: 'secondary',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

const getPrioritySeverity = (priority) => {
  const map = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  }
  return map[priority] || 'info'
}

onMounted(() => {
  fetchComplaint()
})
</script>