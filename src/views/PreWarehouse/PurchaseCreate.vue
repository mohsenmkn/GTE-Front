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
      <h1 class="text-2xl font-bold text-gray-800">ثبت خرید جدید</h1>
      <p class="text-gray-500 mt-1">
        اطلاعات کالای خریداری‌شده را وارد کنید
      </p>
    </div>

    <Card>
      <template #content>
        <form @submit.prevent="submitForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- کالا -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                کالا <span class="text-red-500">*</span>
              </label>
              <Select
                  v-model="form.item_id"
                  :options="store.items"
                  option-label="name"
                  option-value="id"
                  placeholder="انتخاب کالا..."
                  class="w-full"
                  :class="{ 'p-invalid': errors.item_id }"
                  filter
              />
              <small v-if="errors.item_id" class="text-red-500">
                {{ errors.item_id }}
              </small>
            </div>

            <!-- ✅ کد کالا (جدید - اجباری) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                کد کالا <span class="text-red-500">*</span>
              </label>
              <InputText
                  v-model="form.item_code"
                  class="w-full"
                  placeholder="مثلاً: SKU-12345"
                  :class="{ 'p-invalid': errors.item_code }"
              />
              <small v-if="errors.item_code" class="text-red-500">
                {{ errors.item_code }}
              </small>
            </div>

            <!-- ✅ برند محصول (جدید - اجباری) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                برند محصول <span class="text-red-500">*</span>
              </label>
              <InputText
                  v-model="form.brand"
                  class="w-full"
                  placeholder="مثلاً: بارز، یزدتایر"
                  :class="{ 'p-invalid': errors.brand }"
              />
              <small v-if="errors.brand" class="text-red-500">
                {{ errors.brand }}
              </small>
            </div>

            <!-- مقدار -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                مقدار <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  v-model="form.quantity"
                  :min="1"
                  :use-grouping="false"
                  class="w-full"
                  :class="{ 'p-invalid': errors.quantity }"
              />
              <small v-if="errors.quantity" class="text-red-500">
                {{ errors.quantity }}
              </small>
            </div>

            <!-- واحد اندازه‌گیری -->
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

            <!-- ✅ تامین‌کننده (قبلاً اختیاری بود، حالا اجباری) -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                تامین‌کننده <span class="text-red-500">*</span>
              </label>
              <InputText
                  v-model="form.supplier"
                  class="w-full"
                  placeholder="نام شرکت یا شخص تامین‌کننده"
                  :class="{ 'p-invalid': errors.supplier }"
              />
              <small v-if="errors.supplier" class="text-red-500">
                {{ errors.supplier }}
              </small>
            </div>

            <!-- واحد سازمانی هدف -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                واحد سازمانی هدف
              </label>
              <Select
                  v-model="form.target_unit_id"
                  :options="orgUnits"
                  option-label="formatted_title"
                  option-value="id"
                  placeholder="انتخاب واحد سازمانی..."
                  class="w-full"
                  filter
              />
            </div>

            <!-- توضیحات -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <Textarea
                  v-model="form.description"
                  rows="3"
                  class="w-full"
                  placeholder="توضیحات اضافی..."
              />
            </div>

            <!-- متادیتا -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                شماره درخواست راهکاران
              </label>
              <InputText
                  v-model="form.metadata.invoice_number"
                  class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                تاریخ خرید
              </label>
              <DatePicker
                  v-model="form.metadata.purchase_date"
                  dateFormat="yy/mm/dd"
                  class="w-full"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <Button
                label="انصراف"
                severity="secondary"
                @click="$router.back()"
            />
            <Button
                label="ثبت خرید"
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import api from '@/api/axios'

const router = useRouter()
const store = usePreWarehouseStore()

const submitting = ref(false)
const loadingItems = ref(false)
const loadingUnits = ref(false)
const errors = ref({})

const form = ref({
  item_id: null,
  item_code: '',        // ✅ جدید
  brand: '',            // ✅ جدید
  supplier: '',         // ✅ حالا اجباری
  quantity: 1,
  unit_of_measurement: 'عدد',
  target_unit_id: null,
  description: '',
  metadata: {
    invoice_number: '',
    purchase_date: '',
  },
})

const unitOptions = ['عدد', 'کیلوگرم', 'حلقه', 'متر', 'لیتر', 'بسته', 'جعبه', 'تن']

const orgUnits = ref([])

const buildHierarchicalUnits = (units) => {
  if (!units || !Array.isArray(units)) return []
  return units.map(unit => {
    const indent = '—'.repeat(Math.max(0, unit.level - 1))
    return {
      ...unit,
      formatted_title: indent ? `${indent} ${unit.title}` : unit.title,
    }
  })
}

const loadOrgUnits = async () => {
  loadingUnits.value = true
  try {
    const response = await api.get('/hr/org-chart/units')
    const units = response.data.units || []
    orgUnits.value = buildHierarchicalUnits(units)
  } catch (error) {
    console.error('Error loading org units:', error)
  } finally {
    loadingUnits.value = false
  }
}

const loadItems = async () => {
  loadingItems.value = true
  try {
    await store.fetchAllItems()
    if (!store.items || store.items.length === 0) {
      await store.fetchItems({ all: true, per_page: 1000 })
    }
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loadingItems.value = false
  }
}

const submitForm = async () => {
  errors.value = {}
  submitting.value = true

  try {
    await store.createPurchase(form.value)
    router.push({ name: 'pre-warehouse.index' })
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOrgUnits()
  loadItems()
})
</script>