<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-6">
      <Button
          icon="pi pi-arrow-right"
          label="بازگشت"
          severity="secondary"
          @click="$router.back()"
          class="mb-4"
      />
      <h1 class="text-2xl font-bold text-gray-800">تخصیص انبارها</h1>
      <p class="text-gray-500 mt-1">
        خرید #{{ purchase?.id }} - {{ purchase?.item?.name }} -
        {{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}
      </p>
    </div>

    <!-- Summary -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-gray-500 text-sm">مقدار کل</p>
            <p class="text-2xl font-bold text-blue-600">
              {{ purchase?.quantity }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-gray-500 text-sm">تخصیص‌یافته</p>
            <p
                class="text-2xl font-bold"
                :class="
                                totalAllocated === purchase?.quantity
                                    ? 'text-green-600'
                                    : 'text-red-600'
                            "
            >
              {{ totalAllocated }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-gray-500 text-sm">باقیمانده</p>
            <p class="text-2xl font-bold text-purple-600">
              {{ (purchase?.quantity || 0) - totalAllocated }}
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Allocations Form -->
    <Card>
      <template #title>
        <div class="flex justify-between items-center">
          <span>انبارهای تخصیص‌یافته</span>
          <Button
              label="افزودن انبار"
              icon="pi pi-plus"
              size="small"
              @click="addAllocation"
          />
        </div>
      </template>
      <template #content>
        <div class="space-y-3">
          <div
              v-for="(alloc, index) in allocations"
              :key="index"
              class="grid grid-cols-12 gap-3 items-end p-4 bg-gray-50 rounded-lg"
          >
            <div class="col-span-5">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                انبار
              </label>
              <Select
                  v-model="alloc.warehouse_id"
                  :options="store.warehouses"
                  option-label="name"
                  option-value="id"
                  placeholder="انتخاب انبار..."
                  class="w-full"
                  filter
              />
            </div>
            <div class="col-span-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                مقدار
              </label>
              <InputNumber
                  v-model="alloc.allocated_qty"
                  :min="1"
                  :use-grouping="false"
                  class="w-full"
              />
            </div>
            <div class="col-span-3 flex gap-2">
              <Button
                  icon="pi pi-trash"
                  severity="danger"
                  size="small"
                  @click="removeAllocation(index)"
                  :disabled="allocations.length === 1"
              />
            </div>
          </div>
        </div>

        <!-- Validation Message -->
        <Message
            v-if="totalAllocated !== purchase?.quantity"
            severity="error"
            class="mt-4"
        >
          مجموع مقادیر تخصیص‌یافته ({{ totalAllocated }}) باید برابر با
          مقدار کل ({{ purchase?.quantity }}) باشد
        </Message>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
              label="انصراف"
              severity="secondary"
              @click="$router.back()"
          />
          <Button
              label="ثبت تخصیص"
              :loading="submitting"
              :disabled="
                            totalAllocated !== purchase?.quantity || submitting
                        "
              class="bg-blue-600 hover:bg-blue-700 text-white"
              @click="submitAllocate"
          />
        </div>
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

const purchase = ref(null)
const allocations = ref([{ warehouse_id: null, allocated_qty: 1 }])
const submitting = ref(false)

const totalAllocated = computed(() =>
    allocations.value.reduce((sum, a) => sum + (a.allocated_qty || 0), 0)
)

const addAllocation = () => {
  allocations.value.push({ warehouse_id: null, allocated_qty: 1 })
}

const removeAllocation = (index) => {
  allocations.value.splice(index, 1)
}

const submitAllocate = async () => {
  if (totalAllocated.value !== purchase.value.quantity) {
    return
  }
  submitting.value = true
  try {
    await store.allocateWarehouses(purchase.value.id, allocations.value)
    router.push({
      name: 'pre-warehouse.show',
      params: { id: purchase.value.id },
    })
  } catch (error) {
    // handled in store
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await store.fetchWarehouses()
  purchase.value = await store.fetchPurchase(route.params.id)
})
</script>