<template>
  <div class="p-4">
    <!-- هدر صفحه -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت درخواست‌ها</h1>
        <p class="text-gray-600 text-sm mt-1">مشاهده و مدیریت تمام درخواست‌های دبیرخانه مجازی</p>
      </div>
      <Button
          icon="pi pi-refresh"
          label="به‌روزرسانی"
          @click="fetchRequests"
          :loading="loading"
          severity="secondary"
      />
    </div>

    <!-- کارت‌های آمار -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card class="bg-blue-50">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">کل درخواست‌ها</p>
              <p class="text-2xl font-bold text-blue-700">{{ stats.total }}</p>
            </div>
            <i class="pi pi-inbox text-3xl text-blue-400"></i>
          </div>
        </template>
      </Card>

      <Card class="bg-orange-50">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">در انتظار</p>
              <p class="text-2xl font-bold text-orange-700">{{ stats.pending }}</p>
            </div>
            <i class="pi pi-clock text-3xl text-orange-400"></i>
          </div>
        </template>
      </Card>

      <Card class="bg-green-50">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">تکمیل شده</p>
              <p class="text-2xl font-bold text-green-700">{{ stats.completed }}</p>
            </div>
            <i class="pi pi-check-circle text-3xl text-green-400"></i>
          </div>
        </template>
      </Card>

      <Card class="bg-red-50">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm">رد شده</p>
              <p class="text-2xl font-bold text-red-700">{{ stats.rejected }}</p>
            </div>
            <i class="pi pi-times-circle text-3xl text-red-400"></i>
          </div>
        </template>
      </Card>
    </div>

    <!-- فیلترها -->
    <Card class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-filter text-gray-600"></i>
          <span class="font-semibold">فیلترها</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- فیلتر وضعیت -->
          <div class="field">
            <label for="filter-status">وضعیت</label>
            <Select
                id="filter-status"
                v-model="filters.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="همه وضعیت‌ها"
                class="w-full"
            />
          </div>

          <!-- فیلتر نوع نامه -->
          <div class="field">
            <label for="filter-template">نوع نامه</label>
            <Select
                id="filter-template"
                v-model="filters.template_id"
                :options="templates"
                optionLabel="name"
                optionValue="id"
                placeholder="همه انواع"
                class="w-full"
            />
          </div>

          <!-- فیلتر کاربر -->
          <div class="field">
            <label for="filter-user">کاربر</label>
            <Select
                id="filter-user"
                v-model="filters.user_id"
                :options="users"
                optionLabel="name"
                optionValue="id"
                placeholder="همه کاربران"
                class="w-full"
            />
          </div>

          <!-- فیلتر تاریخ -->
          <div class="field">
            <label for="filter-date">تاریخ ثبت</label>
            <DatePicker
                id="filter-date"
                v-model="filters.date_range"
                selectionMode="range"
                placeholder="بازه زمانی"
                class="w-full"
                dateFormat="yy/mm/dd"
            />
          </div>
        </div>

        <div class="flex gap-2 justify-end mt-4">
          <Button
              label="پاک کردن فیلترها"
              severity="secondary"
              @click="clearFilters"
              icon="pi pi-times"
          />
          <Button
              label="اعمال فیلتر"
              @click="applyFilters"
              icon="pi pi-check"
          />
        </div>
      </template>
    </Card>

    <!-- جدول درخواست‌ها -->
    <Card>
      <template #content>
        <DataTable
            :value="requests"
            :loading="loading"
            stripedRows
            paginator
            :rows="10"
            :rowsPerPageOptions="[15, 25, 50, 100]"
            :totalRecords="pagination.total"
            :first="pagination.first"
            @page="onPageChange"
            lazy
            class="p-datatable-sm"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-semibold">
                {{ pagination.total }} درخواست یافت شد
              </span>
              <Button
                  icon="pi pi-download"
                  label="خروجی اکسل"
                  severity="success"
                  size="small"
                  @click="exportToExcel"
              />
            </div>
          </template>

          <Column field="id" header="#" style="width: 60px" />

          <Column field="user.name" header="کاربر" style="min-width: 150px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar
                    :label="getInitials(data.user?.name)"
                    shape="circle"
                    size="small"
                    class="bg-blue-500 text-white"
                />
                <span>{{ data.user?.name || '-' }}</span>
              </div>
            </template>
          </Column>

          <Column field="title" header="موضوع" style="min-width: 200px">
            <template #body="{ data }">
              <div class="truncate max-w-xs" :title="data.title">
                {{ data.title }}
              </div>
            </template>
          </Column>

          <Column field="template.name" header="نوع نامه" style="min-width: 150px" />

          <Column field="automation_letter_number" header="شماره نامه" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                  v-if="data.automation_letter_number"
                  :value="data.automation_letter_number"
                  severity="info"
                  size="small"
              />
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </Column>

          <Column field="status" header="وضعیت" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                  :value="data.status_label"
                  :severity="getStatusSeverity(data.status)"
                  size="small"
              />
            </template>
          </Column>

          <Column field="created_at" header="تاریخ ثبت" style="min-width: 120px">
            <template #body="{ data }">
              <div class="text-sm">
                <div>{{ data.created_at }}</div>
                <div class="text-gray-500 text-xs">{{ data.created_at_time }}</div>
              </div>
            </template>
          </Column>

          <Column field="sent_at" header="تاریخ ارسال" style="min-width: 120px">
            <template #body="{ data }">
              <span v-if="data.sent_at" class="text-sm">
                {{ data.sent_at }}
              </span>
              <span v-else class="text-gray-400 text-sm">-</span>
            </template>
          </Column>

          <Column header="عملیات" style="width: 150px" class="text-center">
            <template #body="{ data }">
              <div class="flex gap-1 justify-center">
                <Button
                    icon="pi pi-eye"
                    severity="info"
                    text
                    size="small"
                    @click="viewRequest(data.id)"
                    v-tooltip="'مشاهده جزئیات'"
                />
                <Button
                    icon="pi pi-file-pdf"
                    severity="danger"
                    text
                    size="small"
                    @click="printLetter(data)"
                    v-tooltip="'چاپ نامه'"
                    v-if="data.status === 'completed'"
                />
                <Button
                    icon="pi pi-cog"
                    severity="warning"
                    text
                    size="small"
                    @click="showActions(data)"
                    v-tooltip="'مدیریت'"
                    v-if="canManage(data)"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-6xl text-gray-300 mb-3"></i>
              <p class="text-gray-500">هیچ درخواستی یافت نشد</p>
            </div>
          </template>

          <template #loading>
            <div class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
              <p class="text-gray-500 mt-2">در حال بارگذاری...</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog مشاهده جزئیات -->
    <Dialog
        v-model:visible="showDetailDialog"
        header="جزئیات درخواست"
        :style="{ width: '700px' }"
        :modal="true"
    >
      <div v-if="selectedRequest">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">کاربر</label>
            <div class="font-semibold">{{ selectedRequest.user?.name }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">نوع نامه</label>
            <div class="font-semibold">{{ selectedRequest.template?.name }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">موضوع</label>
            <div class="font-semibold">{{ selectedRequest.title }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">شماره نامه</label>
            <div class="font-semibold">{{ selectedRequest.automation_letter_number || '-' }}</div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">وضعیت</label>
            <Tag
                :value="selectedRequest.status_label"
                :severity="getStatusSeverity(selectedRequest.status)"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">تاریخ ثبت</label>
            <div>{{ selectedRequest.created_at }}</div>
          </div>
        </div>

        <!-- گردش کار -->
        <div class="mb-4">
          <h3 class="font-semibold mb-3">گردش کار</h3>
          <Timeline :value="selectedRequest.workflow_logs || []" align="left">
            <template #content="slotProps">
              <div class="p-3 bg-gray-50 rounded-lg mb-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold">{{ slotProps.item.action_name }}</span>
                  <Tag
                      :value="slotProps.item.state_label"
                      :severity="getStateSeverity(slotProps.item.state)"
                      size="small"
                  />
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  <div>تاریخ دریافت: {{ slotProps.item.receive_date || '-' }}</div>
                  <div v-if="slotProps.item.response_date">
                    تاریخ پاسخ: {{ slotProps.item.response_date }}
                  </div>
                  <div v-if="slotProps.item.response_text" class="mt-1 text-xs">
                    توضیحات: {{ slotProps.item.response_text }}
                  </div>
                </div>
              </div>
            </template>
          </Timeline>
        </div>
      </div>
      <template #footer>
        <Button label="بستن" severity="secondary" @click="showDetailDialog = false" />
        <Button
            label="چاپ نامه"
            icon="pi pi-print"
            @click="printLetter(selectedRequest)"
            v-if="selectedRequest?.status === 'completed'"
        />
      </template>
    </Dialog>

    <!-- Dialog مدیریت -->
    <Dialog
        v-model:visible="showActionsDialog"
        header="مدیریت درخواست"
        :style="{ width: '500px' }"
        :modal="true"
    >
      <div v-if="selectedRequest">
        <div class="field mb-4">
          <label class="block text-sm text-gray-600 mb-2">تغییر وضعیت</label>
          <Select
              v-model="actionForm.status"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
          />
        </div>

        <div class="field mb-4">
          <label class="block text-sm text-gray-600 mb-2">یادداشت</label>
          <Textarea
              v-model="actionForm.note"
              rows="3"
              placeholder="یادداشت مدیریتی..."
              class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" @click="showActionsDialog = false" />
        <Button
            label="ذخیره تغییرات"
            @click="saveAction"
            :loading="saving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/axios'
import {
  Card, Button, DataTable, Column, Tag, Avatar,
  Select, Dialog, Textarea, Timeline, DatePicker
} from 'primevue'
import { showToast } from '@/plugins/toast'
//import * as XLSX from 'xlsx'

const requests = ref([])
const templates = ref([])
const users = ref([])
const loading = ref(false)
const saving = ref(false)
const showDetailDialog = ref(false)
const showActionsDialog = ref(false)
const selectedRequest = ref(null)

const stats = reactive({
  total: 0,
  pending: 0,
  completed: 0,
  rejected: 0,
})

const pagination = reactive({
  total: 0,
  first: 0,
  perPage: 15,
})

const filters = reactive({
  status: null,
  template_id: null,
  user_id: null,
  date_range: null,
})

const actionForm = reactive({
  status: '',
  note: '',
})

const statusOptions = [
  { label: 'همه', value: null },
  { label: 'در انتظار', value: 'pending' },
  { label: 'در حال پردازش', value: 'processing' },
  { label: 'ارسال شده', value: 'sent' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'رد شده', value: 'rejected' },
  { label: 'خطا', value: 'failed' },
]

const fetchRequests = async () => {
  loading.value = true
  try {
    const params = {
      page: Math.floor(pagination.first / pagination.perPage) + 1,
      per_page: pagination.perPage,
      ...filters,
    }

    const { data } = await api.get('/virtual-secretariat/requests', { params })

    requests.value = data.data.data
    pagination.total = data.data.total || 0

    // به‌روزرسانی آمار
    updateStats(data.data)
  } catch (error) {
    console.error(error)
    showToast({
      severity: 'error',
      summary: 'خطا در دریافت اطلاعات',
      detail: error.response?.data?.message || 'خطایی رخ داد'
    })
  } finally {
    loading.value = false
  }
}

const fetchTemplates = async () => {
  try {
    const { data } = await api.get('/virtual-secretariat/templates')
    templates.value = [
      { id: null, name: 'همه انواع' },
      ...data.data.filter(t => t.is_active)
    ]
  } catch (error) {
    console.error(error)
  }
}

const fetchUsers = async () => {
  try {
    const { data } = await api.get('/users', { params: { per_page: 1000 } })
    users.value = [
      { id: null, name: 'همه کاربران' },
      ...(data.data?.data || data.data || [])
    ]
  } catch (error) {
    console.error(error)
  }
}

const updateStats = (data) => {
  stats.total = data.total || 0
  stats.pending = data.stats?.pending || 0
  stats.completed = data.stats?.completed || 0
  stats.rejected = data.stats?.rejected || 0
}

const onPageChange = (event) => {
  pagination.first = event.first
  pagination.perPage = event.rows
  fetchRequests()
}

const applyFilters = () => {
  pagination.first = 0
  fetchRequests()
}

const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = null
  })
  pagination.first = 0
  fetchRequests()
}

