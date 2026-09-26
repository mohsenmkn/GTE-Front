<template>
  <div class="p-6 space-y-6">

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        جزئیات شکایت
      </h1>

      <Button
          label="بازگشت به لیست"
          icon="pi pi-arrow-right"
          class="p-button-secondary"
          @click="router.push({ name: 'complaints.admin.index' })"
      />
    </div>

    <div v-if="loading" class="text-center py-10">
      <ProgressSpinner />
    </div>

    <template v-else-if="complaint">

      <!-- اطلاعات اصلی -->
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

            <div>
              <div class="text-sm text-gray-500">تاریخ ثبت</div>
              <div class="font-bold mt-1">
                {{ complaint.jalali_date }}
              </div>
            </div>

            <div>
              <div class="text-sm text-gray-500">دسته‌بندی</div>
              <div class="font-bold mt-1 leading-6">
                {{ complaint.category?.full_title || complaint.category?.title || '-' }}
              </div>
            </div>

            <div>
              <div class="text-sm text-gray-500">تاریخ اولین پاسخ</div>
              <div class="font-bold mt-1">
                {{ formatDate(complaint.answered_at) }}
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

          </div>
        </template>
      </Card>

      <!-- اطلاعات شاکی -->
      <Card v-if="complaint.complainant">
        <template #title>
          اطلاعات شاکی
        </template>

        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div>
              <div class="text-sm text-gray-500">نام</div>
              <div class="font-bold mt-1">
                {{ complaint.complainant.name || '-' }}
              </div>
            </div>

            <div>
              <div class="text-sm text-gray-500">موبایل</div>
              <div class="font-bold mt-1">
                {{ complaint.complainant.mobile || '-' }}
              </div>
            </div>

            <div>
              <div class="text-sm text-gray-500">کد پرسنلی</div>
              <div class="font-bold mt-1">
                {{ complaint.complainant.personnel_code || '-' }}
              </div>
            </div>

          </div>
        </template>
      </Card>

      <!-- تغییر وضعیت و اولویت -->
      <Card>
        <template #title>
          مدیریت وضعیت
        </template>

        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div class="field">
              <label class="block mb-2 font-medium">وضعیت</label>
              <Select
                  v-model="statusForm.status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="انتخاب وضعیت"
                  class="w-full"
              />
            </div>

            <div class="field">
              <label class="block mb-2 font-medium">اولویت</label>
              <Select
                  v-model="statusForm.priority"
                  :options="priorityOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="انتخاب اولویت"
                  class="w-full"
              />
            </div>

            <div class="flex items-end">
              <Button
                  label="ثبت تغییرات"
                  icon="pi pi-check"
                  :loading="updatingStatus"
                  @click="updateStatus"
              />
            </div>

          </div>
        </template>
      </Card>

      <!-- ثبت پاسخ -->
      <Card>
        <template #title>
          ثبت پاسخ جدید
        </template>

        <template #content>

          <div class="field">
            <label class="block mb-2 font-medium">متن پاسخ</label>
            <Textarea
                v-model="replyForm.content"
                rows="6"
                class="w-full"
                placeholder="متن پاسخ به شاکی را وارد کنید..."
            />
          </div>

          <div class="flex items-center gap-2 mt-3">
            <Checkbox
                v-model="replyForm.is_internal"
                :binary="true"
                inputId="is_internal"
            />
            <label for="is_internal">
              یادداشت داخلی فقط برای ادمین‌ها ثبت شود و برای شاکی ارسال نشود.
            </label>
          </div>

          <Message
              v-if="!replyForm.is_internal"
              severity="info"
              :closable="false"
              class="mt-4"
          >
            با ثبت پاسخ غیرداخلی، پیامک اطلاع‌رسانی برای شاکی ارسال خواهد شد.
          </Message>

          <div class="mt-5">
            <Button
                label="ثبت پاسخ"
                icon="pi pi-send"
                :loading="submittingReply"
                @click="submitReply"
            />
          </div>

        </template>
      </Card>

      <!-- پاسخ‌ها -->
      <Card>
        <template #title>
          پاسخ‌ها و پیگیری‌ها
        </template>

        <template #content>

          <div v-if="complaint.replies?.length === 0" class="text-gray-500 text-center py-6">
            هنوز پاسخی ثبت نشده است.
          </div>

          <div v-else class="space-y-4">

            <div
                v-for="reply in complaint.replies"
                :key="reply.id"
                class="border rounded-lg p-4"
                :class="reply.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'"
            >

              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">

                <div class="font-bold text-sm">
                  {{ reply.replier?.name || 'کاربر' }}
                </div>

                <div class="flex flex-wrap gap-2">

                  <Tag
                      v-if="reply.is_internal"
                      severity="warning"
                      value="یادداشت داخلی"
                  />

                  <Tag
                      v-else
                      severity="success"
                      value="پاسخ به شاکی"
                  />

                  <Tag
                      v-if="!reply.is_internal && reply.sent_sms"
                      severity="info"
                      value="پیامک ارسال شد"
                  />

                </div>

              </div>

              <div class="text-sm leading-7 text-gray-700 whitespace-pre-line">
                {{ reply.content }}
              </div>

              <div class="text-xs text-gray-400 mt-3">
                {{ formatDate(reply.created_at) }}
              </div>

            </div>

          </div>

        </template>
      </Card>

      <!-- پیوست‌ها -->
      <Card v-if="complaint.attachments?.length">
        <template #title>
          پیوست‌ها
        </template>

        <template #content>
          <div class="flex flex-wrap gap-3">

            <a
                v-for="attachment in complaint.attachments"
                :key="attachment.id"
                :href="getFileUrl(attachment.file_path)"
                target="_blank"
                class="flex items-center gap-2 border rounded-lg px-4 py-2 hover:bg-gray-50 transition"
            >
              <i class="pi pi-paperclip text-gray-500"></i>
              <span class="text-sm">
                                {{ attachment.file_name }}
                            </span>
            </a>

          </div>
        </template>
      </Card>

      <!-- لاگ پیامک‌ها -->
      <Card v-if="complaint.sms_logs?.length">
        <template #title>
          لاگ پیامک‌ها
        </template>

        <template #content>

          <DataTable
              :value="complaint.sms_logs"
              stripedRows
              responsiveLayout="scroll"
          >

            <Column field="mobile" header="شماره" style="min-width: 140px" />

            <Column field="message" header="متن پیامک" style="min-width: 300px" />

            <Column header="وضعیت" style="min-width: 130px">
              <template #body="{ data }">
                <Tag
                    :severity="data.status === 'sent' ? 'success' : 'danger'"
                    :value="data.status === 'sent' ? 'ارسال شده' : 'ناموفق'"
                />
              </template>
            </Column>

            <Column field="sent_at" header="زمان ارسال" style="min-width: 170px" />

          </DataTable>

        </template>
      </Card>

    </template>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const complaint = ref(null)
