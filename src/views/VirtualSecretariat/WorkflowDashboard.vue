<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">

    <!-- هدر -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div class="flex items-center gap-3">
        <Button
            icon="pi pi-arrow-right"
            rounded
            text
            severity="secondary"
            @click="$router.back()"
            v-tooltip="'بازگشت'"
        />
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-800">داشبورد فرآیندها</h1>
          <p class="text-sm text-gray-500 mt-1">
            {{ access.view_all ? 'نمایش همه فرآیندها' : 'نمایش فرآیندهای واحد شما' }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button
            label="خروجی Excel"
            icon="pi pi-file-excel"
            severity="success"
            outlined
            @click="exportData"
            :loading="exporting"
        />
        <Button
            icon="pi pi-refresh"
            rounded
            text
            severity="secondary"
            @click="fetchStatistics"
            :loading="loading"
            v-tooltip="'به‌روزرسانی'"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-indigo-500"></i>
    </div>

    <!-- محتوا -->
    <div v-else class="space-y-6">

      <!-- کارت‌های آماری -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
            title="کل فرآیندها"
            :value="stats.overall.total"
            icon="pi pi-chart-bar"
            color="blue"
        />
        <StatCard
            title="تکمیل شده"
            :value="stats.overall.completed"
            icon="pi pi-check-circle"
            color="green"
        />
        <StatCard
            title="در حال انجام"
            :value="stats.overall.in_progress"
            icon="pi pi-spin pi-spinner"
            color="orange"
        />
        <StatCard
            title="فرآیندهای معوق"
            :value="stats.overall.delayed"
            icon="pi pi-exclamation-triangle"
            color="red"
            :highlight="stats.overall.delayed > 0"
        />
      </div>

      <!-- آمار تکمیلی -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-calendar text-indigo-600"></i>
            <span class="text-sm text-gray-600">امروز</span>
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats.overall.today }}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-calendar-plus text-purple-600"></i>
            <span class="text-sm text-gray-600">این هفته</span>
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats.overall.this_week }}</div>
        </div>
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-clock text-amber-600"></i>
            <span class="text-sm text-gray-600">میانگین تکمیل (روز)</span>
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ stats.overall.avg_days }}</div>
        </div>
      </div>

      <!-- نمودارها -->
      <!-- نمودار میله‌ای: فرآیندها بر اساس نوع -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-chart-bar text-blue-600"></i>
          فرآیندها بر اساس نوع
        </h3>
        <!-- ✅ اضافه کردن wrapper با ارتفاع مشخص -->
        <div class="relative" style="height: 350px;">
          <canvas ref="typeChart"></canvas>
        </div>
      </div>

      <!-- نمودار دایره‌ای: وضعیت فرآیندها -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-chart-pie text-purple-600"></i>
          وضعیت فرآیندها
        </h3>
        <!-- ✅ اضافه کردن wrapper با ارتفاع مشخص -->
        <div class="relative" style="height: 350px;">
          <canvas ref="statusChart"></canvas>
        </div>
      </div>

      <!-- نمودار خطی: روند زمانی -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-chart-line text-green-600"></i>
          روند فرآیندها (30 روز گذشته)
        </h3>
        <!-- ✅ اضافه کردن wrapper با ارتفاع مشخص -->
        <div class="relative" style="height: 400px;">
          <canvas ref="trendChart"></canvas>
        </div>
      </div>

      <!-- جداول -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- فرآیندهای معوق -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i class="pi pi-exclamation-triangle text-red-600"></i>
            فرآیندهای معوق (بیش از 7 روز)
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="p-3 text-right">نوع</th>
                <th class="p-3 text-right">کاربر</th>
                <th class="p-3 text-right">روز</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="item in stats.delayed" :key="item.ExecuteID" class="border-b hover:bg-gray-50">
                <td class="p-3">{{ item.WFName }}</td>
                <td class="p-3">{{ item.FirstName }} {{ item.LastName }}</td>
                <td class="p-3">
                  <Tag :value="item.days_elapsed + ' روز'" severity="danger" />
                </td>
              </tr>
              <tr v-if="stats.delayed.length === 0">
                <td colspan="3" class="p-6 text-center text-gray-500">
                  فرآیند معوقی وجود ندارد
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- آمار واحدها -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i class="pi pi-building text-indigo-600"></i>
            آمار بر اساس واحد
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
              <tr>
                <th class="p-3 text-right">واحد</th>
                <th class="p-3 text-right">تعداد</th>
                <th class="p-3 text-right">تکمیل</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="item in stats.by_department" :key="item.DepartmentID" class="border-b hover:bg-gray-50">
                <td class="p-3">{{ item.department_name }}</td>
                <td class="p-3">{{ item.count }}</td>
                <td class="p-3">{{ item.completed }}</td>
              </tr>
              <tr v-if="stats.by_department.length === 0">
                <td colspan="3" class="p-6 text-center text-gray-500">
                  داده‌ای وجود ندارد
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- کاربران فعال -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="pi pi-users text-blue-600"></i>
          فعال‌ترین کاربران
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
            <tr>
              <th class="p-3 text-right">نام</th>
              <th class="p-3 text-right">نام خانوادگی</th>
              <th class="p-3 text-right">نام کاربری</th>
              <th class="p-3 text-right">تعداد فرآیند</th>
              <th class="p-3 text-right">تکمیل شده</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="item in stats.by_user" :key="item.User_ID" class="border-b hover:bg-gray-50">
              <td class="p-3">{{ item.FirstName }}</td>
              <td class="p-3">{{ item.LastName }}</td>
              <td class="p-3">{{ item.UserName }}</td>
              <td class="p-3">{{ item.count }}</td>
              <td class="p-3">{{ item.completed }}</td>
            </tr>
            <tr v-if="stats.by_user.length === 0">
              <td colspan="5" class="p-6 text-center text-gray-500">
                داده‌ای وجود ندارد
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Button, Tag } from 'primevue'
import api from '@/api/axios'
import { showToast } from '@/plugins/toast'
import Chart from 'chart.js/auto'
const stats = ref({
  overall: {
    total: 0,
    completed: 0,
    in_progress: 0,
    avg_days: 0,
    today: 0,
    this_week: 0,
    delayed: 0,
  },
  by_type: [],
  by_user: [],
  by_department: [],
  trends: [],
  delayed: [],
  avg_completion: [],
})
const loading = ref(false)
const exporting = ref(false)
import StatCard from '@/views/VirtualSecretariat/components/StatCard.vue'

