<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت انبارها</h1>
        <p class="text-gray-500 mt-1">لیست انبارهای پیش‌انبار</p>
      </div>
      <Button
          label="ثبت انبار جدید"
          icon="pi pi-plus"
          @click="$router.push({ name: 'pre-warehouse.warehouses.create' })"
          class="bg-blue-600 hover:bg-blue-700 text-white"
      />
    </div>

    <!-- Filters -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              جستجو
            </label>
            <InputText
                v-model="filters.search"
                placeholder="جستجو در نام یا کد..."
                class="w-full"
                @input="debounceSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              وضعیت
            </label>
            <Select
                v-model="filters.is_active"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="همه"
                class="w-full"
                @change="loadData"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Table -->
    <Card>
      <template #content>
        <DataTable
            :value="store.warehouses"
            :loading="store.loading"
            paginator
            :rows="store.warehousesPagination.per_page"
            :total-records="store.warehousesPagination.total"
            @page="onPage"
            striped-rows
            class="w-full"
            emptyMessage="هیچ انباری یافت نشد"
        >
          <Column field="id" header="#" style="width: 60px" />
          <Column field="name" header="نام انبار" />
          <Column field="code" header="کد" />
          <Column field="phone" header="تلفن" />
          <Column header="مدیر">
            <template #body="{ data }">
              {{ data.manager?.name || '-' }}
            </template>
          </Column>
          <Column header="وضعیت">
            <template #body="{ data }">
              <Tag
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
                  :severity="data.is_active ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column header="عملیات" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                    icon="pi pi-map-marker"
                    severity="info"
                    size="small"
                    @click="viewLocations(data.id)"
                    v-tooltip.bottom="'محل‌ها'"
                />
                <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    size="small"
                    @click="editWarehouse(data.id)"
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

    <!-- Delete Confirm -->
    <Dialog
        v-model:visible="deleteDialogVisible"
        header="تأیید حذف"
        :style="{ width: '450px' }"
        modal
    >
      <p class="text-gray-600">
        آیا از حذف انبار <strong>{{ selectedItem?.name }}</strong> اطمینان دارید؟
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
import { ref, watch, onMounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'

const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()

const filters = ref({
  search: '',
  is_active: null,
})

const deleteDialogVisible = ref(false)
const selectedItem = ref(null)
const deleting = ref(false)

const statusOptions = [
  { label: 'همه', value: null },
  { label: 'فعال', value: true },
  { label: 'غیرفعال', value: false },
]

let searchTimeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadData()
  }, 500)
}

const loadData = async () => {
  await store.fetchWarehouses({
    ...filters.value,
    per_page: store.warehousesPagination.per_page,
    page: store.warehousesPagination.current_page,
  })
}

const onPage = (event) => {
  store.warehousesPagination.current_page = event.page + 1
  loadData()
}

const viewLocations = (id) => {
  router.push({ name: 'pre-warehouse.warehouses.locations', params: { id } })
}

const editWarehouse = (id) => {
  router.push({ name: 'pre-warehouse.warehouses.edit', params: { id } })
}

const confirmDelete = (item) => {
  selectedItem.value = item
  deleteDialogVisible.value = true
}

const submitDelete = async () => {
  deleting.value = true
  try {
    await store.deleteWarehouse(selectedItem.value.id)
    deleteDialogVisible.value = false
    await loadData()
  } catch (error) {
    // handled in store
  } finally {
    deleting.value = false
  }
}

// ✅ راه‌حل اصلی: watch روی route
watch(
    () => route.fullPath,
    (newPath, oldPath) => {
      if (
          newPath.includes('/pre-warehouse/warehouses') &&
          !newPath.includes('/create') &&
          !newPath.includes('/edit') &&
          !newPath.includes('/locations')
      ) {
        loadData()
      }
    }
)

// ✅ onActivated برای keep-alive
onActivated(() => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>