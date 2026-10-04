<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">مدیریت متولیان کالا</h1>
        <p class="text-gray-500 mt-1">
          تعیین مسئول تایید کالا برای هر واحد سازمانی
        </p>
      </div>
      <Button
          label="افزودن متولی جدید"
          icon="pi pi-plus"
          @click="openAddDialog"
          class="bg-blue-600 hover:bg-blue-700 text-white"
      />
    </div>

    <!-- Info Card -->
    <Card class="mb-4">
      <template #content>
        <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <i class="pi pi-info-circle text-blue-600 text-xl mt-1"></i>
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">نحوه کار متولیان:</p>
            <p>
              هر واحد سازمانی می‌تواند یک یا چند متولی داشته باشد.
              متولی مسئول <strong>تایید یا رد</strong> کالاهای خریداری‌شده برای واحد خود است.
              پس از تایید متولی، کالا آماده تخصیص به انبارها می‌شود.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Table -->
    <Card>
      <template #content>
        <DataTable
            :value="store.custodians"
            :loading="loading"
            striped-rows
            class="w-full"
            emptyMessage="هنوز متولی ثبت نشده است"
        >
          <Column field="id" header="#" style="width: 60px" />
          <Column header="واحد سازمانی">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-building text-gray-500"></i>
                <span>{{ data.unit?.title }}</span>
              </div>
            </template>
          </Column>
          <Column header="متولی">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-500"></i>
                <div>
                  <p class="font-medium">{{ data.user?.name }}</p>
                  <p class="text-xs text-gray-500">{{ data.user?.mobile }}</p>
                </div>
              </div>
            </template>
          </Column>
          <Column header="عنوان نقش">
            <template #body="{ data }">
              {{ data.role_title }}
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
          <Column header="تاریخ ثبت">
            <template #body="{ data }">
              {{ toJalaliDate(data.created_at) }}
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
        :header="isEdit ? 'ویرایش متولی' : 'افزودن متولی جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            واحد سازمانی <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.organizational_unit_id"
              :options="orgUnits"
              option-label="formatted_title"
              option-value="id"
              placeholder="انتخاب واحد..."
              class="w-full"
              filter
              :loading="loadingUnits"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            کاربر متولی <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.user_id"
              :options="users"
              option-label="display_name"
              option-value="id"
              placeholder="انتخاب کاربر..."
              class="w-full"
              filter
              :loading="loadingUsers"
              @filter="onUserFilter"
              :filter-fields="['name', 'mobile', 'personnel_code']"
          >
            <template #option="slotProps">
              <div class="flex flex-col gap-1">
                <span class="font-medium">{{ slotProps.option.name }}</span>
                <div class="flex gap-3 text-xs text-gray-500">
                        <span v-if="slotProps.option.mobile">
                            <i class="pi pi-mobile mr-1"></i>
                            {{ slotProps.option.mobile }}
                        </span>
                  <span v-if="slotProps.option.personnel_code">
                            <i class="pi pi-id-card mr-1"></i>
                            {{ slotProps.option.personnel_code }}
                        </span>
                </div>
                <span v-if="slotProps.option.post_title" class="text-xs text-blue-600">
                        {{ slotProps.option.post_title }}
                    </span>
                <span v-if="slotProps.option.unit" class="text-xs text-gray-400">
                        {{ slotProps.option.unit }}
                    </span>
              </div>
            </template>
            <template #empty>
              <div class="text-center p-4 text-gray-500">
                <i class="pi pi-inbox text-2xl mb-2"></i>
                <p>کاربری یافت نشد</p>
              </div>
            </template>
          </Select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            عنوان نقش
          </label>
          <InputText
              v-model="form.role_title"
              class="w-full"
              placeholder="مثلاً: متولی کالا - واحد رفاهی"
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
        آیا از حذف متولی
        <strong>{{ selectedItem?.user?.name }}</strong>
        برای واحد
        <strong>{{ selectedItem?.unit?.title }}</strong>
        اطمینان دارید؟
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
import { usePreWarehouseStore } from '@/stores/preWarehouse'
import { useToast } from 'primevue/usetoast'
import api from '@/api/axios'
import {ComplaintService} from "@/services/complaintService.js";
import { useJalaliDate } from '@/composables/useJalaliDate'

