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
        {{ isEdit ? 'ویرایش انبار' : 'ثبت انبار جدید' }}
      </h1>
    </div>

    <Card>
      <template #content>
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                نام انبار <span class="text-red-500">*</span>
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
                کد انبار <span class="text-red-500">*</span>
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
                تلفن
              </label>
              <InputText
                  v-model="form.phone"
                  class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                مدیر انبار
              </label>
              <Select
                  v-model="form.manager_id"
                  :options="users"
                  option-label="name"
                  option-value="id"
                  placeholder="انتخاب مدیر..."
                  class="w-full"
                  filter
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                آدرس
              </label>
              <Textarea
                  v-model="form.address"
                  rows="2"
                  class="w-full"
              />
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
                :label="isEdit ? 'ذخیره تغییرات' : 'ثبت انبار'"
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
import api from '@/api/axios'

const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const errors = ref({})
const users = ref([])

const form = ref({
  name: '',
  code: '',
  description: '',
  address: '',
  phone: '',
  manager_id: null,
  is_active: true,
})

const submitForm = async () => {
  errors.value = {}
  submitting.value = true

  try {
    if (isEdit.value) {
      await store.updateWarehouse(route.params.id, form.value)
    } else {
      await store.createWarehouse(form.value)
    }
    router.push({ name: 'pre-warehouse.warehouses' })
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  // بارگذاری لیست کاربران برای Select مدیر
  try {
    const response = await api.get('/users', { params: { per_page: 1000 } })
    users.value = response.data.data?.data || response.data.data || []
  } catch (error) {
    console.error('Error loading users:', error)
  }

  if (isEdit.value) {
    try {
      const response = await api.get(`/pre-warehouse/warehouses/${route.params.id}`)
      const warehouse = response.data.data
      form.value = {
        name: warehouse.name,
        code: warehouse.code,
        description: warehouse.description || '',
        address: warehouse.address || '',
        phone: warehouse.phone || '',
        manager_id: warehouse.manager?.id || null,
        is_active: warehouse.is_active,
      }
    } catch (error) {
      router.push({ name: 'pre-warehouse.warehouses' })
    }
  }
})
</script>