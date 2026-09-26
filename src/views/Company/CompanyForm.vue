<script setup>
import { ref, watch } from 'vue'
import api from '@/api/axios'

const props = defineProps({
  visible: Boolean,
  companyId: { type: Number, default: null },
})

const emit = defineEmits(['update:visible', 'saved'])

const form = ref({
  name: '',
  code: '',
  registration_number: '',
  tax_number: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: '',
  is_active: true,
})

const loading = ref(false)

watch(() => props.visible, async (val) => {
  if (val && props.companyId) {
    // edit mode — load data
    const { data } = await api.get(`/companies/${props.companyId}`)
    Object.assign(form.value, data.data)
  } else if (val) {
    // create mode — reset
    Object.assign(form.value, {
      name: '', code: '', registration_number: '',
      tax_number: '', address: '', phone: '',
      email: '', website: '', logo: '', is_active: true,
    })
  }
})

async function submit() {
  loading.value = true
  try {
    if (props.companyId) {
      await api.put(`/companies/${props.companyId}`, form.value)
    } else {
      await api.post('/companies', form.value)
    }
    emit('saved')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
      :visible="visible"
      @update:visible="emit('update:visible', $event)"
      :header="companyId ? 'ویرایش شرکت' : 'افزودن شرکت'"
      :style="{ width: '600px' }"
      modal
      dir="rtl"
  >
    <div class="grid grid-cols-2 gap-4">
      <div class="flex flex-col gap-1">
        <label>نام شرکت</label>
        <InputText v-model="form.name" />
      </div>
      <div class="flex flex-col gap-1">
        <label>کد</label>
        <InputText v-model="form.code" />
      </div>
      <div class="flex flex-col gap-1">
        <label>شماره ثبت</label>
        <InputText v-model="form.registration_number" />
      </div>
      <div class="flex flex-col gap-1">
        <label>شناسه مالیاتی</label>
        <InputText v-model="form.tax_number" />
      </div>
      <div class="flex flex-col gap-1">
        <label>تلفن</label>
        <InputText v-model="form.phone" />
      </div>
      <div class="flex flex-col gap-1">
        <label>ایمیل</label>
        <InputText v-model="form.email" />
      </div>
      <div class="flex flex-col gap-1">
        <label>وبسایت</label>
        <InputText v-model="form.website" />
      </div>
      <div class="flex flex-col gap-1 col-span-2">
        <label>آدرس</label>
        <Textarea v-model="form.address" rows="2" />
      </div>
      <div class="flex items-center gap-2">
        <Checkbox v-model="form.is_active" :binary="true" />
        <label>فعال</label>
      </div>
    </div>

    <template #footer>
      <Button
          label="انصراف"
          severity="secondary"
          @click="emit('update:visible', false)"
      />
      <Button
          :label="companyId ? 'ذخیره تغییرات' : 'ثبت شرکت'"
          :loading="loading"
          @click="submit"
      />
    </template>
  </Dialog>
</template>