const loading = ref(false)
const updatingStatus = ref(false)
const submittingReply = ref(false)

const statusForm = reactive({
  status: '',
  priority: ''
})

const replyForm = reactive({
  content: '',
  is_internal: false
})

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'در حال رسیدگی', value: 'in_progress' },
  { label: 'پاسخ داده شده', value: 'answered' },
  { label: 'بسته شده', value: 'resolved' },
  { label: 'رد شده', value: 'rejected' }
]

const priorityOptions = [
  { label: 'کم', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'زیاد', value: 'high' },
  { label: 'بحرانی', value: 'critical' }
]

const fetchComplaint = async () => {
  loading.value = true

  try {
    const { data } = await ComplaintService.getAdminComplaint(route.params.id)
    complaint.value = data.data

    statusForm.status = complaint.value.status
    statusForm.priority = complaint.value.priority

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت جزئیات شکایت با خطا مواجه شد.',
      life: 3000
    })

    router.push({ name: 'complaints.admin.index' })

  } finally {
    loading.value = false
  }
}

const updateStatus = async () => {
  if (!statusForm.status) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'لطفاً وضعیت شکایت را انتخاب کنید.',
      life: 3000
    })
    return
  }

  updatingStatus.value = true

  try {
    await ComplaintService.updateComplaintStatus(complaint.value.id, {
      status: statusForm.status,
      priority: statusForm.priority || undefined
    })

    toast.add({
      severity: 'success',
      summary: 'به‌روزرسانی شد',
      detail: 'وضعیت شکایت با موفقیت به‌روزرسانی شد.',
      life: 3000
    })

    await fetchComplaint()

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'به‌روزرسانی وضعیت با خطا مواجه شد.',
      life: 3000
    })

  } finally {
    updatingStatus.value = false
  }
}

const submitReply = async () => {
  if (!replyForm.content.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'متن پاسخ را وارد کنید.',
      life: 3000
    })
    return
  }

  submittingReply.value = true

  try {
    await ComplaintService.storeReply(complaint.value.id, {
      content: replyForm.content,
      is_internal: replyForm.is_internal
    })

    toast.add({
      severity: 'success',
      summary: 'ثبت شد',
      detail: replyForm.is_internal
          ? 'یادداشت داخلی با موفقیت ثبت شد.'
          : 'پاسخ با موفقیت ثبت شد و پیامک برای شاکی ارسال خواهد شد.',
      life: 4000
    })

    replyForm.content = ''
    replyForm.is_internal = false

    await fetchComplaint()

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'ثبت پاسخ با خطا مواجه شد.',
      life: 3000
    })

  } finally {
    submittingReply.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}

const getFileUrl = (path) => {
  return `${window.location.origin}/storage/public/${path}`
}

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warning',
    in_progress: 'info',
    answered: 'success',
    resolved: 'secondary',
    rejected: 'danger'
  }

  return map[status] || 'info'
}

const getPrioritySeverity = (priority) => {
  const map = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  }

  return map[priority] || 'info'
}

onMounted(() => {
  fetchComplaint()
})
</script>