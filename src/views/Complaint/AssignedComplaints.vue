<!-- resources/js/pages/complaints/AssignedComplaints.vue -->
<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        <i class="pi pi-inbox text-blue-600 ml-2"></i>
        شکایات ارجاع‌شده به من
      </h1>
      <div class="flex gap-2">
        <Tag :value="`کل: ${totalRecords}`" severity="info" />
        <Tag :value="`در انتظار: ${pendingCount}`" severity="warn" />
      </div>
    </div>

    <Card>
      <template #content>
        <div class="flex flex-col md:flex-row gap-4 mb-4">
          <Select
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="فیلتر وضعیت"
              showClear
              class="w-full md:w-64"
              @change="fetchComplaints(1)"
          />
          <Select
              v-model="filters.priority"
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="فیلتر اولویت"
              showClear
              class="w-full md:w-64"
              @change="fetchComplaints(1)"
          />
        </div>

        <DataTable
            :value="complaints"
            lazy
            :paginator="true"
            :rows="perPage"
            :totalRecords="totalRecords"
            :loading="loading"
            @page="onPage"
            stripedRows
            responsiveLayout="scroll"
        >
          <Column field="tracking_code" header="کد پیگیری" style="min-width: 170px">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.tracking_code }}</span>
            </template>
          </Column>
          <Column field="subject" header="موضوع" style="min-width: 200px" />
          <Column header="شکایت‌دهنده" style="min-width: 150px">
            <template #body="{ data }">
              <div>
                <div class="font-medium">{{ data.user?.name || '—' }}</div>
                <div class="text-xs text-gray-500">{{ data.user?.personnel_code }}</div>
              </div>
            </template>
          </Column>
          <Column header="معاونت" style="min-width: 180px">
            <template #body="{ data }">
              {{ data.organizational_unit?.title || '—' }}
            </template>
          </Column>
          <Column header="وضعیت" style="min-width: 140px">
            <template #body="{ data }">
              <Tag
                  :severity="getStatusSeverity(data.status)"
                  :value="data.status_label"
              />
            </template>
          </Column>
          <Column header="اولویت" style="min-width: 110px">
            <template #body="{ data }">
              <Tag
                  :severity="getPrioritySeverity(data.priority)"
                  :value="data.priority_label"
              />
            </template>
          </Column>
          <Column header="تاریخ ارجاع" style="min-width: 130px">
            <template #body="{ data }">
              {{ formatDate(data.assigned_at) }}
            </template>
          </Column>
          <Column header="عملیات" style="width: 140px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    class="p-button-rounded p-button-text"
                    v-tooltip="'مشاهده'"
                    @click="viewComplaint(data)"
                />
                <Button
                    v-if="data.status === 'pending' || data.status === 'in_progress'"
                    icon="pi pi-comment"
                    class="p-button-rounded p-button-text p-button-success"
                    v-tooltip="'پاسخ'"
                    @click="replyToComplaint(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center text-gray-500 py-8">
              <i class="pi pi-inbox text-4xl text-gray-300 mb-3 block"></i>
              شکایتی به شما ارجاع نشده است.
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

const complaints = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const pendingCount = ref(0)
const perPage = ref(10)
const currentPage = ref(1)

const filters = reactive({
  status: null,
  priority: null,
})

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'در حال رسیدگی', value: 'in_progress' },
  { label: 'پاسخ داده شده', value: 'answered' },
  { label: 'بسته شده', value: 'resolved' },
  { label: 'رد شده', value: 'rejected' },
]

const priorityOptions = [
  { label: 'کم', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'بالا', value: 'high' },
  { label: 'بحرانی', value: 'critical' },
]

const fetchComplaints = async (page = 1) => {
  loading.value = true
  currentPage.value = page

  try {
    const params = {
      page,
      per_page: perPage.value,
    }
    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority

    const { data } = await ComplaintService.getAssignedToMe(params)
    complaints.value = data.data
    totalRecords.value = data.meta?.total || 0

    // شمارش در انتظار
    pendingCount.value = data.meta?.pending_count ||
        complaints.value.filter(c => c.status === 'pending').length
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت لیست شکایات با خطا مواجه شد.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const onPage = (event) => {
  fetchComplaints(event.page + 1)
}

const viewComplaint = (complaint) => {
  router.push({ name: 'complaints.show', params: { id: complaint.id } })
}

const replyToComplaint = (complaint) => {
  router.push({ name: 'complaints.reply', params: { id: complaint.id } })
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(date))
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
  fetchComplaints(1)
})
</script>