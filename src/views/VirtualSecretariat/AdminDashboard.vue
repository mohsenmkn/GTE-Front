<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">داشبورد دبیرخانه مجازی</h1>

    <div class="grid grid-cols-4 gap-4 mb-6">
      <Card v-for="stat in stats" :key="stat.label">
        <template #content>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ stat.value }}</div>
            <div class="text-gray-600">{{ stat.label }}</div>
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <Card>
        <template #title>نمودار وضعیت</template>
        <template #content>
          <canvas ref="chartCanvas"></canvas>
        </template>
      </Card>

      <Card>
        <template #title>آخرین درخواست‌ها</template>
        <template #content>
          <DataTable :value="recentRequests" stripedRows>
            <Column field="id" header="#" />
            <Column field="title" header="موضوع" />
            <Column field="user.name" header="کاربر" />
            <Column field="status_label" header="وضعیت" />
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { Card, DataTable, Column } from 'primevue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const stats = ref([])
const recentRequests = ref([])
const chartCanvas = ref(null)

const fetchDashboard = async () => {
  try {
    const [statsRes, recentRes, chartRes] = await Promise.all([
      api.get('/virtual-secretariat/dashboard/statistics'),
      api.get('/virtual-secretariat/dashboard/recent-requests'),
      api.get('/virtual-secretariat/dashboard/status-chart'),
    ])

    const statsData = statsRes.data.data
    stats.value = [
      { label: 'کل درخواست‌ها', value: statsData.total_requests },
      { label: 'در انتظار', value: statsData.pending_requests },
      { label: 'ارسال شده', value: statsData.sent_requests },
      { label: 'تکمیل شده', value: statsData.completed_requests },
    ]

    recentRequests.value = recentRes.data.data

    // رسم نمودار
    if (chartCanvas.value) {
      new Chart(chartCanvas.value, {
        type: 'doughnut',
        data: {
          labels: chartRes.data.data.map(d => d.status),
          datasets: [{
            data: chartRes.data.data.map(d => d.count),
            backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
          }]
        }
      })
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(fetchDashboard)
</script>