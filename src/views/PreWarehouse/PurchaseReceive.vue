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
      <h1 class="text-2xl font-bold text-gray-800">دریافت کالا</h1>
      <p class="text-gray-500 mt-1">
        انبار: {{ allocation?.warehouse?.name }}
      </p>
    </div>

    <div v-if="allocation" class="space-y-4">
      <!-- Allocation Info -->
      <Card>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center">
              <p class="text-gray-500 text-sm">تخصیص‌یافته</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ allocation.allocated_qty }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-gray-500 text-sm">دریافت‌شده</p>
              <p class="text-2xl font-bold text-green-600">
                {{ allocation.received_qty }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-gray-500 text-sm">باقیمانده</p>
              <p class="text-2xl font-bold text-purple-600">
                {{
                  allocation.allocated_qty -
                  allocation.received_qty
                }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Receive Form -->
      <Card>
        <template #title>ثبت دریافت جدید</template>
        <template #content>
          <form @submit.prevent="submitReceive" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                مقدار دریافتی <span class="text-red-500">*</span>
              </label>
              <InputNumber
                  v-model="form.qty"
                  :min="1"
                  :max="remainingQty"
                  :use-grouping="false"
                  class="w-full"
              />
              <small class="text-gray-500">
                حداکثر: {{ remainingQty }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <Textarea
                  v-model="form.notes"
                  rows="3"
                  class="w-full"
                  placeholder="توضیحات دریافت..."
              />
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
              <Button
                  label="انصراف"
                  severity="secondary"
                  @click="$router.back()"
              />
              <Button
                  label="ثبت دریافت"
                  type="submit"
                  :loading="submitting"
                  class="bg-green-600 hover:bg-green-700 text-white"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'

const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()

const allocation = ref(null)
const submitting = ref(false)

const form = ref({
  qty: 1,
  notes: '',
})

const remainingQty = computed(() => {
  if (!allocation.value) return 0
  return allocation.value.allocated_qty - allocation.value.received_qty
})

const submitReceive = async () => {
  submitting.value = true
  try {
    await store.receiveAllocation(
        route.params.allocationId,
        form.value.qty,
        form.value.notes
    )
    router.push({
      name: 'pre-warehouse.show',
      params: { id: route.params.id },
    })
  } catch (error) {
    // handled
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const purchase = await store.fetchPurchase(route.params.id)
  allocation.value = purchase.allocations?.find(
      (a) => a.id === parseInt(route.params.allocationId)
  )
  if (!allocation.value) {
    router.back()
  }
})
</script>