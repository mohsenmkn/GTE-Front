<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">درخواست‌های من</h1>
      <Button
          label="ثبت درخواست جدید"
          icon="pi pi-plus"
          @click="$router.push({ name: 'vs.create' })"
      />
    </div>

    <!-- فیلترها -->
    <div class="flex gap-2 mb-4">
      <Select
          v-model="filters.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="فیلتر وضعیت"
          @change="fetchRequests"
      />
    </div>

    <!-- جدول -->
    <DataTable
        :value="requests"
        :loading="loading"
        stripedRows
        paginator
        :rows="15"
    >
      <Column field="id" header="#" />
      <Column field="title" header="موضوع" />
      <Column field="template.name" header="نوع نامه" />
      <Column field="automation_letter_number" header="شماره نامه" />
      <Column field="status_label" header="وضعیت">
        <template #body="{ data }">
          <Tag :value="data.status_label" :severity="getStatusSeverity(data.status)" />
        </template>
      </Column>
      <Column field="created_at" header="تاریخ ثبت" />
      <Column header="عملیات">
        <template #body="{ data }">
          <Button
              icon="pi pi-eye"
              severity="info"
              text
              @click="$router.push({ name: 'vs.show', params: { id: data.id } })"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { Button, DataTable, Column, Tag, Select } from 'primevue'

const requests = ref([])
const loading = ref(false)
const filters = ref({ status: null })

const statusOptions = [
  { label: 'در انتظار', value: 'pending' },
  { label: 'ارسال شده', value: 'sent' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'رد شده', value: 'rejected' },
]

const fetchRequests = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/virtual-secretariat/requests', {
      params: filters.value
    })
    requests.value = data.data.data
    // ✅ لاگ کامل ساختار پاسخ
    console.log('Full response:', data)
    console.log('data.data:', data.data)
    console.log('data.data.data:', data.data?.data)

    // ✅ تلاش برای پیدا کردن داده‌ها
    if (data.data?.data) {
      requests.value = data.data.data
    } else if (data.data) {
      requests.value = data.data
    } else {
      requests.value = []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const getStatusSeverity = (status) => {
  const map = {
    pending: 'warn',
    sent: 'info',
    completed: 'success',
    rejected: 'danger',
    failed: 'danger',
  }
  return map[status] || 'secondary'
}

onMounted(fetchRequests)
</script>