const access = ref({
  view_all: false,
  department_id: null,
})

// Chart instances
let typeChartInstance = null
let statusChartInstance = null
let trendChartInstance = null

const typeChart = ref(null)
const statusChart = ref(null)
const trendChart = ref(null)



const renderTypeChart = () => {
  if (typeChartInstance) typeChartInstance.destroy()

  const ctx = typeChart.value?.getContext('2d')
  if (!ctx) return

  typeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.value.by_type.map(item => item.WFName),
      datasets: [
        {
          label: 'تکمیل شده',
          data: stats.value.by_type.map(item => item.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
        {
          label: 'در حال انجام',
          data: stats.value.by_type.map(item => item.in_progress),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: 'rgb(249, 115, 22)',
          borderWidth: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ مهم
      plugins: {
        legend: {
          position: 'top',
          rtl: true,
        }
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
        }
      }
    }
  })
}

const renderStatusChart = () => {
  if (statusChartInstance) statusChartInstance.destroy()

  const ctx = statusChart.value?.getContext('2d')
  if (!ctx) return

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['تکمیل شده', 'در حال انجام'],
      datasets: [{
        data: [stats.value.overall.completed, stats.value.overall.in_progress],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
        ],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ مهم
      plugins: {
        legend: {
          position: 'bottom',
          rtl: true,
        }
      }
    }
  })
}

const renderTrendChart = () => {
  if (trendChartInstance) trendChartInstance.destroy()

  const ctx = trendChart.value?.getContext('2d')
  if (!ctx) return

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: stats.value.trends.map(item => item.date),
      datasets: [
        {
          label: 'کل فرآیندها',
          data: stats.value.trends.map(item => item.count),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'تکمیل شده',
          data: stats.value.trends.map(item => item.completed),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ مهم
      plugins: {
        legend: {
          position: 'top',
          rtl: true,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
        }
      }
    }
  })
}






const fetchStatistics = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/virtual-secretariat/workflow-dashboard/statistics')

    // اطمینان از وجود داده‌ها
    stats.value = {
      overall: data.data.overall || {
        total: 0,
        completed: 0,
        in_progress: 0,
        avg_days: 0,
        today: 0,
        this_week: 0,
        delayed: 0,
      },
      by_type: data.data.by_type || [],
      by_user: data.data.by_user || [],
      by_department: data.data.by_department || [],
      trends: data.data.trends || [],
      delayed: data.data.delayed || [],
      avg_completion: data.data.avg_completion || [],
    }

    access.value = data.access

    // رندر نمودارها بعد از لود داده‌ها
    setTimeout(() => {
      renderCharts()
    }, 100)

  } catch (error) {
    console.error('خطا در دریافت آمار:', error)
    showToast({
      severity: 'error',
      summary: 'خطا در دریافت آمار',
      detail: error.response?.data?.message || 'خطایی رخ داد'
    })
  } finally {
    loading.value = false
  }
}


const exportData = async () => {
  exporting.value = true
  try {
    const response = await api.get('/virtual-secretariat/workflow-dashboard/export', {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `workflow_statistics_${Date.now()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    showToast({
      severity: 'success',
      summary: 'خروجی Excel با موفقیت ایجاد شد'
    })
  } catch (error) {
    showToast({
      severity: 'error',
      summary: 'خطا در ایجاد خروجی',
      detail: error.response?.data?.message || 'خطایی رخ داد'
    })
  } finally {
    exporting.value = false
  }
}

const renderCharts = () => {
  renderTypeChart()
  renderStatusChart()
  renderTrendChart()
}



onMounted(() => {
  fetchStatistics()
})

onBeforeUnmount(() => {
  if (typeChartInstance) typeChartInstance.destroy()
  if (statusChartInstance) statusChartInstance.destroy()
  if (trendChartInstance) trendChartInstance.destroy()
})
</script>