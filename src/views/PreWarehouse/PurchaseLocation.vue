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
      <h1 class="text-2xl font-bold text-gray-800">تعیین محل نگهداری</h1>
      <p class="text-gray-500 mt-1">
        انبار: <strong>{{ allocation?.warehouse?.name }}</strong>
      </p>
    </div>

    <Card v-if="allocation">
      <template #content>
        <div class="space-y-6">
          <!-- Allocation Info -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-gray-500 text-sm">مقدار تخصیص‌یافته به انبار</p>
                <p class="text-xl font-bold text-blue-600">
                  {{ allocation.allocated_qty }}
                  {{ allocation.purchase?.unit_of_measurement }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">تخصیص‌یافته به محل‌ها</p>
                <p class="text-xl font-bold text-purple-600">
                  {{ totalAssigned }}
                  {{ allocation.purchase?.unit_of_measurement }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-sm">باقیمانده</p>
                <p class="text-xl font-bold text-green-600">
                  {{ remainingQty }}
                  {{ allocation.purchase?.unit_of_measurement }}
                </p>
              </div>
            </div>
          </div>

          <!-- Existing Locations -->
          <div v-if="allocation.locations?.length">
            <h3 class="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <i class="pi pi-map-marker text-blue-600"></i>
              محل‌های تخصیص‌یافته:
            </h3>
            <div class="space-y-2">
              <div
                  v-for="loc in allocation.locations"
                  :key="loc.id"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-box text-gray-500"></i>
                  <div>
                    <p class="font-medium">{{ loc.warehouse_location?.name || loc.location_name }}</p>
                    <p class="text-sm text-gray-500" v-if="loc.warehouse_location?.section">
                      بخش: {{ loc.warehouse_location.section }}
                    </p>
                  </div>
                </div>
                <Tag
                    :value="`${loc.assigned_qty} ${allocation.purchase?.unit_of_measurement}`"
                    severity="info"
                />
              </div>
            </div>
          </div>

          <!-- Form: Select Location -->
          <div class="pt-4 border-t">
            <h3 class="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <i class="pi pi-plus-circle text-green-600"></i>
              تخصیص به محل جدید:
            </h3>

            <form @submit.prevent="submitLocation" class="space-y-4">
              <!-- Select Location -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  محل نگهداری <span class="text-red-500">*</span>
                </label>
                <Select
                    v-model="form.warehouse_location_id"
                    :options="availableLocations"
                    option-label="name"
                    option-value="id"
                    placeholder="انتخاب محل از لیست..."
                    class="w-full"
                    filter
                    :loading="loadingLocations"
                    :disabled="submitting"
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <span>{{ slotProps.option.name }}</span>
                      <Tag
                          v-if="slotProps.option.section"
                          :value="slotProps.option.section"
                          severity="secondary"
                          class="text-xs"
                      />
                    </div>
                  </template>
                  <template #empty>
                    <div class="text-center p-4 text-gray-500">
                      <i class="pi pi-inbox text-2xl mb-2"></i>
                      <p>هیچ محلی در این انبار تعریف نشده است</p>
                      <Button
                          label="مدیریت محل‌های انبار"
                          icon="pi pi-external-link"
                          size="small"
                          class="mt-2"
                          @click="goToWarehouseLocations"
                      />
                    </div>
                  </template>
                </Select>
                <small class="text-gray-400 mt-1 block">
                  محل‌ها از قبل در بخش "مدیریت انبارها" تعریف شده‌اند
                </small>
              </div>

              <!-- Quantity -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  مقدار تخصیص‌یافته <span class="text-red-500">*</span>
                </label>
                <InputNumber
                    v-model="form.assigned_qty"
                    :min="1"
                    :max="remainingQty"
                    :use-grouping="false"
                    class="w-full"
                    :disabled="submitting"
                />
                <small class="text-gray-500">
                  حداکثر: {{ remainingQty }} {{ allocation.purchase?.unit_of_measurement }}
                </small>
              </div>

              <!-- Notes (Optional) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات (اختیاری)
                </label>
                <Textarea
                    v-model="form.description"
                    rows="2"
                    class="w-full"
                    placeholder="توضیحات اضافی..."
                    :disabled="submitting"
                />
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end gap-3 pt-4 border-t">
                <Button
                    label="انصراف"
                    severity="secondary"
                    @click="$router.back()"
                    :disabled="submitting"
                />
                <Button
                    label="ثبت تخصیص"
                    type="submit"
                    :loading="submitting"
                    :disabled="!form.warehouse_location_id || submitting"
                    class="bg-blue-600 hover:bg-blue-700 text-white"
                />
              </div>
            </form>
          </div>
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-else class="flex justify-center p-12">
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useToast } from 'primevue/usetoast'


const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()
const toast = useToast()

const allocation = ref(null)
const availableLocations = ref([])
const loadingLocations = ref(false)
const submitting = ref(false)

const form = ref({
  warehouse_location_id: null,
  assigned_qty: 1,
  description: '',
})

const totalAssigned = computed(() => {
  return allocation.value?.locations?.reduce(
      (sum, loc) => sum + loc.assigned_qty,
      0
  ) || 0
})

const remainingQty = computed(() => {
  if (!allocation.value) return 0
  return allocation.value.allocated_qty - totalAssigned.value
})

const goToWarehouseLocations = () => {
  if (allocation.value?.warehouse?.id) {
    router.push({
      name: 'pre-warehouse.warehouses.locations',
      params: { id: allocation.value.warehouse.id }
    })
  }
}

const submitLocation = async () => {
  if (!form.value.warehouse_location_id) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'لطفاً یک محل انتخاب کنید',
      life: 3000,
    })
    return
  }

  if (form.value.assigned_qty > remainingQty.value) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'مقدار وارد شده بیشتر از باقیمانده است',
      life: 3000,
    })
    return
  }

  submitting.value = true
  try {
    // پیدا کردن نام محل از لیست
    const selectedLocation = availableLocations.value.find(
        l => l.id === form.value.warehouse_location_id
    )

    const payload = {
      warehouse_location_id: form.value.warehouse_location_id,
      location_name: selectedLocation?.name || '',
      assigned_qty: form.value.assigned_qty,
      description: form.value.description,
      section_code: selectedLocation?.code || null,
    }

    await store.assignLocation(allocation.value.id, payload)

    // Reload allocation
    const purchase = await store.fetchPurchase(route.params.id)
    allocation.value = purchase.allocations?.find(
        (a) => a.id === allocation.value.id
    )

    // Reset form
    form.value = {
      warehouse_location_id: null,
      assigned_qty: 1,
      description: '',
    }

    // اگر همه مقدار تخصیص داده شد، پیام موفقیت
    if (remainingQty.value === 0) {
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تمام مقدار کالا به محل‌ها تخصیص داده شد',
        life: 5000,
      })
    }
  } catch (error) {
    // handled in store
  } finally {
    submitting.value = false
  }
}

const loadLocations = async () => {
  if (!allocation.value?.warehouse?.id) return

  loadingLocations.value = true
  try {
    const response = await store.fetchWarehouseLocations(allocation.value.warehouse.id)
    availableLocations.value = store.warehouseLocations || []
  } catch (error) {
    console.error('Error loading locations:', error)
  } finally {
    loadingLocations.value = false
  }
}

onMounted(async () => {
  try {
    const purchase = await store.fetchPurchase(route.params.id)
    allocation.value = purchase.allocations?.find(
        (a) => a.id === parseInt(route.params.allocationId)
    )

    if (!allocation.value) {
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'تخصیص مورد نظر یافت نشد',
        life: 3000,
      })
      router.back()
      return
    }

    await loadLocations()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})
</script>