const store = usePreWarehouseStore()
const toast = useToast()

const loading = ref(false)
const loadingUnits = ref(false)
const loadingUsers = ref(false)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const selectedItemId = ref(null)
const selectedItem = ref(null)
const submitting = ref(false)
const deleting = ref(false)
const { toJalaliDate, timeAgo } = useJalaliDate()
const orgUnits = ref([])
const users = ref([])

const form = ref({
  organizational_unit_id: null,
  user_id: null,
  role_title: 'متولی کالا',
  description: '',
  is_active: true,
})

const resetForm = () => {
  form.value = {
    organizational_unit_id: null,
    user_id: null,
    role_title: 'متولی کالا',
    description: '',
    is_active: true,
  }
}

const openAddDialog = () => {
  isEdit.value = false
  selectedItemId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (item) => {
  isEdit.value = true
  selectedItemId.value = item.id
  form.value = {
    organizational_unit_id: item.unit?.id,
    user_id: item.user?.id,
    role_title: item.role_title,
    description: item.description || '',
    is_active: item.is_active,
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  // بررسی تکراری بودن در لیست فعلی
  const isDuplicate = store.custodians.some(c =>
      c.unit?.id === form.value.organizational_unit_id &&
      c.user?.id === form.value.user_id &&
      c.id !== selectedItemId.value
  )

  if (isDuplicate) {
    toast.add({
      severity: 'warn',
      summary: 'تکراری',
      detail: 'این کاربر قبلاً به عنوان متولی این واحد ثبت شده است',
      life: 5000,
    })
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await store.updateCustodian(selectedItemId.value, form.value)
    } else {
      const response = await store.createCustodian(form.value)

      // ✅ بررسی پیام بازیابی
      if (response?.message?.includes('بازیابی')) {
        toast.add({
          severity: 'success',
          summary: 'بازیابی موفق',
          detail: response.message,
          life: 5000,
        })
      }
    }
    dialogVisible.value = false
    await loadCustodians()
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'خطا در ثبت متولی'

    if (errorMessage.includes('Duplicate entry')) {
      toast.add({
        severity: 'warn',
        summary: 'تکراری',
        detail: 'این کاربر قبلاً به عنوان متولی این واحد ثبت شده است',
        life: 5000,
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: errorMessage,
        life: 5000,
      })
    }
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (item) => {
  selectedItem.value = item
  deleteDialogVisible.value = true
}

const submitDelete = async () => {
  deleting.value = true
  try {
    await store.deleteCustodian(selectedItem.value.id)
    deleteDialogVisible.value = false
    await loadCustodians()
  } catch (error) {
    // handled
  } finally {
    deleting.value = false
  }
}

const loadCustodians = async () => {
  loading.value = true
  try {
    await store.fetchCustodians()
  } finally {
    loading.value = false
  }
}

const loadOrgUnits = async () => {
  loadingUnits.value = true
  try {
    const response = await api.get('/hr/org-chart/units')
    const units = response.data.units || []
    orgUnits.value = units.map(u => ({
      ...u,
      formatted_title: '—'.repeat(Math.max(0, u.level - 1)) + (u.level > 1 ? ' ' : '') + u.title,
    }))
  } catch (error) {
    console.error('Error loading org units:', error)
  } finally {
    loadingUnits.value = false
  }
}

let userSearchTimeout
const onUserFilter = (event) => {
  clearTimeout(userSearchTimeout)
  userSearchTimeout = setTimeout(() => {
    loadUsers(event.value)
  }, 300)
}

const loadUsers = async (search = '') => {
  loadingUsers.value = true
  try {
    const response = await api.get('/auth/users', {
      params: {
        search,
        per_page: 50
      }
    })

    // ✅ اضافه کردن display_name برای نمایش بهتر
    users.value = (response.data.data || []).map(user => ({
      ...user,
      display_name: `${user.name}${user.post_title ? ` - ${user.post_title}` : ''}`,
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
}

onMounted(() => {
  loadCustodians()
  loadOrgUnits()
  loadUsers()
})
</script>