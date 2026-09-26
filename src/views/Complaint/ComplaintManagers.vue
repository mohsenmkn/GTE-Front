<!-- resources/js/pages/admin/ComplaintManagers.vue -->

<template>
  <div class="p-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-800">
        مدیریت مسئولین پیگیری شکایات
      </h1>
      <Button
          label="تعیین مسئول جدید"
          icon="pi pi-plus"
          @click="openCreateDialog"
      />
    </div>

    <Card>
      <template #content>
        <DataTable
            :value="managers"
            :paginator="true"
            :rows="15"
            :totalRecords="totalRecords"
            :loading="loading"
            lazy
            @page="onPage"
            stripedRows
            responsiveLayout="scroll"
        >
          <Column header="معاونت" style="min-width: 280px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-building text-blue-500"></i>
                <span>{{ data.organizational_unit?.breadcrumb || data.organizational_unit?.title }}</span>
              </div>
            </template>
          </Column>
          <Column header="مسئول پیگیری" style="min-width: 220px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-500"></i>
                <div>
                  <div class="font-medium">{{ data.user?.name }}</div>
                  <div class="text-xs text-gray-500">{{ data.user?.mobile }}</div>
                </div>
              </div>
            </template>
          </Column>
          <Column header="وضعیت" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                  :severity="data.is_active ? 'success' : 'secondary'"
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
              />
            </template>
          </Column>
          <Column field="created_at" header="تاریخ تعیین" style="min-width: 150px">
            <template #body="{ data }">
              {{ formatDate(data.created_at) }}
            </template>
          </Column>
          <Column header="عملیات" style="width: 160px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-text p-button-warning"
                    @click="openEditDialog(data)"
                />
                <Button
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-text p-button-danger"
                    @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center text-gray-500 py-6">
              مسئولی تعیین نشده است.
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- ─── Dialog ایجاد / ویرایش ─── -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="editingManager ? 'ویرایش مسئول پیگیری' : 'تعیین مسئول جدید'"
        :style="{ width: '520px' }"
        modal
        :draggable="false"
    >
      <div class="space-y-5 pt-2">
        <!-- انتخاب معاونت -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            معاونت <span class="text-red-500">*</span>
          </label>
          <TreeSelect
              v-model="form.organizational_unit_id"
              :options="organizationalUnits"
              optionLabel="label"
              optionValue="value"
              placeholder="انتخاب معاونت"
              class="w-full"
              :disabled="!!editingManager"
              :class="{ 'p-invalid': formErrors.organizational_unit_id }"
          />
          <small v-if="formErrors.organizational_unit_id" class="p-error">
            {{ formErrors.organizational_unit_id[0] }}
          </small>
        </div>

        <!-- انتخاب کاربر -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            مسئول پیگیری <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.user_id"
              :options="users"
              optionLabel="display_name"
              optionValue="id"
              placeholder="جستجو و انتخاب کاربر"
              filter
              class="w-full"
              :loading="usersLoading"
              :class="{ 'p-invalid': formErrors.user_id }"
              @filter="onUserSearch"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-gray-400"></i>
                <div>
                  <div class="font-medium">{{ option.name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ option.mobile }} — {{ option.personnel_code }}
                  </div>
                </div>
              </div>
            </template>
          </Select>
          <small v-if="formErrors.user_id" class="p-error">
            {{ formErrors.user_id[0] }}
          </small>
        </div>

        <!-- وضعیت (فقط در حالت ویرایش) -->
        <div v-if="editingManager">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            وضعیت
          </label>
          <div class="flex items-center gap-3">
            <ToggleSwitch v-model="form.is_active" />
            <span class="text-sm">
              {{ form.is_active ? 'فعال' : 'غیرفعال' }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            icon="pi pi-times"
            class="p-button-text"
            @click="dialogVisible = false"
        />
        <Button
            :label="editingManager ? 'ذخیره تغییرات' : 'تعیین مسئول'"
            icon="pi pi-check"
            :loading="saving"
            @click="saveManager"
        />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ComplaintService } from '@/services/complaintService'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import ToggleSwitch from 'primevue/toggleswitch'

const toast = useToast()
const confirm = useConfirm()

// ─── State ───
const managers = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const currentPage = ref(1)

