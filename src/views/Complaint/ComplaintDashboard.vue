<template>
  <div class="p-6 space-y-6">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        داشبورد آماری شکایات
      </h1>

      <div class="flex gap-2">
        <Button
            label="لیست شکایات"
            icon="pi pi-list"
            class="p-button-secondary"
            @click="router.push({ name: 'complaints.admin.index' })"
        />
        <Button
            label="به‌روزرسانی"
            icon="pi pi-refresh"
            class="p-button-outlined"
            :loading="loading"
            @click="fetchStatistics"
        />
      </div>
    </div>

    <div v-if="loading && !stats" class="text-center py-10">
      <ProgressSpinner />
    </div>

    <template v-else-if="stats">

      <!-- ═══════ Row 1: Overview Cards ═══════ -->
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

        <div class="bg-white rounded-xl border p-5 shadow-sm">
          <div class="text-sm text-gray-500 mb-1">کل شکایات</div>
          <div class="text-3xl font-bold text-gray-800">{{ stats.overview.total }}</div>
        </div>

        <div class="bg-white rounded-xl border p-5 shadow-sm border-r-4 border-r-orange-400">
          <div class="text-sm text-gray-500 mb-1">در انتظار بررسی</div>
          <div class="text-3xl font-bold text-orange-500">{{ stats.overview.pending }}</div>
        </div>

        <div class="bg-white rounded-xl border p-5 shadow-sm border-r-4 border-r-blue-400">
          <div class="text-sm text-gray-500 mb-1">در حال رسیدگی</div>
          <div class="text-3xl font-bold text-blue-500">{{ stats.overview.in_progress }}</div>
        </div>

        <div class="bg-white rounded-xl border p-5 shadow-sm border-r-4 border-r-green-400">
          <div class="text-sm text-gray-500 mb-1">پاسخ داده شده</div>
          <div class="text-3xl font-bold text-green-500">{{ stats.overview.answered }}</div>
        </div>

        <div class="bg-white rounded-xl border p-5 shadow-sm border-r-4 border-r-teal-400">
          <div class="text-sm text-gray-500 mb-1">بسته شده</div>
          <div class="text-3xl font-bold text-teal-500">{{ stats.overview.resolved }}</div>
        </div>

        <div class="bg-white rounded-xl border p-5 shadow-sm border-r-4 border-r-red-400">
          <div class="text-sm text-gray-500 mb-1">بحرانی باز</div>
          <div class="text-3xl font-bold text-red-500">{{ stats.overview.critical_open }}</div>
        </div>

      </div>

      <!-- ═══════ Row 2: Charts ═══════ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Status Doughnut -->
        <Card>
          <template #title>توزیع وضعیت شکایات</template>
          <template #content>
            <div class="flex justify-center" style="height: 300px">
              <Chart type="doughnut" :data="statusChartData" :options="doughnutOptions" />
            </div>
          </template>
        </Card>

        <!-- Priority Bar -->
        <Card>
          <template #title>توزیع اولویت شکایات</template>
          <template #content>
            <div style="height: 300px">
              <Chart type="bar" :data="priorityChartData" :options="barOptions" />
            </div>
          </template>
        </Card>

      </div>

      <!-- ═══════ Row 3: Monthly Trend ═══════ -->
      <Card>
        <template #title>روند شکایات در ۱۲ ماه اخیر</template>
        <template #content>
          <div style="height: 350px">
            <Chart type="bar" :data="monthlyTrendData" :options="monthlyTrendOptions" />
          </div>
        </template>
      </Card>

      <!-- ═══════ Row 4: Domain + Top Categories ═══════ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Domain Distribution -->
        <Card>
          <template #title>توزیع شکایات بر اساس حوزه</template>
          <template #content>
            <div class="space-y-4">
              <div v-for="domain in stats.by_domain" :key="domain.id">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-gray-700">{{ domain.title }}</span>
                  <span class="text-gray-500">
                                        {{ domain.count }}
                                        <span class="text-xs">({{ domain.percentage }}%)</span>
                                    </span>
                </div>
                <ProgressBar
                    :value="domain.percentage"
                    :showValue="false"
                    style="height: 8px"
                />
              </div>

              <div v-if="!stats.by_domain.length" class="text-center text-gray-400 py-4">
                داده‌ای موجود نیست.
              </div>
            </div>
          </template>
        </Card>

        <!-- Top Categories -->
        <Card>
          <template #title>پرتکرارترین موضوعات شکایت</template>
          <template #content>
            <div class="space-y-3">
              <div
                  v-for="(cat, index) in stats.top_categories"
                  :key="cat.id"
                  class="flex items-center gap-3"
              >
                                <span
                                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    :class="index < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'"
                                >
                                    {{ index + 1 }}
                                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-gray-700 truncate">{{ cat.title }}</div>
                </div>
                <Tag :value="String(cat.count)" severity="info" />
              </div>

              <div v-if="!stats.top_categories.length" class="text-center text-gray-400 py-4">
                داده‌ای موجود نیست.
              </div>
            </div>
          </template>
        </Card>

      </div>

      <!-- ═══════ Row 5: Response Stats + Recent ═══════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Response Stats -->
        <Card>
          <template #title>آمار پاسخگویی</template>
          <template #content>
            <div class="space-y-5">

              <div class="text-center">
                <div class="text-4xl font-bold text-blue-600">
                  {{ stats.response_stats.response_rate }}%
                </div>
                <div class="text-sm text-gray-500 mt-1">نرخ پاسخگویی</div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-3 text-center">
                  <div class="text-lg font-bold text-gray-700">
                    {{ stats.response_stats.avg_response_hours }}
                  </div>
                  <div class="text-xs text-gray-500">میانگین پاسخ (ساعت)</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3 text-center">
                  <div class="text-lg font-bold text-gray-700">
                    {{ stats.response_stats.total_unanswered }}
                  </div>
                  <div class="text-xs text-gray-500">بدون پاسخ</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-50 rounded-lg p-3 text-center">
                  <div class="text-lg font-bold text-green-600">
                    {{ stats.response_stats.min_response_hours }}
                  </div>
                  <div class="text-xs text-gray-500">سریع‌ترین پاسخ (ساعت)</div>
                </div>
                <div class="bg-red-50 rounded-lg p-3 text-center">
                  <div class="text-lg font-bold text-red-600">
                    {{ stats.response_stats.max_response_hours }}
                  </div>
                  <div class="text-xs text-gray-500">کندترین پاسخ (ساعت)</div>
                </div>
              </div>

            </div>
          </template>
        </Card>

        <!-- Recent Complaints -->
        <div class="lg:col-span-2">
          <Card>
            <template #title>آخرین شکایات</template>
            <template #content>
              <DataTable
                  :value="stats.recent_complaints"
                  stripedRows
                  responsiveLayout="scroll"
                  :rows="8"
              >
                <Column field="tracking_code" header="کد پیگیری" style="min-width: 150px" />
                <Column field="subject" header="موضوع" style="min-width: 200px">
                  <template #body="{ data }">
                    <span class="text-sm">{{ data.subject }}</span>
                  </template>
                </Column>
                <Column field="complainant" header="شاکی" style="min-width: 120px" />
                <Column header="وضعیت" style="min-width: 130px">
                  <template #body="{ data }">
                    <Tag
                        :severity="getStatusSeverity(data.status)"
                        :value="data.status_label"
                    />
                  </template>
                </Column>
                <Column field="jalali_date" header="تاریخ" style="min-width: 110px" />
                <Column header="" style="width: 60px">
                  <template #body="{ data }">
                    <Button
                        icon="pi pi-eye"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="viewComplaint(data)"
                    />
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>
        </div>

      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const toast = useToast()

