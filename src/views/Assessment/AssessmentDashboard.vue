<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Hero Section
    ═══════════════════════════════════════════ -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 m-0">
              داشبورد ارزیابی شایستگی
            </h1>
            <p class="text-sm text-gray-500 m-0 mt-1">
              نمای کلی از وضعیت ارزیابی‌ها و شناسنامه‌های شایستگی
            </p>
          </div>
          <div class="flex gap-2">
            <Button
                icon="pi pi-refresh"
                label="بروزرسانی"
                severity="secondary"
                outlined
                :loading="loading"
                @click="loadDashboard"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ══════════════════════════════════════════
         Stats Cards
    ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="bg-blue-50 p-5 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-blue-600 text-sm font-medium">شناسنامه‌های شایستگی</div>
            <div class="text-3xl font-bold text-blue-800 mt-2">
              {{ stats.total_posts || 0 }}
            </div>
            <div class="text-xs text-blue-600 mt-1">
              {{ stats.active_posts || 0 }} فعال
            </div>
          </div>
          <i class="pi pi-book text-4xl text-blue-400"></i>
        </div>
      </div>

      <div class="bg-emerald-50 p-5 rounded-lg border border-emerald-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-emerald-600 text-sm font-medium">ارزیابی‌های انجام شده</div>
            <div class="text-3xl font-bold text-emerald-800 mt-2">
              {{ stats.total_assessments || 0 }}
            </div>
            <div class="text-xs text-emerald-600 mt-1">
              {{ stats.approved_assessments || 0 }} تایید شده
            </div>
          </div>
          <i class="pi pi-check-circle text-4xl text-emerald-400"></i>
        </div>
      </div>

      <div class="bg-amber-50 p-5 rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-amber-600 text-sm font-medium">در انتظار ارزیابی</div>
            <div class="text-3xl font-bold text-amber-800 mt-2">
              {{ stats.pending_assessments || 0 }}
            </div>
            <div class="text-xs text-amber-600 mt-1">
              {{ stats.draft_assessments || 0 }} پیش‌نویس
            </div>
          </div>
          <i class="pi pi-clock text-4xl text-amber-400"></i>
        </div>
      </div>

      <div class="bg-purple-50 p-5 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-purple-600 text-sm font-medium">چرخه‌های ارزیابی</div>
            <div class="text-3xl font-bold text-purple-800 mt-2">
              {{ stats.total_cycles || 0 }}
            </div>
            <div class="text-xs text-purple-600 mt-1">
              {{ stats.active_cycles || 0 }} فعال
            </div>
          </div>
          <i class="pi pi-sync text-4xl text-purple-400"></i>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Charts Section
    ═══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Assessment Status Chart -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-pie text-blue-500"></i>
            <span class="font-bold text-gray-800">وضعیت ارزیابی‌ها</span>
          </div>
        </template>
        <template #content>
          <div class="h-64 flex items-center justify-center">
            <canvas ref="statusChart"></canvas>
          </div>
        </template>
      </Card>

      <!-- Family Coverage Chart -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-emerald-500"></i>
            <span class="font-bold text-gray-800">پوشش خانواده‌های شغلی</span>
          </div>
        </template>
        <template #content>
          <div class="h-64 flex items-center justify-center">
            <canvas ref="familyChart"></canvas>
          </div>
        </template>
      </Card>
    </div>

    <!-- ══════════════════════════════════════════
         Recent Assessments & Quick Actions
    ══════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Assessments -->
      <Card class="lg:col-span-2">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-list text-purple-500"></i>
              <span class="font-bold text-gray-800">آخرین ارزیابی‌ها</span>
            </div>
            <Button
                label="مشاهده همه"
                severity="secondary"
                text
                size="small"
                @click="router.push({ name: 'assessment.tasks' })"
            />
          </div>
        </template>
        <template #content>
          <DataTable
              :value="recentAssessments"
              :loading="loading"
              stripedRows
              size="small"
              emptyMessage="ارزیابی یافت نشد"
          >
            <Column header="کارمند">
              <template #body="{ data }">
                <div class="font-medium text-gray-800">
                  {{ data.employee?.name || '—' }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ data.post?.title || '—' }}
                </div>
              </template>
            </Column>

            <Column field="status" header="وضعیت">
              <template #body="{ data }">
                <Tag
                    :value="getStatusLabel(data.status)"
                    :severity="getStatusSeverity(data.status)"
                    size="small"
                />
              </template>
            </Column>

            <Column field="submitted_at" header="تاریخ">
              <template #body="{ data }">
                {{ data.submitted_at ? formatDate(data.submitted_at) : '—' }}
              </template>
            </Column>

            <Column header="عملیات" style="width: 100px">
              <template #body="{ data }">
                <Button
                    icon="pi pi-eye"
                    severity="info"
                    size="small"
                    text
                    @click="viewAssessment(data)"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Quick Actions -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-bolt text-amber-500"></i>
            <span class="font-bold text-gray-800">دسترسی سریع</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <Button
                label="شناسنامه‌های شایستگی"
                icon="pi pi-book"
                severity="primary"
                class="w-full justify-start"
                @click="router.push({ name: 'assessment.profiles' })"
            />
            <Button
                label="ارزیابی‌های من"
                icon="pi pi-clipboard"
                severity="success"
                class="w-full justify-start"
                @click="router.push({ name: 'assessment.tasks' })"
            />
            <Button
                label="تخصیص خودکار"
                icon="pi pi-bolt"
                severity="warning"
                class="w-full justify-start"
                @click="router.push({ name: 'assessment.auto-assign' })"
            />
            <Button
                label="روش‌های رفع خلا"
                icon="pi pi-wrench"
                severity="info"
                class="w-full justify-start"
                @click="router.push({ name: 'assessment.methods' })"
            />
            <Button
                label="کارنامه شایستگی من"
                icon="pi pi-chart-bar"
                severity="secondary"
                class="w-full justify-start"
                @click="router.push({ name: 'assessment/my-report' })"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'
