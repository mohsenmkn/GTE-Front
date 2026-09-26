<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت کالاها</h1>
        <p class="text-gray-500 mt-1">لیست کالاهای پیش‌انبار</p>
      </div>
      <Button
          label="ثبت کالای جدید"
          icon="pi pi-plus"
          @click="$router.push({ name: 'pre-warehouse.items.create' })"
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
            :value="store.items"
            :loading="store.loading"
            paginator
            :rows="store.itemsPagination.per_page"
            :total-records="store.itemsPagination.total"
            @page="onPage"
            striped-rows
            class="w-full"
            emptyMessage="هیچ کالایی یافت نشد"
        >
          <Column field="id" header="#" style="width: 60px" />
          <Column field="name" header="نام کالا" />
          <Column field="code" header="کد" />
          <Column field="unit_of_measurement" header="واحد" />
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
                    @click="editItem(data.id)"
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
        آیا از حذف کالای <strong>{{ selectedItem?.name }}</strong> اطمینان دارید؟
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
  await store.fetchItems({
    ...filters.value,
    per_page: store.itemsPagination.per_page,
    page: store.itemsPagination.current_page,
  })
}

const onPage = (event) => {
  store.itemsPagination.current_page = event.page + 1
  loadData()
}

const editItem = (id) => {
  router.push({ name: 'pre-warehouse.items.edit', params: { id } })
}

const confirmDelete = (item) => {
  selectedItem.value = item
  deleteDialogVisible.value = true
}

const submitDelete = async () => {
  deleting.value = true
  try {
    await store.deleteItem(selectedItem.value.id)
    deleteDialogVisible.value = false
    await loadData()
  } catch (error) {
    // handled in store
  } finally {
    deleting.value = false
  }
}

// ✅ راه‌حل اصلی: watch روی route برای reload بعد از بازگشت از Form
watch(
    () => route.fullPath,
    (newPath, oldPath) => {
      // اگر از صفحه create/edit برگشتیم، داده‌ها را reload کن
      if (
          newPath.includes('/pre-warehouse/items') &&
          !newPath.includes('/create') &&
          !newPath.includes('/edit')
      ) {
        loadData()
      }
    }
)

// ✅ همچنین onActivated برای حالت keep-alive
onActivated(() => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>