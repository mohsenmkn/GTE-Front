<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="mb-6">
      <Button
          icon="pi pi-arrow-right"
          label="بازگشت"
          severity="secondary"
          @click="$router.back()"
          class="mb-4"
      />
      <h1 class="text-2xl font-bold text-gray-800">تأیید متولی</h1>
      <p class="text-gray-500 mt-1">
        خرید #{{ purchase?.id }} - {{ purchase?.item?.name }}
      </p>
    </div>

    <Card v-if="purchase">
      <template #content>
        <div class="space-y-6">
          <!-- Purchase Summary -->
          <div class="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <p class="text-gray-500 text-sm">کالا</p>
              <p class="font-medium">{{ purchase.item?.name }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">مقدار</p>
              <p class="font-medium">
                {{ purchase.quantity }}
                {{ purchase.unit_of_measurement }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">واحد هدف</p>
              <p class="font-medium">
                {{ purchase.target_unit?.title || '-' }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">ثبت‌کننده</p>
              <p class="font-medium">
                {{ purchase.commercial_user?.name }}
              </p>
            </div>
          </div>

          <!-- Allocations Summary -->
          <div>
            <h3 class="font-medium text-gray-700 mb-3">
              تخصیص‌های انبار:
            </h3>
            <div class="space-y-2">
              <div
                  v-for="alloc in purchase.allocations"
                  :key="alloc.id"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <span>{{ alloc.warehouse?.name }}</span>
                <div class="flex items-center gap-3">
                                    <span class="text-sm text-gray-600">
                                        {{ alloc.received_qty }} /
                                        {{ alloc.allocated_qty }}
                                    </span>
                  <Tag
                      :value="alloc.status_label"
                      :class="
                                            alloc.status === 'fully_received'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        "
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-4 pt-4 border-t">
            <!-- Approve -->
            <div class="p-4 bg-green-50 rounded-lg">
              <h4 class="font-medium text-green-800 mb-3">
                تأیید کالا
              </h4>
              <Textarea
                  v-model="approveNotes"
                  rows="3"
                  class="w-full mb-3"
                  placeholder="یادداشت (اختیاری)..."
              />
              <Button
                  label="تأیید می‌کنم"
                  icon="pi pi-check"
                  severity="success"
                  :loading="approving"
                  @click="submitApprove"
              />
            </div>

            <!-- Reject -->
            <div class="p-4 bg-red-50 rounded-lg">
              <h4 class="font-medium text-red-800 mb-3">
                رد کردن کالا
              </h4>
              <Textarea
                  v-model="rejectReason"
                  rows="3"
                  class="w-full mb-3"
                  placeholder="دلیل رد کردن (الزامی)..."
              />
              <Button
                  label="رد می‌کنم"
                  icon="pi pi-times"
                  severity="danger"
                  :loading="rejecting"
                  @click="submitReject"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const store = usePreWarehouseStore()
const toast = useToast()

const purchase = ref(null)
const approveNotes = ref('')
const rejectReason = ref('')
const approving = ref(false)
const rejecting = ref(false)

const submitApprove = async () => {
  approving.value = true
  try {
    await store.approveByCustodian(purchase.value.id, approveNotes.value)
    router.push({
      name: 'pre-warehouse.show',
      params: { id: purchase.value.id },
    })
  } catch (error) {
    // handled
  } finally {
    approving.value = false
  }
}

const submitReject = async () => {
  if (!rejectReason.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'دلیل رد کردن الزامی است',
      life: 3000,
    })
    return
  }
  rejecting.value = true
  try {
    await store.rejectByCustodian(purchase.value.id, rejectReason.value)
    router.push({
      name: 'pre-warehouse.show',
      params: { id: purchase.value.id },
    })
  } catch (error) {
    // handled
  } finally {
    rejecting.value = false
  }
}

onMounted(async () => {
  purchase.value = await store.fetchPurchase(route.params.id)
})
</script>