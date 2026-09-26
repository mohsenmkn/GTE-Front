<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        جزئیات شکایت
      </h1>
      <div class="flex gap-2">
        <Button
            label="بازگشت"
            icon="pi pi-arrow-right"
            class="p-button-secondary"
            @click="router.push({ name: 'complaints.my' })"
        />
        <Button
            v-if="canEdit"
            label="ویرایش"
            icon="pi pi-pencil"
            class="p-button-warning"
            @click="router.push({ name: 'complaints.edit', params: { id: complaint.id } })"
        />
      </div>
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
              <div class="font-bold mt-1">
                {{ complaint.category?.full_title || complaint.category?.title || '-' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500">آخرین به‌روزرسانی</div>
              <div class="font-bold mt-1">
                {{ formatDate(complaint.updated_at) }}
              </div>
            </div>

            <!-- ✅ جدید: معاونت مقصد -->
            <div>
              <div class="text-sm text-gray-500">معاونت مقصد</div>
              <div class="font-bold mt-1 flex items-center gap-2">
                <i class="pi pi-building text-blue-500"></i>
                <span v-if="complaint.organizational_unit">
                  {{complaint.organizational_unit.title }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </div>
            </div>

            <!-- ✅ جدید: مسئول پیگیری -->
            <div>
              <div class="text-sm text-gray-500">مسئول پیگیری</div>
              <div class="font-bold mt-1 flex items-center gap-2">
                <template v-if="complaint.assigned_user">
                  <i class="pi pi-user text-green-500"></i>
                  <span>{{ complaint.assigned_user.name }}</span>
                </template>
                <template v-else>
                  <Tag severity="warn" value="تعیین نشده" />
                </template>
              </div>
              <div v-if="complaint.assigned_at" class="text-xs text-gray-400 mt-1">
                تاریخ ارجاع: {{ formatDate(complaint.assigned_at) }}
              </div>
            </div>

            <!-- ✅ جدید: شکایت‌دهنده (برای مسئول پیگیری و ادمین) -->
            <div v-if="complaint.user">
              <div class="text-sm text-gray-500">شکایت‌دهنده</div>
              <div class="font-bold mt-1 flex items-center gap-2">
                <i class="pi pi-user text-gray-500"></i>
                <span>{{ complaint.user.name }}</span>
                <span v-if="complaint.user.personnel_code" class="text-xs text-gray-400">
                  ({{ complaint.user.personnel_code }})
                </span>
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

      <!-- افزودن پیوست -->
      <Card v-if="canAddAttachment">
        <template #title>
          افزودن پیوست جدید
        </template>
        <template #content>
          <FileUpload
              mode="basic"
              multiple
              :customUpload="true"
              :auto="false"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
              :maxFileSize="10 * 1024 * 1024"
              @select="onFileSelect"
              chooseLabel="انتخاب فایل"
          />
          <div v-if="newFiles.length" class="mt-4 space-y-2">
            <div
                v-for="(file, index) in newFiles"
                :key="index"
                class="flex items-center justify-between bg-gray-50 border rounded px-3 py-2"
            >
              <span class="text-sm text-gray-700">
                {{ file.name }}
              </span>
              <Button
                  icon="pi pi-times"
                  class="p-button-rounded p-button-text p-button-danger"
                  @click="removeNewFile(index)"
              />
            </div>
            <Button
                label="آپلود پیوست‌ها"
                icon="pi pi-upload"
                class="mt-3"
                :loading="uploading"
                @click="uploadNewFiles"
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
          <div v-if="visibleReplies.length === 0" class="text-gray-500 text-center py-6">
            هنوز پاسخی به این شکایت داده نشده است.
          </div>
          <Timeline
              v-else
              :value="visibleReplies"
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
                  {{ formatDate(slotProps.item.created_at) }}
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useAuthStore } from '@/stores/authold.js'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const complaint = ref(null)
const loading = ref(false)
const newFiles = ref([])
const uploading = ref(false)

const canEdit = computed(() => {
  return (
      complaint.value &&
      complaint.value.status === 'pending' &&
      auth.can('complaints.update')
  )
})

const canAddAttachment = computed(() => {
  return complaint.value && ['pending', 'in_progress'].includes(complaint.value.status)
})

const visibleReplies = computed(() => {
  return complaint.value?.replies?.filter(reply => !reply.is_internal) || []
})

const fetchComplaint = async () => {
  loading.value = true

  try {
    const { data } = await ComplaintService.getComplaint(route.params.id)
    complaint.value = data.data
    //console.log(complaint.value )
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت جزئیات شکایت با خطا مواجه شد.',
      life: 3000
    })

    router.push({ name: 'complaints.my' })
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
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

const getFileUrl = (path) => {
  return `${window.location.origin}/storage/${path}`
}

const onFileSelect = (event) => {
  for (const file of event.files) {
    newFiles.value.push(file)
  }
}

const removeNewFile = (index) => {
  newFiles.value.splice(index, 1)
}

const uploadNewFiles = async () => {
  if (!newFiles.value.length) return

  uploading.value = true

  try {
    const formData = new FormData()

    newFiles.value.forEach(file => {
      formData.append('attachments[]', file)
    })

    await ComplaintService.uploadAttachments(complaint.value.id, formData)

    toast.add({
      severity: 'success',
      summary: 'آپلود شد',
      detail: 'پیوست‌ها با موفقیت بارگذاری شدند.',
      life: 3000
    })

    newFiles.value = []

    await fetchComplaint()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'آپلود فایل با خطا مواجه شد.',
      life: 3000
    })
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  fetchComplaint()
  console.log(complaint.value)
})
</script>