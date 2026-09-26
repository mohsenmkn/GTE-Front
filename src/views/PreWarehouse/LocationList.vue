<template>
  <div class="p-6">
    <div class="mb-6">
      <Button
          icon="pi pi-arrow-right"
          label="بازگشت"
          severity="secondary"
          @click="$router.back()"
          class="mb-4"
      />
      <h1 class="text-2xl font-bold text-gray-800">محل‌های انبار</h1>
      <p class="text-gray-500 mt-1">
        انبار: <strong>{{ warehouseName }}</strong>
      </p>
    </div>

    <div class="flex justify-end mb-4">
      <Button
          label="افزودن محل جدید"
          icon="pi pi-plus"
          @click="openAddDialog"
          class="bg-blue-600 hover:bg-blue-700 text-white"
      />
    </div>

    <Card>
      <template #content>
        <DataTable
            :value="store.warehouseLocations"
            :loading="store.loading"
            striped-rows
            class="w-full"
        >
          <Column field="id" header="#" style="width: 60px" />
          <Column field="name" header="نام محل" />
          <Column field="code" header="کد" />
          <Column field="section" header="بخش" />
          <Column header="وضعیت">
            <template #body="{ data }">
              <Tag
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
                  :severity="data.is_active ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column header="عملیات" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    size="small"
                    @click="openEditDialog(data)"
                    v-tooltip.bottom="'ویرایش'"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    @click="confirmDelete(data)"
                    v-tooltip.bottom="'حذف'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Add/Edit Dialog -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="isEdit ? 'ویرایش محل' : 'افزودن محل جدید'"
        :style="{ width: '500px' }"
        modal
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            نام محل <span class="text-red-500">*</span>
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
            کد
          </label>
          <InputText
              v-model="form.code"
              class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            بخش
          </label>
          <InputText
              v-model="form.section"
              class="w-full"
              placeholder="مثلاً: لودرها"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            توضیحات
          </label>
          <Textarea
              v-model="form.description"
              rows="2"
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

        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
              label="انصراف"
              severity="secondary"
              @click="dialogVisible = false"
          />
          <Button
              :label="isEdit ? 'ذخیره' : 'ثبت'"
              type="submit"
              :loading="submitting"
              class="bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      </form>
    </Dialog>

    <!-- Delete Confirm -->
    <Dialog
        v-model:visible="deleteDialogVisible"
        header="تأیید حذف"
        :style="{ width: '450px' }"
        modal
    >
      <p class="text-gray-600">
        آیا از حذف محل <strong>{{ selectedItem?.name }}</strong> اطمینان دارید؟
      </p>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="deleteDialogVisible = false"
        />
        <Button
            label="حذف"
            severity="danger"
            :loading="deleting"
            @click="submitDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import api from '@/api/axios'

const route = useRoute()
const store = usePreWarehouseStore()

const warehouseId = route.params.id
const warehouseName = ref('')

const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const selectedLocationId = ref(null)
const selectedItem = ref(null)
const submitting = ref(false)
const deleting = ref(false)
const errors = ref({})

const form = ref({
  name: '',
  code: '',
  section: '',
  description: '',
  is_active: true,
})

const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    section: '',
    description: '',
    is_active: true,
  }
  errors.value = {}
}

const openAddDialog = () => {
  isEdit.value = false
  selectedLocationId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (location) => {
  isEdit.value = true
  selectedLocationId.value = location.id
  form.value = {
    name: location.name,
    code: location.code || '',
    section: location.section || '',
    description: location.description || '',
    is_active: location.is_active,
  }
  errors.value = {}
  dialogVisible.value = true
}

const submitForm = async () => {
  errors.value = {}
  submitting.value = true

  try {
    if (isEdit.value) {
      await store.updateLocation(warehouseId, selectedLocationId.value, form.value)
    } else {
      await store.createLocation(warehouseId, form.value)
    }
    dialogVisible.value = false
    await loadLocations()
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (location) => {
  selectedItem.value = location
  deleteDialogVisible.value = true
}

const submitDelete = async () => {
  deleting.value = true
  try {
    await store.deleteLocation(warehouseId, selectedItem.value.id)
    deleteDialogVisible.value = false
    await loadLocations()
  } catch (error) {
    // handled in store
  } finally {
    deleting.value = false
  }
}

const loadLocations = async () => {
  await store.fetchLocations(warehouseId)
}

onMounted(async () => {
  try {
    const response = await api.get(`/pre-warehouse/warehouses/${warehouseId}`)
    warehouseName.value = response.data.data.name
  } catch (error) {
    console.error('Error loading warehouse:', error)
  }
  await loadLocations()
})
</script>