const dialogVisible = ref(false)
const saving = ref(false)
const editingManager = ref(null)

const organizationalUnits = ref([])
const users = ref([])
const usersLoading = ref(false)

const form = reactive({
  organizational_unit_id: null,
  user_id: null,
  is_active: true,
})

const formErrors = reactive({
  organizational_unit_id: null,
  user_id: null,
})

// ─── Fetch ───
const fetchManagers = async (page = 1) => {
  loading.value = true
  currentPage.value = page

  try {
    const { data } = await ComplaintService.getComplaintManagers({ page, per_page: 15 })
    managers.value = data.data
    totalRecords.value = data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'دریافت لیست مسئولین با خطا مواجه شد.',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const fetchOrganizationalUnits = async () => {
  try {
    const { data } = await ComplaintService.getOrganizationalUnits()
    organizationalUnits.value = data.data
  } catch (error) {
    console.error('Error fetching units:', error)
  }
}

const fetchUsers = async (search = '') => {
  usersLoading.value = true
  try {
    const { data } = await ComplaintService.getUsersForManager({ search, per_page: 50 })
    users.value = data.data
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    usersLoading.value = false
  }
}

let searchTimeout = null
const onUserSearch = (event) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchUsers(event.value)
  }, 400)
}

// ─── Dialog ───
const resetForm = () => {
  form.organizational_unit_id = null
  form.user_id = null
  form.is_active = true
  formErrors.organizational_unit_id = null
  formErrors.user_id = null
}

const openCreateDialog = () => {
  editingManager.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (manager) => {
  editingManager.value = manager
  // ✅ تبدیل به عدد
  form.organizational_unit_id = parseInt(manager.organizational_unit?.id)
  form.user_id = parseInt(manager.user?.id)
  form.is_active = manager.is_active
  formErrors.organizational_unit_id = null
  formErrors.user_id = null
  dialogVisible.value = true
}

const saveManager = async () => {
  formErrors.organizational_unit_id = null
  formErrors.user_id = null
  saving.value = true

  try {
    // استخراج ID از TreeSelect
    const selectedUnitKey = Object.keys(form.organizational_unit_id || {})[0]
    const payload = {
      organizational_unit_id: selectedUnitKey ? Number(selectedUnitKey) : null,
      user_id: Number(form.user_id),
    }

    console.log('Payload:', payload)

    if (editingManager.value) {
      payload.is_active = form.is_active

      await ComplaintService.updateComplaintManager(
          editingManager.value.id,
          payload
      )

      toast.add({
        severity: 'success',
        summary: 'ویرایش شد',
        detail: 'مسئول پیگیری با موفقیت ویرایش شد.',
        life: 3000,
      })
    } else {
      await ComplaintService.createComplaintManager(payload)

      toast.add({
        severity: 'success',
        summary: 'ایجاد شد',
        detail: 'مسئول پیگیری با موفقیت تعیین شد.',
        life: 3000,
      })
    }

    dialogVisible.value = false
    fetchManagers(currentPage.value)

  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors || {}

      if (errors.organizational_unit_id)
        formErrors.organizational_unit_id = errors.organizational_unit_id

      if (errors.user_id)
        formErrors.user_id = errors.user_id
    } else {
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: error.response?.data?.message || 'عملیات با خطا مواجه شد.',
        life: 3000,
      })
    }
  } finally {
    saving.value = false
  }
}

const confirmDelete = (manager) => {
  confirm.require({
    message: `آیا از حذف مسئول پیگیری «${manager.user?.name}» برای معاونت «${manager.organizational_unit?.title}» مطمئن هستید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'حذف',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await ComplaintService.deleteComplaintManager(manager.id)
        toast.add({
          severity: 'success',
          summary: 'حذف شد',
          detail: 'مسئول پیگیری حذف شد.',
          life: 3000,
        })
        fetchManagers(currentPage.value)
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف با خطا مواجه شد.',
          life: 3000,
        })
      }
    },
  })
}

const onPage = (event) => {
  fetchManagers(event.page + 1)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(date))
}

onMounted(() => {
  fetchManagers(1)
  fetchOrganizationalUnits()
  fetchUsers()
})
</script>