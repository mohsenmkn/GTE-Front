<template>
  <div class="p-6 space-y-6">

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        شکایات من
      </h1>

      <Button
          label="ثبت شکایت جدید"
          icon="pi pi-plus"
          @click="router.push({ name: 'complaints.create' })"
      />
    </div>

    <Card>
      <template #content>

        <div class="flex flex-col md:flex-row gap-4 mb-4">
          <Select
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="فیلتر بر اساس وضعیت"
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

          <Column field="tracking_code" header="کد پیگیری" style="min-width: 170px" />

          <Column field="subject" header="موضوع" style="min-width: 200px" />

          <Column header="دسته‌بندی" style="min-width: 220px">
            <template #body="{ data }">
              {{ data.category?.title || '-' }}
            </template>
          </Column>

          <Column header="وضعیت" style="min-width: 150px">
            <template #body="{ data }">
              <Tag
                  :severity="getStatusSeverity(data.status)"
                  :value="data.status_label"
              />
            </template>
          </Column>

          <Column header="اولویت" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                  :severity="getPrioritySeverity(data.priority)"
                  :value="data.priority_label"
              />
            </template>
          </Column>

          <Column field="jalali_date" header="تاریخ ثبت" style="min-width: 130px" />

          <Column header="عملیات" style="width: 160px">
            <template #body="{ data }">
              <div class="flex gap-2">

                <Button
                    icon="pi pi-eye"
                    class="p-button-rounded p-button-text"
                    @click="viewComplaint(data)"
                />

                <Button
                    v-if="data.status === 'pending' && auth.can('complaints.update')"
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-text p-button-warning"
                    @click="editComplaint(data)"
                />

                <Button
                    v-if="data.status === 'pending' && auth.can('complaints.delete')"
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-text p-button-danger"
                    @click="confirmDelete(data)"
                />

              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center text-gray-500 py-6">
              شکایتی ثبت نشده است.
            </div>
          </template>

        </DataTable>

      </template>
    </Card>

    <ConfirmDialog />

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useAuthStore } from '@/stores/authold.js'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

const complaints = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const perPage = ref(10)
const currentPage = ref(1)

const filters = reactive({
  status: null
})

const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'در حال رسیدگی', value: 'in_progress' },
  { label: 'پاسخ داده شده', value: 'answered' },
  { label: 'بسته شده', value: 'resolved' },
  { label: 'رد شده', value: 'rejected' }
]

const fetchComplaints = async (page = 1) => {
  loading.value = true
  currentPage.value = page

  try {
    const { data } = await ComplaintService.getMyComplaints({
      page,
      per_page: perPage.value,
      status: filters.status || undefined
    })

    complaints.value = data.data
    totalRecords.value = data.meta?.total || 0

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت لیست شکایات با خطا مواجه شد.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const onPage = (event) => {
  fetchComplaints(event.page + 1)
}

const viewComplaint = (complaint) => {
  router.push({
    name: 'complaints.show',
    params: { id: complaint.id }
  })
}

const editComplaint = (complaint) => {
  router.push({
    name: 'complaints.edit',
    params: { id: complaint.id }
  })
}

const confirmDelete = (complaint) => {
  confirm.require({
    message: 'آیا از حذف این شکایت مطمئن هستید؟',
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'حذف',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await ComplaintService.deleteComplaint(complaint.id)

        toast.add({
          severity: 'success',
          summary: 'حذف شد',
          detail: 'شکایت با موفقیت حذف شد.',
          life: 3000
        })

        fetchComplaints(currentPage.value)

      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف شکایت با خطا مواجه شد.',
          life: 3000
        })
      }
    }
  })
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