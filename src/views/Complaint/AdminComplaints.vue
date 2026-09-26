<template>
  <div class="p-6 space-y-6">

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        مدیریت شکایات
      </h1>

      <div class="flex gap-2">
        <Button
            label="خروجی Excel"
            icon="pi pi-file-excel"
            class="p-button-success"
            :loading="exporting"
            @click="exportExcel"
        />

        <Button
            label="دسته‌بندی شکایات"
            icon="pi pi-sitemap"
            class="p-button-secondary"
            @click="router.push({ name: 'complaints.categories' })"
        />
      </div>
    </div>

    <Card>
      <template #content>

        <!-- فیلترها -->
        <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">

          <InputText
              v-model="filters.search"
              placeholder="جستجو: کد پیگیری، موضوع، شاکی"
              @keyup.enter="fetchComplaints(1)"
          />

          <Select
              v-model="filters.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="وضعیت"
              showClear
              @change="fetchComplaints(1)"
          />

          <Select
              v-model="filters.priority"
              :options="priorityOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="اولویت"
              showClear
              @change="fetchComplaints(1)"
          />

          <Select
              v-model="filters.category_id"
              :options="categoryOptions"
              optionLabel="full_title"
              optionValue="id"
              placeholder="دسته‌بندی"
              showClear
              filter
          />

<!--          <DatePicker-->
<!--              v-model="filters.date_from"-->
<!--              type="date"-->
<!--              format="YYYY/MM/DD"-->
<!--              display-format="jYYYY/jMM/jDD"-->
<!--              placeholder="از تاریخ"-->
<!--              input-class="w-full p-3 border border-gray-300 rounded-lg text-right"-->
<!--              :editable="false"-->
<!--              :auto-submit="false"-->
<!--          />-->


<!--          <DatePicker-->
<!--              v-model="filters.date_to"-->
<!--              type="date"-->
<!--              format="YYYY/MM/DD"-->
<!--              display-format="jYYYY/jMM/jDD"-->
<!--              placeholder="تا تاریخ"-->
<!--              input-class="w-full p-3 border border-gray-300 rounded-lg text-right"-->
<!--              :editable="false"-->
<!--              :auto-submit="false"-->
<!--          />-->


        </div>

        <div class="flex gap-2 mb-4">
          <Button
              label="جستجو"
              icon="pi pi-search"
              @click="fetchComplaints(1)"
          />

          <Button
              label="پاک کردن فیلترها"
              icon="pi pi-filter-slash"
              class="p-button-text p-button-secondary"
              @click="resetFilters"
          />
        </div>

        <!-- جدول -->
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

          <Column field="subject" header="موضوع" style="min-width: 220px" />

          <Column header="شاکی" style="min-width: 180px">
            <template #body="{ data }">
              <div class="font-medium">
                {{ data.complainant?.name || '-' }}
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ data.complainant?.personnel_code || '' }}
              </div>
            </template>
          </Column>

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

          <Column header="عملیات" style="width: 100px">
            <template #body="{ data }">
              <Button
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text"
                  @click="viewComplaint(data)"
              />
            </template>
          </Column>

          <template #empty>
            <div class="text-center text-gray-500 py-6">
              شکایتی یافت نشد.
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
import JalaliDatePicker from "@/components/JalaliDatePicker.vue";
import DatePicker from 'vue3-persian-datetime-picker'

const router = useRouter()
const toast = useToast()

const complaints = ref([])
const categoryOptions = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const perPage = ref(15)
const currentPage = ref(1)
const exporting = ref(false)

const filters = reactive({
  search: '',
  status: null,
  priority: null,
  category_id: null,
  date_from: '',
  date_to: ''
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

const fetchCategories = async () => {
  try {
    const { data } = await ComplaintService.getAdminCategories()
    categoryOptions.value = flattenCategoryItems(data.data || [])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت دسته‌بندی‌ها با خطا مواجه شد.',
      life: 3000
    })
  }
}

const flattenCategoryItems = (nodes, parentTitle = '') => {
  let result = []

  nodes.forEach(node => {
    const title = parentTitle
        ? `${parentTitle} / ${node.title}`
        : node.title

    if (node.level === 3) {
      result.push({
        id: node.id,
        full_title: title
      })
    }

    if (node.children?.length) {
      result = result.concat(flattenCategoryItems(node.children, title))
    }
  })

  return result
}

const fetchComplaints = async (page = 1) => {
  loading.value = true
  currentPage.value = page

  try {
    const { data } = await ComplaintService.getAdminComplaints({
      page,
      per_page: perPage.value,
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      category_id: filters.category_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined
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


const exportExcel = async () => {
  exporting.value = true

  try {
    const response = await ComplaintService.exportComplaints({
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      category_id: filters.category_id || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      search: filters.search || undefined,
    })

    // خواندن filename از هدر Content-Disposition
    const contentDisposition = response.headers['content-disposition']
    let filename = `complaints-${new Date().toISOString().slice(0, 10)}.xlsx`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1]
      }
    }

    // ساخت blob و دانلود فایل
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'خروجی آماده شد',
      detail: 'فایل Excel با موفقیت دانلود شد.',
      life: 3000
    })

  } catch (error) {
    // مدیریت خطا برای response از نوع blob
    let errorMessage = 'خطا در دریافت خروجی Excel'

    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        const json = JSON.parse(text)
        errorMessage = json.message || errorMessage
      } catch (e) {
        // اگر parse نشد، همان پیام پیش‌فرض می‌ماند
      }
    } else {
      errorMessage = error.response?.data?.message || errorMessage
    }

    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: errorMessage,
      life: 4000
    })

  } finally {
    exporting.value = false
  }
}


const onPage = (event) => {
  fetchComplaints(event.page + 1)
}

const resetFilters = () => {
  Object.assign(filters, {
    search: '',
    status: null,
    priority: null,
    category_id: null,
    date_from: '',
    date_to: ''
  })

  fetchComplaints(1)
}

const viewComplaint = (complaint) => {
  router.push({
    name: 'complaints.admin.show',
    params: { id: complaint.id }
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
  fetchCategories()
  fetchComplaints(1)
})
</script>