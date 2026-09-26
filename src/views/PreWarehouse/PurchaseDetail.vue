<template>
  <div class="p-6">
    <div v-if="store.loading" class="flex justify-center p-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="purchase" class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <Button
              icon="pi pi-arrow-right"
              label="بازگشت"
              severity="secondary"
              @click="$router.back()"
              class="mb-4"
          />
          <h1 class="text-2xl font-bold text-gray-800">
            خرید #{{ purchase.id }}
          </h1>
          <p class="text-gray-500 mt-1">
            {{ purchase.item?.name }} - {{ purchase.quantity }}
            {{ purchase.unit_of_measurement }}
          </p>
        </div>
        <Tag
            :value="purchase.status_label"
            :class="purchase.status_color || store.getStatusColor(purchase.status)"
            class="text-lg px-4 py-2"
        />
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-gray-500 text-sm">مقدار کل</p>
              <p class="text-2xl font-bold text-blue-600">
                {{ purchase.quantity }}
              </p>
              <p class="text-gray-400 text-sm">
                {{ purchase.unit_of_measurement }}
              </p>
            </div>
          </template>
        </Card>
        <Card>
          <template #content>
            <div class="text-center">
              <p class="text-gray-500 text-sm">تخصیص‌یافته</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ purchase.total_allocated_qty }}
              </p>
              <p class="text-gray-400 text-sm">
                {{ purchase.allocation_progress }}%
              </p>
            </div>
          </template>
        </Card>
        <!-- کارت جدید: قابل بازتخصیص -->
        <Card v-if="purchase.available_for_allocation > 0">
          <template #content>
            <div class="text-center">
              <p class="text-gray-500 text-sm">قابل بازتخصیص</p>
              <p class="text-2xl font-bold text-orange-600">
                {{ purchase.available_for_allocation }}
              </p>
              <Button
                  v-if="canAllocate"
                  label="تخصیص مجدد"
                  size="small"
                  class="mt-2"
                  @click="goAllocate"
              />
            </div>
          </template>
        </Card>
        <Card v-else>
          <template #content>
            <div class="text-center">
              <p class="text-gray-500 text-sm">دریافت‌شده</p>
              <p class="text-2xl font-bold text-green-600">
                {{ purchase.total_received_qty }}
              </p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Commercial User Info -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <User class="w-5 h-5" />
            <span>اطلاعات ثبت‌کننده</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-gray-500 text-sm">نام</p>
              <p class="font-medium">
                {{ purchase.commercial_user?.name }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">سمت</p>
              <p class="font-medium">
                {{ purchase.commercial_user?.position }}
              </p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">واحد</p>
              <p class="font-medium">
                {{ purchase.commercial_user?.unit }}
              </p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Allocations -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <Package class="w-5 h-5" />
              <span>تخصیص انبارها</span>
            </div>
            <!-- در بخش title کارت Allocations -->
            <Button
                v-if="canAllocate && isPendingAllocation"
                label="تخصیص انبار"
                icon="pi pi-plus"
                size="small"
                @click="goAllocate"
            />
          </div>
        </template>
        <template #content>
          <DataTable
              :value="purchase.allocations || []"
              striped-rows
              class="w-full"
              emptyMessage="هنوز تخصیصی انجام نشده است"
          >
            <Column field="id" header="#" style="width: 60px" />
            <Column header="انبار">
              <template #body="{ data }">
                {{ data.warehouse?.name }}
              </template>
            </Column>
            <Column header="تخصیص‌یافته">
              <template #body="{ data }">
                {{ data.allocated_qty }}
              </template>
            </Column>
            <Column header="دریافت‌شده">
              <template #body="{ data }">
                {{ data.received_qty }} / {{ data.allocated_qty }}
              </template>
            </Column>
            <Column header="وضعیت">
              <template #body="{ data }">
                <Tag
                    :value="data.status_label"
                    :class="getAllocationStatusColor(data.status)"
                />
              </template>
            </Column>
            <Column header="علت رد شدن" v-if="showRejectionColumn">
              <template #body="{ data }">
                                <span v-if="isRejectedStatus(data.status)" class="text-red-600 text-sm">
                                    {{ data.rejection_reason || 'بدون توضیح' }}
                                </span>
                <span v-else class="text-gray-400 text-sm">-</span>
              </template>
            </Column>
            <Column header="عملیات" style="width: 200px">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <!-- تعیین محل نگهداری -->
                  <Button
                      v-if="canAssignLocation && data.status === 'pending'"
                      icon="pi pi-map-marker"
                      severity="info"
                      size="small"
                      @click="goLocation(data.id)"
                      v-tooltip.bottom="'تعیین محل نگهداری'"
                  />
                  <!-- مشاهده علت رد شدن -->
                  <Button
                      v-if="isRejectedStatus(data.status) && data.rejection_reason"
                      icon="pi pi-info-circle"
                      severity="warning"
                      size="small"
                      @click="showRejectionReason(data)"
                      v-tooltip.bottom="'مشاهده علت رد شدن'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <!-- Approvals -->
      <Card v-if="purchase.approvals?.length">
        <template #title>
          <div class="flex items-center gap-2">
            <ClipboardCheck class="w-5 h-5" />
            <span>تأییدها</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div
                v-for="approval in purchase.approvals"
                :key="approval.id"
                class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p class="font-medium">
                  {{ approval.approver_type_label }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ approval.approver?.name }}
                </p>
              </div>
              <Tag
                  :value="approval.status_label"
                  :class="getApprovalStatusColor(approval.status)"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Actions -->
      <Card>
        <template #content>
          <div class="flex flex-wrap gap-3">
            <!-- ═══════ تایید/رد انبار کلی ═══════ -->
            <Button
                v-if="canWarehouseApprove && isPendingWarehouseApproval"
                label="تایید انبار"
                icon="pi pi-check"
                severity="success"
                @click="openWarehouseApproveDialog"
            />
            <Button
                v-if="canWarehouseApprove && isPendingWarehouseApproval"
                label="رد انبار"
                icon="pi pi-times"
                severity="danger"
                @click="openWarehouseRejectDialog"
            />

            <!-- ═══════ تایید/رد متولی ═══════ -->
            <Button
                v-if="canCustodianApprove && isPendingCustodianApproval"
                label="تایید متولی"
                icon="pi pi-check"
                severity="success"
                @click="openCustodianApproveDialog"
            />
            <Button
                v-if="canCustodianApprove && isPendingCustodianApproval"
                label="رد متولی"
                icon="pi pi-times"
                severity="danger"
                @click="openCustodianRejectDialog"
            />

            <!-- ═══════ تخصیص انبار ═══════ -->
            <Button
                v-if="canAllocate && isPendingAllocation"
                label="تخصیص انبار"
                icon="pi pi-share-alt"
                severity="warning"
                @click="goAllocate"
            />

            <!-- ═══════ نهایی‌سازی ═══════ -->
            <Button
                v-if="canFinalize && isLocationAssigned"
                label="نهایی‌سازی"
                icon="pi pi-flag"
                severity="warning"
                @click="openFinalizeDialog"
            />

            <!-- ═══════ تاریخچه ═══════ -->
            <Button
                label="تاریخچه"
                icon="pi pi-history"
                severity="info"
                @click="goHistory"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog: تایید انبار کلی -->
    <!-- ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="warehouseApproveDialogVisible"
        header="تایید خرید توسط انبار"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          آیا این خرید را تایید می‌کنید؟ پس از تایید، به متولی واحد هدف ارسال خواهد شد.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            یادداشت (اختیاری)
          </label>
          <Textarea
              v-model="warehouseApproveNotes"
              rows="3"
              class="w-full"
              placeholder="یادداشت خود را وارد کنید..."
          />
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="warehouseApproveDialogVisible = false"
        />
        <Button
            label="تایید"
            severity="success"
            :loading="warehouseApproving"
            @click="submitWarehouseApprove"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog: رد انبار کلی -->
    <!-- ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="warehouseRejectDialogVisible"
        header="رد خرید توسط انبار"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          دلیل رد کردن این خرید را وارد کنید:
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            دلیل رد <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="warehouseRejectReason"
              rows="4"
              class="w-full"
              placeholder="دلیل رد کردن را وارد کنید..."
              :class="{ 'p-invalid': warehouseRejectErrors.reason }"
          />
          <small v-if="warehouseRejectErrors.reason" class="text-red-500">
            {{ warehouseRejectErrors.reason }}
          </small>
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="warehouseRejectDialogVisible = false"
        />
        <Button
            label="رد کردن"
            severity="danger"
            :loading="warehouseRejecting"
            @click="submitWarehouseReject"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog: تایید متولی -->
    <!-- ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="custodianApproveDialogVisible"
        header="تایید خرید توسط متولی"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          آیا این خرید را تایید می‌کنید؟ پس از تایید، آماده تخصیص به انبارها خواهد شد.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            یادداشت (اختیاری)
          </label>
          <Textarea
              v-model="custodianApproveNotes"
              rows="3"
              class="w-full"
              placeholder="یادداشت خود را وارد کنید..."
          />
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="custodianApproveDialogVisible = false"
        />
        <Button
            label="تایید"
            severity="success"
            :loading="custodianApproving"
            @click="submitCustodianApprove"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog: رد متولی -->
    <!-- ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="custodianRejectDialogVisible"
        header="رد خرید توسط متولی"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          دلیل رد کردن این خرید را وارد کنید:
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            دلیل رد <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="custodianRejectReason"
              rows="4"
              class="w-full"
              placeholder="دلیل رد کردن را وارد کنید..."
              :class="{ 'p-invalid': custodianRejectErrors.reason }"
          />
          <small v-if="custodianRejectErrors.reason" class="text-red-500">
            {{ custodianRejectErrors.reason }}
          </small>
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="custodianRejectDialogVisible = false"
        />
        <Button
            label="رد کردن"
            severity="danger"
            :loading="custodianRejecting"
            @click="submitCustodianReject"
        />
      </template>
    </Dialog>

    <!-- ══════════════════════════════════════════ -->
    <!-- Dialog: مشاهده علت رد شدن تخصیص -->
    <!-- ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="rejectionReasonDialogVisible"
        header="علت رد شدن"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <div class="p-3 bg-red-50 rounded-lg border border-red-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-red-600 mt-1"></i>
            <div>
              <p class="font-medium text-red-800 mb-2">
                {{ selectedAllocation?.warehouse?.name }}
              </p>
              <p class="text-red-700 whitespace-pre-line">
                {{ selectedAllocation?.rejection_reason || 'بدون توضیح' }}
              </p>
            </div>
          </div>
        </div>
        <div class="text-sm text-gray-600">
          <p>
            <strong>تاریخ رد شدن:</strong>
            {{ selectedAllocation?.rejected_at || '-' }}
          </p>
          <p>
            <strong>رد کننده:</strong>
            {{ selectedAllocation?.rejected_by?.name || '-' }}
          </p>
        </div>
      </div>
      <template #footer>
        <Button
            label="بستن"
            severity="secondary"
            @click="rejectionReasonDialogVisible = false"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog: نهایی‌سازی -->
    <!-- ═══════════════════════════════════════════ -->
    <!-- Dialog نهایی‌سازی -->
    <Dialog
        v-model:visible="finalizeDialogVisible"
        header="نهایی‌سازی خرید"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <!-- اطلاعات خرید -->
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 text-xl mt-1"></i>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">اطلاعات خرید</p>
              <p>کالا: <strong>{{ purchase?.item?.name }}</strong></p>
              <p>مقدار: <strong>{{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}</strong></p>
              <p>وضعیت: <strong>{{ purchase?.status_label }}</strong></p>
            </div>
          </div>
        </div>

        <!-- هشدار -->
        <div class="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-yellow-600 text-xl mt-1"></i>
            <div class="text-sm text-yellow-800">
              <p class="font-medium mb-1">توجه</p>
              <p>
                پس از نهایی‌سازی، خرید قابل ویرایش نیست و آماده ثبت رسید انبار می‌شود.
              </p>
            </div>
          </div>
        </div>

        <!-- شماره حواله -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            شماره حواله/رسید <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="finalizeVoucherNumber"
              class="w-full"
              placeholder="مثلاً: WH-1405-001234"
              :class="{ 'p-invalid': finalizeErrors.voucher_number }"
          />
          <small v-if="finalizeErrors.voucher_number" class="text-red-500">
            {{ finalizeErrors.voucher_number }}
          </small>
          <small class="text-gray-400 mt-1 block">
            این شماره در رسید انبار ثبت خواهد شد
          </small>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="finalizeDialogVisible = false"
        />
        <Button
            label="نهایی‌سازی"
            severity="warning"
            icon="pi pi-flag"
            :loading="finalizing"
            :disabled="!finalizeVoucherNumber.trim()"
            @click="submitFinalize"
        />
      </template>
    </Dialog>
  </div>
  <ConfirmDialog></ConfirmDialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authold'
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { ClipboardCheck } from 'lucide-vue-next'
import { useJalaliDate } from '@/composables/useJalaliDate'


const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const store = usePreWarehouseStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════
// State
// ═══════════════════════════════════════════
const purchase = ref(null)

// Dialog states - Warehouse
const warehouseApproveDialogVisible = ref(false)
const warehouseRejectDialogVisible = ref(false)
const warehouseApproveNotes = ref('')
const warehouseRejectReason = ref('')
const warehouseRejectErrors = ref({})
const warehouseApproving = ref(false)
const warehouseRejecting = ref(false)
const { toJalaliDate, timeAgo } = useJalaliDate()

// Dialog states - Custodian
const custodianApproveDialogVisible = ref(false)
const custodianRejectDialogVisible = ref(false)
const custodianApproveNotes = ref('')
const custodianRejectReason = ref('')
const custodianRejectErrors = ref({})
const custodianApproving = ref(false)
const custodianRejecting = ref(false)

// Dialog states - Others
const rejectionReasonDialogVisible = ref(false)
const finalizeDialogVisible = ref(false)
const selectedAllocation = ref(null)
const finalizing = ref(false)
const finalizeVoucherNumber = ref('')
const finalizeErrors = ref({})


// ══════════════════════════════════════════
// Computed Properties
// ═══════════════════════════════════════════
const showRejectionColumn = computed(() => {
  return purchase.value?.allocations?.some(a => isRejectedStatus(a.status))
})

const canWarehouseApprove = computed(() =>
    authStore.can('pre_warehouse.warehouse_approve')
)
const canCustodianApprove = computed(() =>
    authStore.can('pre_warehouse.custodian_approve')
)
const canAllocate = computed(() =>
    authStore.can('pre_warehouse.warehouse_allocate')
)
const canAssignLocation = computed(() =>
    authStore.can('pre_warehouse.location_assign')
)
// const canFinalize = computed(() =>
//     authStore.can('pre_warehouse.commercial_finalize')
// )
// ✅ فقط اگر کاربر مسئول ثبت خرید است
const canFinalize = computed(() => {
  return authStore.can('pre_warehouse.commercial_finalize') &&
      purchase.value?.is_owner === true
})

// ✅ جدید: بررسی وضعیت‌های مختلف
const isPendingAllocation = computed(() => {
  return ['pending_allocation', 'pending_reallocation', 'allocated'].includes(purchase.value?.status)
})

const isPendingWarehouseApproval = computed(() => {
  return purchase.value?.status === 'pending_warehouse_approval'
})

const isPendingCustodianApproval = computed(() => {
  return purchase.value?.status === 'pending_custodian_approval'
})

const isLocationAssigned = computed(() => {
  return purchase.value?.status === 'location_assigned'
})

const isFinalized = computed(() => {
  return purchase.value?.status === 'finalized'
})

const isRejected = computed(() => {
  return ['rejected_by_warehouse', 'rejected_by_custodian'].includes(purchase.value?.status)
})

// Jalali

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
const isRejectedStatus = (status) => {
  return ['rejected', 'rejected_by_destination', 'rejected_by_warehouse', 'rejected_by_custodian'].includes(status)
}

const getAllocationStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    partially_received: 'bg-orange-100 text-orange-800',
    fully_received: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    rejected_by_destination: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

const getApprovalStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// ═══════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════
const goAllocate = () => {
  router.push({
    name: 'pre-warehouse.allocate',
    params: { id: purchase.value.id },
  })
}

const goLocation = (allocationId) => {
  router.push({
    name: 'pre-warehouse.location',
    params: {
      id: purchase.value.id,
      allocationId: allocationId,
    },
  })
}

const goHistory = () => {
  router.push({
    name: 'pre-warehouse.history',
    params: { id: purchase.value.id },
  })
}

// ═══════════════════════════════════════════
// Warehouse Approve/Reject
// ═══════════════════════════════════════════
const openWarehouseApproveDialog = () => {
  warehouseApproveNotes.value = ''
  warehouseApproveDialogVisible.value = true
}

const submitWarehouseApprove = async () => {
  warehouseApproving.value = true
  try {
    await store.approveByWarehouse(purchase.value.id, warehouseApproveNotes.value)
    warehouseApproveDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled in store
  } finally {
    warehouseApproving.value = false
  }
}

const openWarehouseRejectDialog = () => {
  warehouseRejectReason.value = ''
  warehouseRejectErrors.value = {}
  warehouseRejectDialogVisible.value = true
}

const submitWarehouseReject = async () => {
  if (!warehouseRejectReason.value.trim()) {
    warehouseRejectErrors.value.reason = 'دلیل رد کردن الزامی است'
    return
  }
  warehouseRejecting.value = true
  try {
    await store.rejectByWarehouse(purchase.value.id, warehouseRejectReason.value)
    warehouseRejectDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled in store
  } finally {
    warehouseRejecting.value = false
  }
}

// ═══════════════════════════════════════════
// Custodian Approve/Reject
// ═══════════════════════════════════════════
const openCustodianApproveDialog = () => {
  custodianApproveNotes.value = ''
  custodianApproveDialogVisible.value = true
}

const submitCustodianApprove = async () => {
  custodianApproving.value = true
  try {
    await store.approveByCustodian(purchase.value.id, custodianApproveNotes.value)
    custodianApproveDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled in store
  } finally {
    custodianApproving.value = false
  }
}

const openCustodianRejectDialog = () => {
  custodianRejectReason.value = ''
  custodianRejectErrors.value = {}
  custodianRejectDialogVisible.value = true
}

const submitCustodianReject = async () => {
  if (!custodianRejectReason.value.trim()) {
    custodianRejectErrors.value.reason = 'دلیل رد کردن الزامی است'
    return
  }
  custodianRejecting.value = true
  try {
    await store.rejectByCustodian(purchase.value.id, custodianRejectReason.value)
    custodianRejectDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled in store
  } finally {
    custodianRejecting.value = false
  }
}

// ═══════════════════════════════════════════
// Rejection Reason Dialog
// ═══════════════════════════════════════════
const showRejectionReason = (allocation) => {
  selectedAllocation.value = allocation
  rejectionReasonDialogVisible.value = true
}

// ═══════════════════════════════════════════
// Finalize
// ═══════════════════════════════════════════
const confirmFinalize = () => {
  confirm.require({
    message: 'آیا از نهایی‌سازی این خرید اطمینان دارید؟',
    header: 'تأیید نهایی‌سازی',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'نهایی‌سازی',
    rejectLabel: 'انصراف',
    accept: async () => {
      await submitFinalize()
    },
  })
}

// ارسال نهایی‌سازی
const submitFinalize = async () => {
  console.log('Voucher Number:', finalizeVoucherNumber.value)  // ✅ دیباگ
  console.log('Purchase ID:', purchase.value.id)  // ✅ دیباگ

  if (!finalizeVoucherNumber.value.trim()) {
    finalizeErrors.value.voucher_number = 'شماره حواله الزامی است'
    return
  }

  finalizing.value = true
  try {
    const result = await store.finalizePurchase(
        purchase.value.id,
        finalizeVoucherNumber.value.trim()
    )
    console.log('Finalize Result:', result)  // ✅ دیباگ
    finalizeDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    console.error('Finalize Error:', error.response?.data)  // ✅ دیباگ
    if (error.response?.data?.errors) {
      finalizeErrors.value = error.response.data.errors
    }
  } finally {
    finalizing.value = false
  }
}

const openFinalizeDialog = () => {
  finalizeVoucherNumber.value = ''
  finalizeErrors.value = {}
  finalizeDialogVisible.value = true
}

// ═══════════════════════════════════════════
// Load Data
// ═══════════════════════════════════════════
const loadPurchase = async () => {
  purchase.value = await store.fetchPurchase(route.params.id)
}

onMounted(() => {
  loadPurchase()
})
</script>