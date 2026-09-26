<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">ارزیابی‌های من</h1>
        <p class="text-sm text-gray-500 mt-1">
          لیست ارزیابی‌های محول شده به شما
        </p>
      </div>
      <div class="flex gap-2">
        <Button
            icon="pi pi-refresh"
            label="بازنشانی"
            severity="secondary"
            outlined
            @click="loadAssessments"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Stats Cards
    ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div class="text-blue-600 text-sm font-medium">کل ارزیابی‌ها</div>
        <div class="text-2xl font-bold text-blue-800 mt-1">
          {{ stats.total }}
        </div>
      </div>
      <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
        <div class="text-amber-600 text-sm font-medium">در انتظار</div>
        <div class="text-2xl font-bold text-amber-800 mt-1">
          {{ stats.pending }}
        </div>
      </div>
      <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
        <div class="text-emerald-600 text-sm font-medium">تکمیل شده</div>
        <div class="text-2xl font-bold text-emerald-800 mt-1">
          {{ stats.completed }}
        </div>
      </div>
      <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <div class="text-purple-600 text-sm font-medium">تایید شده</div>
        <div class="text-2xl font-bold text-purple-800 mt-1">
          {{ stats.approved }}
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Filters
    ══════════════════════════════════════════ -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              جستجو
            </label>
            <InputText
                v-model="filters.search"
                placeholder="نام کارمند یا کد پرسنلی..."
                class="w-full"
                @input="debounceSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              وضعیت
            </label>
            <Select
                v-model="filters.status"
                :options="statusOptions"
                placeholder="همه وضعیت‌ها"
                showClear
                class="w-full"
                @change="loadAssessments"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              چرخه
            </label>
            <Select
                v-model="filters.cycle_id"
                :options="cycles"
                optionLabel="title"
                optionValue="id"
                placeholder="همه چرخه‌ها"
                showClear
                class="w-full"
                @change="loadAssessments"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Assessments Table
    ═══════════════════════════════════════════ -->
    <Card>
      <template #content>
        <DataTable
            :value="assessments"
            :loading="loading"
            stripedRows
            paginator
            :rows="15"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            class="p-datatable-sm"
            emptyMessage="ارزیابی یافت نشد"
        >
          <Column header="ردیف" style="width: 60px">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>

          <Column header="کارمند" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Avatar
                    :label="data.employee?.name?.charAt(0) || '?'"
                    shape="circle"
                    size="small"
                />
                <div>
                  <div class="font-medium text-gray-800">
                    {{ data.employee?.name || '—' }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ data.employee?.personnel_code || '' }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="post.title" header="شناسنامه" sortable>
            <template #body="{ data }">
              <div class="text-sm text-gray-700">
                {{ data.post?.title || '—' }}
              </div>
              <div class="text-xs text-gray-500" v-if="data.post?.grade">
                {{ data.post.grade }} - {{ data.post.unit }}
              </div>
            </template>
          </Column>

          <Column field="cycle.title" header="چرخه" sortable>
            <template #body="{ data }">
              <Tag
                  :value="data.cycle?.title || '—'"
                  severity="info"
              />
            </template>
          </Column>

          <Column field="status" header="وضعیت" sortable>
            <template #body="{ data }">
              <Tag
                  :value="getStatusLabel(data.status)"
                  :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>

          <Column field="submitted_at" header="تاریخ ثبت" sortable>
            <template #body="{ data }">
              {{ data.submitted_at ? formatDate(data.submitted_at) : '—' }}
            </template>
          </Column>

          <Column header="عملیات" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                    v-if="canEvaluate(data)"
                    icon="pi pi-pencil"
                    label="ارزیابی"
                    severity="primary"
                    size="small"
                    @click="goToForm(data)"
                />
                <Button
                    v-else
                    icon="pi pi-eye"
                    label="مشاهده"
                    severity="secondary"
                    size="small"
                    outlined
                    @click="goToReport(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import assessmentService from '@/services/assessmentService'
import { useToast } from 'primevue/usetoast'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const assessments = ref([])
const cycles = ref([])
const loading = ref(false)
const filters = ref({
  search: '',
  status: null,
  cycle_id: null,
})

// ═══════════════════════════════════════════════
// Status Options
// ═══════════════════════════════════════════════
const statusOptions = [
  { label: 'پیش‌نویس', value: 'draft' },
  { label: 'تکمیل شده', value: 'submitted' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'برگشت خورده', value: 'rejected' },
]

// ═══════════════════════════════════════════════
// Computed Stats
// ═══════════════════════════════════════════════
const stats = computed(() => ({
  total: assessments.value.length,
  pending: assessments.value.filter(a => a.status === 'draft' || a.status === 'rejected').length,
  completed: assessments.value.filter(a => a.status === 'submitted').length,
  approved: assessments.value.filter(a => a.status === 'approved').length,
}))

// ══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await Promise.all([
    loadAssessments(),
    loadCycles(),
  ])
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadAssessments() {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.cycle_id) params.cycle_id = filters.value.cycle_id

    const data = await assessmentService.getAssessments(params)
    assessments.value = data.assessments || []
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت ارزیابی‌ها',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

async function loadCycles() {
  try {
    const data = await assessmentService.getCycles()
    cycles.value = data.cycles || []
  } catch (e) {
    console.error('Load cycles error:', e)
  }
}

const debounceSearch = debounce(() => {
  loadAssessments()
}, 300)

function getStatusLabel(status) {
  const map = {
    draft: 'پیش‌نویس',
    submitted: 'تکمیل شده',
    approved: 'تایید شده',
    rejected: 'برگشت خورده',
  }
  return map[status] || status
}

function getStatusSeverity(status) {
  const map = {
    draft: 'warning',
    submitted: 'info',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'secondary'
}

function canEvaluate(assessment) {
  return assessment.status === 'draft' || assessment.status === 'rejected'
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fa-IR')
}

function goToForm(assessment) {
  router.push({
    name: 'assessment.form',
    params: { id: assessment.id },
  })
}

function goToReport(assessment) {
  router.push({
    name: 'assessment.report',
    params: { id: assessment.id },
  })
}
</script>