const stats = ref(null)
const loading = ref(false)

// ─────────────────────────────────────
// Chart Data
// ─────────────────────────────────────

const statusColors = {
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  answered: '#22c55e',
  resolved: '#14b8a6',
  rejected: '#ef4444',
}

const priorityColors = {
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
}

const statusChartData = computed(() => {
  if (!stats.value) return { labels: [], datasets: [] }

  const items = stats.value.by_status.filter(s => s.count > 0)

  return {
    labels: items.map(s => s.label),
    datasets: [{
      data: items.map(s => s.count),
      backgroundColor: items.map(s => statusColors[s.value] || '#94a3b8'),
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  }
})

const priorityChartData = computed(() => {
  if (!stats.value) return { labels: [], datasets: [] }

  return {
    labels: stats.value.by_priority.map(p => p.label),
    datasets: [{
      label: 'تعداد شکایات',
      data: stats.value.by_priority.map(p => p.count),
      backgroundColor: stats.value.by_priority.map(p => priorityColors[p.value] || '#94a3b8'),
      borderRadius: 6,
    }]
  }
})

const monthlyTrendData = computed(() => {
  if (!stats.value) return { labels: [], datasets: [] }

  return {
    labels: stats.value.monthly_trend.map(m => m.month_name),
    datasets: [{
      label: 'تعداد شکایات',
      data: stats.value.monthly_trend.map(m => m.count),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  }
})

// ─────────────────────────────────────
// Chart Options
// ─────────────────────────────────────

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { family: 'inherit', size: 12 },
        padding: 16,
      }
    }
  }
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

const monthlyTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

// ─────────────────────────────────────
// Methods
// ─────────────────────────────────────

const fetchStatistics = async () => {
  loading.value = true

  try {
    const { data } = await ComplaintService.getStatistics()
    stats.value = data.data

  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: error.response?.data?.message || 'دریافت آمار با خطا مواجه شد.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
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
    rejected: 'danger',
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchStatistics()
})
</script>