import assessmentService from '@/services/assessmentService'
import { useToast } from 'primevue/usetoast'

// ثبت Chart.js
Chart.register(...registerables)

const router = useRouter()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const loading = ref(false)
const stats = ref({})
const recentAssessments = ref([])
const statusChart = ref(null)
const familyChart = ref(null)

let statusChartInstance = null
let familyChartInstance = null

// ══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await loadDashboard()
})

onUnmounted(() => {
  if (statusChartInstance) statusChartInstance.destroy()
  if (familyChartInstance) familyChartInstance.destroy()
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadDashboard() {
  loading.value = true
  try {
    // دریافت آمار داشبورد
    const statsData = await assessmentService.getDashboardStats()
    stats.value = statsData.stats || {}

    // دریافت آخرین ارزیابی‌ها
    const assessmentsData = await assessmentService.getAssessments({ limit: 5 })
    recentAssessments.value = assessmentsData.assessments || []

    // رسم نمودارها
    drawStatusChart()
    drawFamilyChart()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت اطلاعات داشبورد',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

function drawStatusChart() {
  if (statusChartInstance) statusChartInstance.destroy()

  const ctx = statusChart.value?.getContext('2d')
  if (!ctx) return

  const data = {
    labels: ['پیش‌نویس', 'تکمیل شده', 'تایید شده', 'برگشت خورده'],
    datasets: [
      {
        data: [
          stats.value.draft_assessments || 0,
          stats.value.submitted_assessments || 0,
          stats.value.approved_assessments || 0,
          stats.value.rejected_assessments || 0,
        ],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
      },
    ],
  }

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Vazir', size: 12 },
            padding: 15,
          },
        },
      },
    },
  })
}

function drawFamilyChart() {
  if (familyChartInstance) familyChartInstance.destroy()

  const ctx = familyChart.value?.getContext('2d')
  if (!ctx) return

  // داده‌های نمونه - در واقعیت از بک‌اند دریافت می‌شود
  const data = {
    labels: ['مدیر', 'رئیس', 'سرپرست', 'کارشناس', 'کاردان', 'متصدی'],
    datasets: [
      {
        label: 'تعداد شناسنامه',
        data: [5, 12, 18, 25, 15, 8],
        backgroundColor: '#8b5cf6',
        borderRadius: 5,
      },
    ],
  }

  familyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { family: 'Vazir', size: 11 },
          },
        },
        x: {
          ticks: {
            font: { family: 'Vazir', size: 11 },
          },
        },
      },
    },
  })
}

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

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fa-IR')
}

function viewAssessment(assessment) {
  router.push({
    name: 'assessment.report',
    params: { id: assessment.id },
  })
}
</script>

<style scoped>
:deep(.p-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.p-card-title) {
  font-size: 1.1rem;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}
</style>