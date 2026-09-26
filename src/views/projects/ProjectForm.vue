<script setup>
import { ref, watch } from 'vue'
import { projectService } from '@/services/projectService'
import api from '@/api/axios'

const props = defineProps({
  visible: Boolean,
  projectId: { type: Number, default: null },
})

const emit = defineEmits(['update:visible', 'saved'])

const defaultForm = () => ({
  company_id: null,
  code: '',
  name: '',
  type: null,
  location: '',
  start_date: null,
  end_date: null,
  total_budget: null,
  status: 'active',
  manager_id: null,
  description: '',
})

const form = ref(defaultForm())
const loading = ref(false)
const companies = ref([])
const managers = ref([])
const errors = ref({})

const typeOptions = [
  { label: 'عمرانی', value: 'construction' },
  { label: 'نرم‌افزاری', value: 'software' },
  { label: 'خدماتی', value: 'service' },
  { label: 'صنعتی', value: 'industrial' },
]

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'تکمیل‌شده', value: 'completed' },
  { label: 'معلق', value: 'suspended' },
  { label: 'لغوشده', value: 'cancelled' },
]

async function loadDropdowns() {
  const [companiesRes, usersRes] = await Promise.all([
    api.get('/companies?all=1'),
    api.get('/users?all=1'),
  ])
  companies.value = companiesRes.data.data
  managers.value = usersRes.data.data
}

watch(() => props.visible, async (val) => {
  errors.value = {}
  if (!val) return
  await loadDropdowns()

  if (props.projectId) {
    const { data } = await projectService.get(props.projectId)
    const p = data.data
    form.value = {
      ...p,
      start_date: p.start_date ? new Date(p.start_date) : null,
      end_date: p.end_date ? new Date(p.end_date) : null,
    }
  } else {
    form.value = defaultForm()
  }
})

async function submit() {
  loading.value = true
  errors.value = {} // پاک‌سازی خطاهای قبلی
  try {
    const payload = {
      ...form.value,
      start_date: form.value.start_date
          ? new Date(form.value.start_date).toISOString().split('T')[0]
          : null,
      end_date: form.value.end_date
          ? new Date(form.value.end_date).toISOString().split('T')[0]
          : null,
    }

    if (props.projectId) {
      await projectService.update(props.projectId, payload)
    } else {
      await projectService.create(payload)
    }

    emit('saved')
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors ?? {}
    }
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <Dialog
      :visible="visible"
      @update:visible="emit('update:visible', $event)"
      :header="projectId ? 'ویرایش پروژه' : 'پروژه جدید'"
      :style="{ width: '720px' }"
      modal
      dir="rtl"
  >
    <div class="grid grid-cols-2 gap-4">

      <div class="flex flex-col gap-1">
        <label>شرکت <span class="text-red-500">*</span></label>
        <Select
            v-model="form.company_id"
            :options="companies"
            option-label="name"
            option-value="id"
            placeholder="انتخاب شرکت"
            filter/>
        <small v-if="errors.name" class="text-red-500">
          {{ errors.companies[0] }}
        </small>
      </div>

      <div class="flex flex-col gap-1">
        <label>مدیر پروژه</label>
        <Select
            v-model="form.manager_id"
            :options="managers"
            option-label="name"
            option-value="id"
            placeholder="انتخاب مدیر"
            filter
            show-clear
        />
      </div>

      <div class="flex flex-col gap-1">
        <label>کد پروژه <span class="text-red-500">*</span></label>
        <InputText v-model="form.code" />
      </div>

      <div class="flex flex-col gap-1">
        <label>نام پروژه <span class="text-red-500">*</span></label>
        <InputText v-model="form.name" />
        <small v-if="errors.name" class="text-red-500">
          {{ errors.name[0] }}
        </small>
      </div>

      <div class="flex flex-col gap-1">
        <label>نوع پروژه</label>
        <Select
            v-model="form.type"
            :options="typeOptions"
            option-label="label"
            option-value="value"
            placeholder="انتخاب نوع"
        />
        <small v-if="errors.name" class="text-red-500">
          {{ errors.type[0] }}
        </small>
      </div>

      <div class="flex flex-col gap-1">
        <label>وضعیت</label>
        <Select
            v-model="form.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label>تاریخ شروع</label>
        <DatePicker v-model="form.start_date" date-format="yy/mm/dd" show-icon />
      </div>

      <div class="flex flex-col gap-1">
        <label>تاریخ پایان</label>
        <DatePicker v-model="form.end_date" date-format="yy/mm/dd" show-icon />
      </div>

      <div class="flex flex-col gap-1">
        <label>بودجه کل (ریال)</label>
        <InputNumber
            v-model="form.total_budget"
            :min="0"
            :max-fraction-digits="2"
            locale="fa-IR"
            mode="decimal"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label>محل اجرا</label>
        <InputText v-model="form.location" />
      </div>

      <div class="flex flex-col gap-1 col-span-2">
        <label>توضیحات</label>
        <Textarea v-model="form.description" rows="3" />
      </div>

    </div>

    <template #footer>
      <Button
          label="انصراف"
          severity="secondary"
          @click="emit('update:visible', false)"
      />
      <Button
          :label="projectId ? 'ذخیره تغییرات' : 'ثبت پروژه'"
          :loading="loading"
          @click="submit"
      />
    </template>
  </Dialog>
</template>