const viewRequest = async (id) => {
  try {
    const { data } = await api.get(`/virtual-secretariat/requests/${id}`)
    selectedRequest.value = data.data
    showDetailDialog.value = true
  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در دریافت جزئیات',
    })
  }
}

const showActions = (request) => {
  selectedRequest.value = request
  actionForm.status = request.status
  actionForm.note = ''
  showActionsDialog.value = true
}

const saveAction = async () => {
  saving.value = true
  try {
    await api.put(`/virtual-secretariat/requests/${selectedRequest.value.id}/status`, {
      status: actionForm.status,
      note: actionForm.note,
    })

    showToast({
      severity: 'success',
      summary: 'تغییرات با موفقیت ذخیره شد',
    })

    showActionsDialog.value = false
    fetchRequests()
  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در ذخیره تغییرات',
    })
  } finally {
    saving.value = false
  }
}

const printLetter = (request) => {
  // TODO: Implement print functionality
  showToast({
    severity: 'info',
    summary: 'در حال آماده‌سازی چاپ...',
  })
}

const exportToExcel = () => {
  const data = requests.value.map(r => ({
    'شناسه': r.id,
    'کاربر': r.user?.name,
    'موضوع': r.title,
    'نوع نامه': r.template?.name,
    'شماره نامه': r.automation_letter_number || '-',
    'وضعیت': r.status_label,
    'تاریخ ثبت': r.created_at,
    'تاریخ ارسال': r.sent_at || '-',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'درخواست‌ها')

  XLSX.writeFile(wb, `requests-${new Date().toISOString().split('T')[0]}.xlsx`)

  showToast({
    severity: 'success',
    summary: 'خروجی اکسل با موفقیت دانلود شد',
  })
}

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warn',
    processing: 'info',
    sent: 'info',
    completed: 'success',
    rejected: 'danger',
    failed: 'danger',
  }
  return map[status] || 'secondary'
}

const getStateSeverity = (state) => {
  const map = {
    waiting: 'warn',
    in_progress: 'info',
    finished: 'success',
    rejected: 'danger',
  }
  return map[state] || 'secondary'
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name[0]
}

const canManage = (request) => {
  return request.status !== 'completed' && request.status !== 'rejected'
}

onMounted(() => {
  fetchRequests()
  fetchTemplates()
  fetchUsers()
})
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}
</style>