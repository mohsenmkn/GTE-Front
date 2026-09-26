<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6">
      <Button
          icon="pi pi-arrow-right"
          label="بازگشت"
          severity="secondary"
          @click="$router.back()"
          class="mb-4"
      />
      <h1 class="text-2xl font-bold text-gray-800">
        {{ isEdit ? 'ویرایش کالا' : 'ثبت کالای جدید' }}
      </h1>
    </div>

    <Card>
      <template #content>
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                نام کالا <span class="text-red-500">*</span>
              </label>
              <InputText
                  v-model="form.name"
                  class="w-full"
                  :class="{ 'p-invalid': errors.name }"
              />
              <small v-if="errors.name" class="text-red-500">
                {{ errors.name }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                کد کالا
              </label>
              <InputText
                  v-model="form.code"
                  class="w-full"
                  :class="{ 'p-invalid': errors.code }"
              />
              <small v-if="errors.code" class="text-red-500">
                {{ errors.code }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                واحد اندازه‌گیری <span class="text-red-500">*</span>
              </label>
              <Select
                  v-model="form.unit_of_measurement"
                  :options="unitOptions"
                  placeholder="انتخاب واحد..."
                  class="w-full"
                  :class="{ 'p-invalid': errors.unit_of_measurement }"
              />
              <small v-if="errors.unit_of_measurement" class="text-red-500">
                {{ errors.unit_of_measurement }}
              </small>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <Textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                وضعیت
              </label>
              <div class="flex items-center gap-2">
                <ToggleSwitch v-model="form.is_active" />
                <span>{{ form.is_active ? 'فعال' : 'غیرفعال' }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <Button
                label="انصراف"
                severity="secondary"
                @click="$router.back()"
            />
            <Button
                :label="isEdit ? 'ذخیره تغییرات' : 'ثبت کالا'"
                type="submit"
                :loading="submitting"
                class="bg-blue-600 hover:bg-blue-700 text-white"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'

const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const errors = ref({})

const form = ref({
  name: '',
  code: '',
  description: '',
  unit_of_measurement: 'عدد',
  is_active: true,
})

const unitOptions = ['عدد', 'کیلوگرم', 'حلقه', 'متر', 'لیتر', 'بسته', 'جعبه', 'تن', 'متر مربع', 'متر مکعب']

const submitForm = async () => {
  errors.value = {}
  submitting.value = true

  try {
    if (isEdit.value) {
      await store.updateItem(route.params.id, form.value)
    } else {
      await store.createItem(form.value)
    }
    router.push({ name: 'pre-warehouse.items' })
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const response = await store.fetchItem(route.params.id)
      const item = response.data
      form.value = {
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        unit_of_measurement: item.unit_of_measurement,
        is_active: item.is_active,
      }
    } catch (error) {
      router.push({ name: 'pre-warehouse.items' })
    }
  }
})
</script>