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

      <!-- ══════════════════════════════════════════
           بخش عدم انطباق (Nonconformity)
      ═══════════════════════════════════════════ -->

      <!-- ══════════════════════════════════════════
      بخش برگشت خرید به دلیل رد متولی
 ══════════════════════════════════════════ -->

      <!-- وضعیت: رد شده توسط متولی / در انتظار اقدام انبار -->
      <div
          v-if="isCustodianRejected || isPendingWarehouseReturn"
          class="p-5 rounded-xl border-2 border-red-200 bg-red-50 space-y-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-red-600 text-2xl"></i>
          </div>

          <div>
            <h3 class="font-bold text-red-800 text-lg">
              خرید توسط متولی رد شده است
            </h3>

            <p class="text-sm text-red-600 mt-1">
              کالا باید توسط انبار تحویل بازرگانی شود و سپس به تأمین‌کننده برگشت داده شود.
            </p>
          </div>
        </div>

        <!-- علت رد -->
        <div class="bg-white rounded-lg p-4 border border-red-100">
          <p class="text-sm font-medium text-gray-700 mb-2">
            علت رد متولی:
          </p>

          <p class="text-gray-800 whitespace-pre-line">
            {{ purchase.rejection_reason || 'بدون توضیح' }}
          </p>
        </div>

        <!-- وضعیت فعلی -->
        <div class="bg-white rounded-lg p-4 border border-red-100">
          <div class="flex items-center justify-between">
      <span class="text-sm text-gray-600">
        وضعیت فرآیند برگشت:
      </span>

            <Tag
                :value="isCustodianRejected ? 'رد شده توسط متولی' : 'در انتظار اقدام انبار'"
                :severity="isCustodianRejected ? 'danger' : 'warning'"
            />
          </div>
        </div>

        <!-- راهنمای انبار -->
        <div
            v-if="canScheduleReturn && isPendingWarehouseReturn"
            class="bg-white rounded-lg p-4 border border-red-100"
        >
          <p class="text-sm text-gray-700 mb-3">
            <i class="pi pi-info-circle ml-1 text-red-500"></i>

            پس از رد خرید توسط متولی، انبار باید تاریخ تحویل کالا به بازرگانی را
            تعیین کند.
          </p>

          <Button
              label="تعیین تاریخ تحویل به بازرگانی"
              icon="pi pi-calendar"
              severity="warning"
              :loading="nonconformityBusy"
              @click="openNonconformityDialog"
          />
        </div>

        <!-- اگر کاربر انبار نباشد -->
        <div
            v-else
            class="bg-gray-100 rounded-lg p-4 border border-gray-200"
        >
          <p class="text-sm text-gray-600">
            <i class="pi pi-lock ml-1"></i>

            تعیین تاریخ تحویل توسط واحد انبار انجام می‌شود.
          </p>
        </div>
      </div>


      <!-- وضعیت: تاریخ تحویل توسط انبار تعیین شده -->
      <div
          v-if="purchase.status === 'warehouse_return_scheduled'"
          class="p-5 rounded-xl border-2 border-orange-200 bg-orange-50 space-y-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <i class="pi pi-calendar text-orange-600 text-2xl"></i>
          </div>

          <div>
            <h3 class="font-bold text-orange-800 text-lg">
              تاریخ تحویل به بازرگانی تعیین شده است
            </h3>

            <p class="text-sm text-orange-600 mt-1">
              کالا در تاریخ تعیین‌شده باید به بازرگانی تحویل شود.
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg p-4 border border-orange-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تاریخ تحویل به بازرگانی
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.warehouse_return_scheduled_at || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تعیین‌کننده
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.warehouse_return_scheduled_by?.name || '-' }}
              </p>
            </div>

          </div>
        </div>

        <div
            v-if="purchase.return_notes"
            class="bg-white rounded-lg p-4 border border-orange-100"
        >
          <p class="text-xs text-gray-500 mb-1">
            یادداشت انبار:
          </p>

          <p class="text-gray-800 whitespace-pre-line">
            {{ purchase.return_notes }}
          </p>
        </div>

        <!-- فقط مسئول خرید می‌تواند تحویل را ثبت کند -->
        <div
            v-if="isOwner"
            class="bg-yellow-50 rounded-lg p-4 border border-yellow-200"
        >
          <p class="text-sm text-yellow-800 mb-3">
            <i class="pi pi-info-circle ml-1"></i>

            شما مسئول ثبت این خرید هستید.
            در تاریخ تعیین‌شده می‌توانید تحویل گرفتن کالا را ثبت کنید.
          </p>

          <Button
              label="تأیید تحویل گرفتن کالای مرجوعی"
              icon="pi pi-check"
              severity="success"
              :loading="nonconformityBusy"
              @click="confirmNonconformityPickup"
          />
        </div>

        <div
            v-else
            class="bg-gray-100 rounded-lg p-4 border border-gray-200"
        >
          <p class="text-sm text-gray-600">
            <i class="pi pi-lock ml-1"></i>

            ثبت تحویل کالا فقط توسط کاربر بازرگانی ثبت‌کننده خرید امکان‌پذیر است.
          </p>
        </div>
      </div>


      <!-- وضعیت: کالا توسط بازرگانی تحویل گرفته شده -->
      <div
          v-if="purchase.status === 'commercial_received'"
          class="p-5 rounded-xl border-2 border-blue-200 bg-blue-50 space-y-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <i class="pi pi-inbox text-blue-600 text-2xl"></i>
          </div>

          <div>
            <h3 class="font-bold text-blue-800 text-lg">
              کالا تحویل بازرگانی شده است
            </h3>

            <p class="text-sm text-blue-600 mt-1">
              کالا آماده برگشت به تأمین‌کننده است.
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg p-4 border border-blue-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تاریخ تحویل به بازرگانی
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.commercial_received_at || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تحویل‌گیرنده
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.commercial_received_by?.name || '-' }}
              </p>
            </div>

          </div>
        </div>

        <div
            v-if="purchase.return_notes"
            class="bg-white rounded-lg p-4 border border-blue-100"
        >
          <p class="text-xs text-gray-500 mb-1">
            یادداشت:
          </p>

          <p class="text-gray-800 whitespace-pre-line">
            {{ purchase.return_notes }}
          </p>
        </div>

        <!-- ثبت برگشت به تأمین‌کننده -->
        <div
            v-if="isOwner"
            class="bg-green-50 rounded-lg p-4 border border-green-200"
        >
          <p class="text-sm text-green-800 mb-3">
            <i class="pi pi-info-circle ml-1"></i>

            کالا توسط انبار به بازرگانی تحویل شده است.
            در این مرحله می‌توانید برگشت کالا به تأمین‌کننده را ثبت کنید.
          </p>

          <Button
              label="ثبت برگشت به تأمین‌کننده"
              icon="pi pi-undo"
              severity="success"
              :loading="nonconformityBusy"
              @click="confirmSupplierReturned"
          />
        </div>

        <div
            v-else
            class="bg-gray-100 rounded-lg p-4 border border-gray-200"
        >
          <p class="text-sm text-gray-600">
            <i class="pi pi-lock ml-1"></i>

            ثبت برگشت به تأمین‌کننده فقط توسط مسئول ثبت خرید امکان‌پذیر است.
          </p>
        </div>
      </div>


      <!-- وضعیت: برگشت به تأمین‌کننده انجام شده -->
      <div
          v-if="purchase.status === 'supplier_returned'"
          class="p-5 rounded-xl border-2 border-green-200 bg-green-50 space-y-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <i class="pi pi-check-circle text-green-600 text-2xl"></i>
          </div>

          <div>
            <h3 class="font-bold text-green-800 text-lg">
              فرآیند برگشت کالا تکمیل شد
            </h3>

            <p class="text-sm text-green-600 mt-1">
              کالا به تأمین‌کننده برگشت داده شده است.
            </p>
          </div>
        </div>

        <div class="bg-white rounded-lg p-4 border border-green-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تاریخ تعیین‌شده تحویل به بازرگانی
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.warehouse_return_scheduled_at || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تاریخ تحویل به بازرگانی
              </p>

              <p class="font-bold text-gray-800">
                {{ toJalaliDate(purchase.commercial_received_at) || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-1">
                تاریخ برگشت به تأمین‌کننده
              </p>

              <p class="font-bold text-gray-800">
                {{ toJalaliDate(purchase.supplier_returned_at) || '-' }}
              </p>
            </div>

            <div>
              <p class="text-xs text-gray-500 mb-1">
                ثبت‌کننده برگشت
              </p>

              <p class="font-bold text-gray-800">
                {{ purchase.supplier_returned_by?.name || '-' }}
              </p>
            </div>

          </div>
        </div>

        <div
            v-if="purchase.return_notes"
            class="bg-white rounded-lg p-4 border border-green-100"
        >
          <p class="text-xs text-gray-500 mb-1">
            یادداشت‌های برگشت:
          </p>

          <p class="text-gray-800 whitespace-pre-line">
            {{ purchase.return_notes }}
          </p>
        </div>
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

      <!-- در کارت اطلاعات خرید، بعد از نمایش کالا و مقدار -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
        <div>
          <p class="text-xs text-slate-500 mb-1">کد کالا</p>
          <p class="font-bold text-slate-800 font-mono">
            {{ purchase.item_code || '-' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-slate-500 mb-1">برند</p>
          <p class="font-bold text-slate-800">
            {{ purchase.brand || '-' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-slate-500 mb-1">تامین‌کننده</p>
          <p class="font-bold text-slate-800">
            {{ purchase.supplier || '-' }}
          </p>
        </div>
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
            <Column header="محل فعلی">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i class="pi pi-shield text-orange-500 text-xs"></i>
                  <span class="text-xs text-slate-600">
                    {{ data.quarantine_location || data.warehouse?.quarantine_location?.name || 'قرنطینه' }}
                  </span>
                </div>
              </template>
            </Column>
            <Column header="دریافت‌شده">
              <template #body="{ data }">
                {{ data.received_qty }} / {{ data.allocated_qty }}
              </template>
            </Column>
            <Column header="خروج موقت">
              <template #body="{ data }">
                <div class="text-sm">
                  <span class="font-bold text-orange-600">
                    {{ data.temporary_exit_qty || 0 }}
                  </span>
                  <span class="text-xs text-slate-500 mr-1">عدد</span>
                </div>
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
                  <div v-if="data.status === 'in_quarantine'" class="flex items-center gap-1">
                    <Tag value="در قرنطینه" severity="warn" class="text-xs" />
                    <i class="pi pi-shield text-orange-500 text-sm"></i>
                  </div>
                  <Button
                      v-if="canAssignLocation && (data.status === 'location_assigned' || isPendingFinalAllocation) && (data.allocated_qty > (data.temporary_exit_qty || 0))"
                      icon="pi pi-map-marker"
                      severity="info"
                      size="small"
                      @click="goLocation(data.id)"
                      v-tooltip.bottom="isPendingFinalAllocation ? 'تخصیص نهایی انبار و محل نگهداری' : 'تعیین محل نگهداری'"
                  />
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
            <!-- تایید/رد انبار کلی -->
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

            <!-- تایید/رد متولی -->
            <Button
                v-if="canCustodianApprove && isPendingCustodianApproval"
                label="تایید متولی"
                icon="pi pi-check-circle"
                severity="success"
                @click="openCustodianApproveDialog"
            />
            <Button
                v-if="canCustodianApprove && isPendingCustodianApproval"
                label="رد متولی"
                icon="pi pi-times-circle"
                severity="danger"
                @click="openCustodianRejectDialog"
            />

            <!-- تخصیص -->
            <Button
                v-if="canAllocate && isPendingAllocation"
                label="تخصیص انبار"
                icon="pi pi-share-alt"
                severity="warning"
                @click="goAllocate"
            />

            <!-- ورود شماره حواله -->
            <Button
                v-if="canEnterVoucher && isPendingVoucher"
                label="ورود شماره حواله"
                icon="pi pi-file"
                severity="info"
                @click="openVoucherDialog"
            />

            <!-- ورود شماره رسید انبار -->
            <Button
                v-if="canEnterReceipt && isPendingReceipt"
                label="ورود رسید انبار"
                icon="pi pi-inbox"
                severity="primary"
                @click="openReceiptDialog"
            />
            <!-- ══════════════════════════════════════
     فرآیند برگشت خرید
══════════════════════════════════════ -->

            <!-- انبار: تعیین تاریخ تحویل به بازرگانی -->
            <Button
                v-if="canScheduleReturn && isCustodianRejected"
                label="تعیین تاریخ تحویل به بازرگانی"
                icon="pi pi-calendar"
                severity="warning"
                :loading="nonconformityBusy"
                @click="openNonconformityDialog"
            />

            <!-- بازرگانی: تأیید دریافت کالا -->
            <Button
                v-if="isOwner && isWarehouseReturnScheduled"
                label="تأیید تحویل گرفتن کالا"
                icon="pi pi-check"
                severity="success"
                :loading="nonconformityBusy"
                @click="confirmNonconformityPickup"
            />

            <!-- بازرگانی: برگشت به تأمین‌کننده -->
            <Button
                v-if="isOwner && isCommercialReceived"
                label="ثبت برگشت به تأمین‌کننده"
                icon="pi pi-undo"
                severity="success"
                :loading="nonconformityBusy"
                @click="confirmSupplierReturned"
            />

            <!-- فرآیند تکمیل شده -->
            <Tag
                v-if="isSupplierReturned"
                value="برگشت به تأمین‌کننده انجام شد"
                severity="success"
                class="text-sm px-4 py-2"
            />

            <!-- تاریخچه -->
            <Button
                label="تاریخچه"
                icon="pi pi-history"
                severity="secondary"
                @click="goHistory"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- ═══════════════════════════════════════════
         Dialog: تایید انبار کلی
    ══════════════════════════════════════════ -->
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

    <!-- ═══════════════════════════════════════════
         Dialog: رد انبار کلی
    ═══════════════════════════════════════════ -->
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

    <!-- ═══════════════════════════════════════════
         Dialog: تایید متولی با خروج موقت
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="custodianApproveDialogVisible"
        header="تایید خرید توسط متولی"
        :style="{ width: '1000px' }"
        modal
    >
      <div class="space-y-4">
        <!-- اطلاعات کامل خرید -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h4 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            جزئیات خرید
          </h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-slate-500">کالا</p>
              <p class="font-bold text-slate-800">{{ purchase?.item?.name || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">مقدار کل</p>
              <p class="font-bold text-slate-800">{{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">کد کالا</p>
              <p class="font-bold text-slate-800 font-mono">{{ purchase?.item_code || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">برند</p>
              <p class="font-bold text-slate-800">{{ purchase?.brand || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">تامین‌کننده</p>
              <p class="font-bold text-slate-800">{{ purchase?.supplier || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500">واحد هدف</p>
              <p class="font-bold text-slate-800">{{ purchase?.target_unit?.title || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- تخصیص‌ها در قرنطینه -->
        <div class="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h4 class="font-bold text-orange-800 mb-3 flex items-center gap-2">
            <i class="pi pi-shield text-orange-600"></i>
            کالا در قرنطینه انبارها
          </h4>
          <div v-if="!purchase?.allocations?.length" class="text-center py-4 text-orange-600">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p class="text-sm">هنوز تخصیصی انجام نشده است</p>
          </div>
          <div class="space-y-2">
            <div v-for="allocation in purchase?.allocations" :key="allocation.id"
                 class="flex items-center justify-between p-3 bg-white rounded-lg">
              <div class="flex-1">
                <p class="font-medium text-sm">{{ allocation.warehouse?.name }}</p>
                <p class="text-xs text-slate-500">
                  مقدار: {{ allocation.allocated_qty }} |
                  خروج موقت قبلی: {{ allocation.temporary_exit_qty || 0 }} |
                  باقیمانده: {{ allocation.allocated_qty - (allocation.temporary_exit_qty || 0) }}
                </p>
              </div>
              <div class="text-left">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                  <i class="pi pi-shield text-xs"></i>
                  در قرنطینه
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- دکمه افزودن خروج موقت -->
        <div class="border-t pt-4">
          <Button
              label="افزودن خروج موقت"
              icon="pi pi-plus"
              severity="warning"
              size="small"
              @click="openTemporaryExitsDialog"
          />
        </div>

        <!-- لیست خروج‌های موقت -->
        <div v-if="temporaryExits.length" class="space-y-3">
          <h5 class="font-bold text-sm text-slate-700">خروج‌های موقت ثبت‌شده:</h5>
          <div v-for="allocation in purchase?.allocations" :key="allocation.id">
            <div v-if="getAllocationExits(allocation.id).length"
                 class="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="font-medium text-sm text-slate-800 mb-2">
                <i class="pi pi-box text-slate-500 ml-1"></i>
                {{ allocation.warehouse?.name }}
              </p>
              <div class="space-y-2">
                <div v-for="exit in getAllocationExits(allocation.id)" :key="exit._id"
                     class="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div class="flex-1">
                    <p class="font-medium text-sm">
                      {{ exit.quantity }} عدد → {{ exit.target_code }}
                    </p>
                    <p class="text-xs text-slate-600">{{ exit.target_description }}</p>
                    <p v-if="exit.site_name" class="text-xs text-slate-500">
                      سایت: {{ exit.site_name }}
                    </p>
                  </div>
                  <Button
                      icon="pi pi-trash"
                      severity="danger"
                      size="small"
                      @click="removeTemporaryExit(exit._id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- یادداشت -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            یادداشت (اختیاری)
          </label>
          <Textarea
              v-model="custodianApproveNotes"
              rows="3"
              class="w-full"
              placeholder="توضیحات تکمیلی..."
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
            label="تایید و ثبت خروج‌ها"
            severity="success"
            icon="pi pi-check-circle"
            :loading="custodianApproving"
            @click="submitCustodianApproveWithExits"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Dialog: رد متولی
    ══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="custodianRejectDialogVisible"
        header="رد کالا توسط متولی"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">
        <div class="p-3 bg-red-50 rounded-lg border border-red-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-exclamation-triangle text-red-600 text-xl mt-1"></i>
            <div class="text-sm text-red-800">
              <p class="font-medium mb-1">توجه</p>
              <p>
                با رد این خرید، کالا وارد فرآیند برگشت به بازرگانی می‌شود.
                انبار باید تاریخ تحویل به بازرگانی را تعیین کند و سپس بازرگانی کالا را به تأمین‌کننده برمی‌گرداند.
              </p>
            </div>
          </div>
        </div>

        <p class="text-gray-600">
          دلیل رد کردن این کالا را وارد کنید:
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

    <!-- ═══════════════════════════════════════════
         Dialog: افزودن خروج موقت
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="temporaryExitsDialogVisible"
        header="ثبت خروج موقت"
        :style="{ width: '700px' }"
        modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            انبار (Allocation) <span class="text-red-500">*</span>
          </label>
          <div v-if="!purchase?.allocations?.length" class="p-3 bg-red-50 rounded-lg border border-red-200">
            <p class="text-sm text-red-600">
              <i class="pi pi-exclamation-triangle ml-1"></i>
              هیچ تخصیصی برای این خرید وجود ندارد
            </p>
          </div>
          <Select
              v-else
              v-model="newTemporaryExit.allocation_id"
              :options="purchase.allocations"
              option-label="warehouse.name"
              option-value="id"
              placeholder="انتخاب انبار..."
              class="w-full"
              :class="{ 'p-invalid': temporaryExitsErrors.allocation_id }"
          />
          <small v-if="temporaryExitsErrors.allocation_id" class="text-red-500">
            {{ temporaryExitsErrors.allocation_id }}
          </small>
          <small v-if="newTemporaryExit.allocation_id" class="text-slate-500 mt-1 block">
            باقیمانده در قرنطینه:
            <strong class="text-orange-600">
              {{ getAllocationRemaining(newTemporaryExit.allocation_id) }}
            </strong>
          </small>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              مقدار خروج <span class="text-red-500">*</span>
            </label>
            <InputNumber
                v-model="newTemporaryExit.quantity"
                :min="1"
                :max="newTemporaryExit.allocation_id ? getAllocationRemaining(newTemporaryExit.allocation_id) : 0"
                :use-grouping="false"
                class="w-full"
                input-class="w-full"
                :class="{ 'p-invalid': temporaryExitsErrors.quantity }"
            />
            <small v-if="temporaryExitsErrors.quantity" class="text-red-500">
              {{ temporaryExitsErrors.quantity }}
            </small>
            <small class="block text-xs text-slate-500 mt-1">
              واحد: {{ purchase?.unit_of_measurement || 'عدد' }}
            </small>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              نوع مصرف <span class="text-red-500">*</span>
            </label>
            <Select
                v-model="newTemporaryExit.target_type"
                :options="temporaryExitTargetTypes"
                option-label="label"
                option-value="value"
                class="w-full"
                placeholder="نوع مصرف را انتخاب کنید"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            کد خودرو / تجهیز / پروژه <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="newTemporaryExit.target_code"
              class="w-full"
              :class="{ 'p-invalid': temporaryExitsErrors.target_code }"
              placeholder="مثلاً کد خودرو 1"
              maxlength="100"
          />
          <small v-if="temporaryExitsErrors.target_code" class="text-red-500">
            {{ temporaryExitsErrors.target_code }}
          </small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            شرح مصرف / محل نصب <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="newTemporaryExit.target_description"
              rows="2"
              class="w-full"
              :class="{ 'p-invalid': temporaryExitsErrors.target_description }"
              placeholder="مثلاً نصب یک لاستیک روی کامیون"
              maxlength="500"
          />
          <small v-if="temporaryExitsErrors.target_description" class="text-red-500">
            {{ temporaryExitsErrors.target_description }}
          </small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">سایت / محل مصرف</label>
          <InputText
              v-model="newTemporaryExit.site_name"
              class="w-full"
              placeholder="اختیاری"
              maxlength="255"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">یادداشت</label>
          <Textarea
              v-model="newTemporaryExit.notes"
              rows="2"
              class="w-full"
              placeholder="توضیحات تکمیلی (اختیاری)"
              maxlength="1000"
          />
        </div>

        <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          برای خروج چند قلم به مقصدهای مختلف، هر مقصد را جداگانه وارد کرده و روی «افزودن به لیست» بزنید.
          برای نمونه، ۵ لاستیک برای کامیون‌های ۱ تا ۵ را در ۵ ردیف با مقدار ۱ ثبت کنید.
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="temporaryExitsDialogVisible = false"
        />
        <Button
            label="افزودن به لیست"
            severity="warning"
            icon="pi pi-plus"
            @click="addTemporaryExit"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Dialog: ورود شماره حواله
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="voucherDialogVisible"
        header="ورود شماره حواله بازرگانی"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 text-xl mt-1"></i>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">اطلاعات خرید</p>
              <p>کالا: <strong>{{ purchase?.item?.name }}</strong></p>
              <p>مقدار: <strong>{{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}</strong></p>
              <p>تامین‌کننده: <strong>{{ purchase?.supplier || '-' }}</strong></p>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            شماره حواله <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="voucherNumber"
              class="w-full"
              placeholder="مثلاً: WH-1405-001234"
              :class="{ 'p-invalid': voucherErrors.voucher_number }"
          />
          <small v-if="voucherErrors.voucher_number" class="text-red-500">
            {{ voucherErrors.voucher_number }}
          </small>
          <small class="text-gray-400 mt-1 block">
            این شماره در اسناد بازرگانی ثبت خواهد شد
          </small>
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="voucherDialogVisible = false"
        />
        <Button
            label="ثبت حواله"
            severity="info"
            icon="pi pi-file"
            :loading="enteringVoucher"
            :disabled="!voucherNumber.trim()"
            @click="submitVoucher"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Dialog: ورود شماره رسید انبار
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="receiptDialogVisible"
        header="ورود شماره رسید انبار"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div class="flex items-start gap-3">
            <i class="pi pi-inbox text-emerald-600 text-xl mt-1"></i>
            <div class="text-sm text-emerald-800">
              <p class="font-medium mb-1">اطلاعات خرید</p>
              <p>کالا: <strong>{{ purchase?.item?.name }}</strong></p>
              <p>مقدار: <strong>{{ purchase?.quantity }} {{ purchase?.unit_of_measurement }}</strong></p>
              <p>شماره حواله: <strong class="font-mono">{{ purchase?.voucher_number || '-' }}</strong></p>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            شماره رسید انبار <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="receiptNumber"
              class="w-full"
              placeholder="مثلاً: RC-1405-005678"
              :class="{ 'p-invalid': receiptErrors.receipt_number }"
          />
          <small v-if="receiptErrors.receipt_number" class="text-red-500">
            {{ receiptErrors.receipt_number }}
          </small>
          <small class="text-gray-400 mt-1 block">
            پس از ثبت، وضعیت خرید به "دریافت کامل شد" تغییر می‌کند
          </small>
        </div>
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="receiptDialogVisible = false"
        />
        <Button
            label="ثبت رسید"
            severity="success"
            icon="pi pi-inbox"
            :loading="enteringReceipt"
            :disabled="!receiptNumber.trim()"
            @click="submitReceipt"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Dialog: مشاهده علت رد شدن تخصیص
    ═══════════════════════════════════════════ -->
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

    <!-- ═══════════════════════════════════════
         Dialog: تعیین تاریخ تحویل به بازرگانی
    ═══════════════════════════════════════ -->
    <Dialog
        v-model:visible="nonconformityDialogVisible"
        header="تعیین تاریخ تحویل کالای مرجوعی به بازرگانی"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">

        <div class="p-4 bg-red-50 rounded-lg border border-red-200">
          <div class="flex items-start gap-3">

            <i class="pi pi-exclamation-triangle text-red-600 text-xl mt-1"></i>

            <div class="text-sm text-red-800">
              <p class="font-bold mb-1">
                تعیین تاریخ تحویل به بازرگانی
              </p>

              <p>
                انبار باید تاریخ تحویل کالای مرجوعی به بازرگانی را تعیین کند.
                بازرگانی در تاریخ تعیین‌شده، تحویل کالا را ثبت خواهد کرد.
              </p>
            </div>

          </div>
        </div>

        <!-- علت رد -->
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-500 mb-1">
            علت رد متولی:
          </p>

          <p class="font-medium text-gray-800 whitespace-pre-line">
            {{ purchase?.rejection_reason || 'بدون توضیح' }}
          </p>
        </div>

        <!-- تاریخ -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            تاریخ تحویل به بازرگانی
            <span class="text-red-500">*</span>
          </label>

          <DatePicker
              v-model="nonconformityHandoverDate"
              date-format="yyyy/mm/dd"
              placeholder="انتخاب تاریخ تحویل"
              class="w-full"
              :class="{
            'p-invalid': nonconformityErrors.handover_date
          }"
          />

          <small
              v-if="nonconformityErrors.handover_date"
              class="text-red-500"
          >
            {{ nonconformityErrors.handover_date }}
          </small>
        </div>

        <!-- یادداشت -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            یادداشت انبار
            <span class="text-gray-400">(اختیاری)</span>
          </label>

          <Textarea
              v-model="nonconformityNotes"
              rows="3"
              class="w-full"
              placeholder="توضیحات مربوط به تحویل کالا..."
          />
        </div>

      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="nonconformityDialogVisible = false"
        />

        <Button
            label="ثبت تاریخ تحویل"
            severity="warning"
            icon="pi pi-calendar"
            :loading="nonconformityBusy"
            @click="scheduleNonconformityHandover"
        />
      </template>
    </Dialog>


    <ConfirmDialog></ConfirmDialog>
  </div>
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
const { toJalaliDate, timeAgo } = useJalaliDate()

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

// Dialog states - Custodian
const custodianApproveDialogVisible = ref(false)
const custodianApproveNotes = ref('')
const custodianApproving = ref(false)
const custodianRejectDialogVisible = ref(false)
const custodianRejectReason = ref('')
const custodianRejectErrors = ref({})
const custodianRejecting = ref(false)

// Dialog states - Others
const rejectionReasonDialogVisible = ref(false)
const selectedAllocation = ref(null)

// Dialog های جدید
const voucherDialogVisible = ref(false)
const voucherNumber = ref('')
const voucherErrors = ref({})
const enteringVoucher = ref(false)

const receiptDialogVisible = ref(false)
const receiptNumber = ref('')
const receiptErrors = ref({})
const enteringReceipt = ref(false)

// Dialog / state های فرآیند برگشت خرید به دلیل رد متولی
const nonconformityDialogVisible = ref(false)
const nonconformityHandoverDate = ref('')
const nonconformityNotes = ref('')
const nonconformityBusy = ref(false)
const nonconformityErrors = ref({})




// ═══════════════════════════════════════════
// وضعیت فرآیند برگشت خرید
// ═══════════════════════════════════════════

const isCustodianRejected = computed(() =>
    purchase.value?.status === 'rejected_by_custodian'
)

const isPendingWarehouseReturn = computed(() =>
    purchase.value?.status === 'pending_warehouse_return'
)

const isWarehouseReturnScheduled = computed(() =>
    purchase.value?.status === 'warehouse_return_schedule'
)

const isCommercialReceived = computed(() =>
    purchase.value?.status === 'commercial_received'
)

const isSupplierReturned = computed(() =>
    purchase.value?.status === 'supplier_returned'
)

const canScheduleReturn = computed(() =>
    authStore.can('pre_warehouse.warehouse_return_schedule')
)

const isOwner = computed(() =>
    purchase.value?.is_owner === true
)

// متدهای عدم انطباق
const openNonconformityDialog = () => {
  nonconformityHandoverDate.value = ''
  nonconformityNotes.value = ''
  nonconformityErrors.value = {}
  nonconformityDialogVisible.value = true
}

// ═══════════════════════════════════════════
// عدم انطباق - ثبت تاریخ تحویل به بازرگانی
// ═══════════════════════════════════════════
const scheduleNonconformityHandover = async () => {
  nonconformityErrors.value = {}

  if (!nonconformityHandoverDate.value) {
    nonconformityErrors.value.handover_date = 'تاریخ تحویل الزامی است'

    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'تاریخ تحویل الزامی است',
      life: 4000,
    })

    return
  }

  nonconformityBusy.value = true

  try {
    await store.scheduleWarehouseReturn(
        purchase.value.id,
        nonconformityHandoverDate.value,
        nonconformityNotes.value || null
    )

    nonconformityDialogVisible.value = false

    await loadPurchase()

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'تاریخ تحویل به بازرگانی با موفقیت ثبت شد.',
      life: 4000,
    })
  } catch (error) {
    if (error.response?.data?.errors) {
      nonconformityErrors.value = error.response.data.errors
    }
  } finally {
    nonconformityBusy.value = false
  }
}

// ══════════════════════════════════════════
// عدم انطباق - تایید تحویل توسط بازرگانی
// ═══════════════════════════════════════════
const confirmNonconformityPickup = async () => {
  confirm.require({
    message:
        'آیا از تحویل گرفتن کالای مرجوعی توسط بازرگانی اطمینان دارید؟',
    header: 'تأیید تحویل کالا',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'تأیید تحویل',
    rejectLabel: 'انصراف',

    accept: async () => {
      nonconformityBusy.value = true

      try {
        await store.confirmCommercialReceived(
            purchase.value.id
        )

        await loadPurchase()

        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تحویل کالا توسط بازرگانی با موفقیت ثبت شد.',
          life: 4000,
        })
      } catch (error) {
        // خطا توسط Store مدیریت می‌شود
      } finally {
        nonconformityBusy.value = false
      }
    },
  })
}

// ═══════════════════════════════════════════
// State های خروج موقت
// ═══════════════════════════════════════════
const temporaryExitsDialogVisible = ref(false)
const temporaryExits = ref([])
const temporaryExitsErrors = ref({})
const temporaryExitTargetTypes = [
  { label: 'خودرو / وسیله نقلیه', value: 'vehicle' },
  { label: 'تجهیز', value: 'equipment' },
  { label: 'پروژه', value: 'project' },
  { label: 'سایر', value: 'other' },
]

const newTemporaryExit = ref({
  allocation_id: null,
  quantity: 1,
  target_type: 'equipment',
  target_code: '',
  target_description: '',
  site_name: '',
  notes: '',
})

// ═══════════════════════════════════════════
// Computed Properties
// ══════════════════════════════════════════
const canCustodianApprove = computed(() =>
    authStore.can('pre_warehouse.custodian_approve')
)
const canEnterVoucher = computed(() =>
    authStore.can('pre_warehouse.commercial_voucher') &&
    purchase.value?.is_owner === true
)
const canEnterReceipt = computed(() =>
    authStore.can('pre_warehouse.warehouse_receipt')
)

const isPendingCustodianApproval = computed(() => {
  return purchase.value?.status === 'pending_custodian_approval'
})

const isPendingVoucher = computed(() => {
  return purchase.value?.status === 'pending_commercial_voucher'
})

const isPendingReceipt = computed(() => {
  return purchase.value?.status === 'pending_warehouse_receipt'
})

const showRejectionColumn = computed(() => {
  return purchase.value?.allocations?.some(a => isRejectedStatus(a.status))
})

const isPendingFinalAllocation = computed(() => purchase.value?.status === 'pending_final_allocation')

const canWarehouseApprove = computed(() =>
    authStore.can('pre_warehouse.warehouse_approve')
)
const canAllocate = computed(() =>
    authStore.can('pre_warehouse.warehouse_allocate')
)
const canAssignLocation = computed(() =>
    authStore.can('pre_warehouse.location_assign')
)

const isPendingAllocation = computed(() => {
  return ['pending_allocation', 'pending_reallocation', 'allocated'].includes(purchase.value?.status)
})

const isPendingWarehouseApproval = computed(() => {
  return purchase.value?.status === 'pending_warehouse_approval'
})

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
    pending_final_allocation: 'bg-orange-100 text-orange-800',
    fully_received: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    rejected_by_destination: 'bg-red-100 text-red-800',
    location_assigned: 'bg-teal-100 text-teal-800',
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
// Rejection Reason Dialog
// ═══════════════════════════════════════════
const showRejectionReason = (allocation) => {
  selectedAllocation.value = allocation
  rejectionReasonDialogVisible.value = true
}

// ═══════════════════════════════════════════
// تایید متولی
// ═══════════════════════════════════════════
const openCustodianApproveDialog = () => {
  custodianApproveNotes.value = ''
  custodianApproveDialogVisible.value = true
}

const submitCustodianApprove = async () => {
  custodianApproving.value = true
  try {
    await store.approveByCustodian(
        purchase.value.id,
        custodianApproveNotes.value
    )
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
    await store.rejectByCustodian(
        purchase.value.id,
        custodianRejectReason.value
    )
    custodianRejectDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled
  } finally {
    custodianRejecting.value = false
  }
}

// ═══════════════════════════════════════════
// ورود حواله بازرگانی
// ═══════════════════════════════════════════
const openVoucherDialog = () => {
  voucherNumber.value = ''
  voucherErrors.value = {}
  voucherDialogVisible.value = true
}

const submitVoucher = async () => {
  if (!voucherNumber.value.trim()) {
    voucherErrors.value.voucher_number = 'شماره حواله الزامی است'
    return
  }
  enteringVoucher.value = true
  try {
    await store.enterVoucher(purchase.value.id, voucherNumber.value.trim())
    voucherDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    if (error.response?.data?.errors) {
      voucherErrors.value = error.response.data.errors
    }
  } finally {
    enteringVoucher.value = false
  }
}

// ═══════════════════════════════════════════
// ورود رسید انبار
// ═══════════════════════════════════════════
const openReceiptDialog = () => {
  receiptNumber.value = ''
  receiptErrors.value = {}
  receiptDialogVisible.value = true
}

const submitReceipt = async () => {
  if (!receiptNumber.value.trim()) {
    receiptErrors.value.receipt_number = 'شماره رسید انبار الزامی است'
    return
  }
  enteringReceipt.value = true
  try {
    await store.enterWarehouseReceipt(purchase.value.id, receiptNumber.value.trim())
    receiptDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    if (error.response?.data?.errors) {
      receiptErrors.value = error.response.data.errors
    }
  } finally {
    enteringReceipt.value = false
  }
}



// ═══════════════════════════════════════════
// عدم انطباق - ثبت برگشت به تأمین‌کننده
// ═══════════════════════════════════════════
const confirmSupplierReturned = async () => {
  confirm.require({
    message:
        'آیا از برگشت کالا به تأمین‌کننده اطمینان دارید؟ این عملیات غیرقابل بازگشت است.',
    header: 'تأیید برگشت به تأمین‌کننده',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'تأیید برگشت',
    rejectLabel: 'انصراف',

    accept: async () => {
      nonconformityBusy.value = true

      try {
        await store.confirmSupplierReturned(
            purchase.value.id
        )

        await loadPurchase()

        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'برگشت کالا به تأمین‌کننده با موفقیت ثبت شد.',
          life: 4000,
        })
      } catch (error) {
        // خطا توسط Store مدیریت می‌شود
      } finally {
        nonconformityBusy.value = false
      }
    },
  })
}

// ═══════════════════════════════════════════
// خروج موقت - Computed
// ═══════════════════════════════════════════
const getAllocationRemaining = (allocationId) => {
  const allocation = purchase.value?.allocations?.find(a => a.id === allocationId)
  if (!allocation) return 0

  const totalExits = temporaryExits.value
      .filter(e => e.allocation_id === allocationId)
      .reduce((sum, e) => sum + e.quantity, 0)

  return allocation.allocated_qty - (allocation.temporary_exit_qty || 0) - totalExits
}

const getAllocationExits = (allocationId) => {
  return temporaryExits.value.filter(e => e.allocation_id === allocationId)
}

// ═══════════════════════════════════════════
// خروج موقت - متدها
// ═══════════════════════════════════════════
const openTemporaryExitsDialog = () => {
  temporaryExits.value = []
  newTemporaryExit.value = {
    allocation_id: purchase.value?.allocations?.[0]?.id || null,
    quantity: 1,
    target_type: 'equipment',
    target_code: '',
    target_description: '',
    site_name: '',
    notes: '',
  }
  temporaryExitsErrors.value = {}
  temporaryExitsDialogVisible.value = true
}

const addTemporaryExit = () => {
  temporaryExitsErrors.value = {}

  if (!newTemporaryExit.value.allocation_id) {
    temporaryExitsErrors.value.allocation_id = 'انتخاب انبار الزامی است'
    return
  }

  const remaining = getAllocationRemaining(newTemporaryExit.value.allocation_id)
  if (newTemporaryExit.value.quantity > remaining) {
    temporaryExitsErrors.value.quantity = `مقدار خروج نمی‌تواند بیشتر از ${remaining} باشد`
    return
  }

  if (newTemporaryExit.value.quantity <= 0) {
    temporaryExitsErrors.value.quantity = 'مقدار باید بیشتر از صفر باشد'
    return
  }

  if (!newTemporaryExit.value.target_code.trim()) {
    temporaryExitsErrors.value.target_code = 'کد تجهیز/وسیله الزامی است'
    return
  }

  if (!newTemporaryExit.value.target_description.trim()) {
    temporaryExitsErrors.value.target_description = 'توضیحات محل مصرف الزامی است'
    return
  }

  temporaryExits.value.push({
    ...newTemporaryExit.value,
    _id: Date.now(),
  })

  newTemporaryExit.value = {
    allocation_id: newTemporaryExit.value.allocation_id,
    quantity: 1,
    target_type: 'equipment',
    target_code: '',
    target_description: '',
    site_name: '',
    notes: '',
  }
}

const removeTemporaryExit = (exitId) => {
  temporaryExits.value = temporaryExits.value.filter(e => e._id !== exitId)
}

const submitCustodianApproveWithExits = async () => {
  custodianApproving.value = true
  try {
    await store.approveByCustodian(
        purchase.value.id,
        custodianApproveNotes.value,
        temporaryExits.value.map(e => ({
          allocation_id: e.allocation_id,
          quantity: e.quantity,
          target_type: e.target_type,
          target_code: e.target_code,
          target_description: e.target_description,
          site_name: e.site_name,
          notes: e.notes,
        }))
    )
    custodianApproveDialogVisible.value = false
    temporaryExitsDialogVisible.value = false
    await loadPurchase()
  } catch (error) {
    // handled in store
  } finally {
    custodianApproving.value = false
  }
}

// ═══════════════════════════════════════════
// Load Data
// ═══════════════════════════════════════════
const loadPurchase = async () => {
  purchase.value = await store.fetchPurchase(route.params.id)
  console.log('PURCHASE:', purchase.value)
  console.log(
      'warehouse_return_scheduled_at:',
      purchase.value?.warehouse_return_scheduled_at
  )
}

onMounted(() => {
  loadPurchase()

})
</script>
