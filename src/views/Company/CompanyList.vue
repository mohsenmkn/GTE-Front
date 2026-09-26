<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">شرکت‌ها</h1>
      <Button
          v-if="auth.can('companies.create')"
          label="شرکت جدید"
          icon="pi pi-plus"
          @click="openCreate"
      />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <InputText
          v-model="filters.search"
          placeholder="جستجو..."
          class="w-64"
          @keyup.enter="loadCompanies"
      />
      <Select
          v-model="filters.type"
          :options="companyTypes"
          option-label="label"
          option-value="value"
          placeholder="نوع شرکت"
          class="w-44"
          show-clear
          @change="loadCompanies"
      />
      <Button label="جستجو" icon="pi pi-search" severity="secondary" @click="loadCompanies" />
    </div>
    <Button label="افزودن شرکت" @click="openCreate" />
    <!-- Table -->
    <div class="card">
      <DataTable
          :value="store.companies"
          :loading="store.loading"
          striped-rows
          class="text-sm"
      >
        <Column field="id" header="#" style="width: 60px" />
        <Column field="name" header="نام شرکت" />
        <Column field="type_label" header="نوع" />
        <Column field="registration_number" header="شماره ثبت" />
        <Column field="phone" header="تلفن" />
        <Column header="عملیات" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                  v-if="auth.can('companies.update')"
                  icon="pi pi-pencil"
                  size="small"
                  severity="secondary"
                  text
                  @click="openEdit(data)"
              />
              <Button
                  v-if="auth.can('companies.delete')"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-8 text-slate-400">رکوردی یافت نشد</div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <Paginator
          v-if="store.pagination.total > store.pagination.perPage"
          :rows="store.pagination.perPage"
          :total-records="store.pagination.total"
          :first="(store.pagination.currentPage - 1) * store.pagination.perPage"
          @page="onPageChange"
          class="mt-2"
      />
    </div>

    <!-- Create / Edit Dialog -->
    <Dialog
        v-model:visible="dialogVisible"
        :header="editingItem ? 'ویرایش شرکت' : 'شرکت جدید'"
        modal
        class="w-full max-w-lg"
        :draggable="false"
    >
      <CompanyForm
          :initial-data="editingItem"
          :loading="formLoading"
          @submit="handleSubmit"
          @cancel="dialogVisible = false"
      />
    </Dialog>

    <!-- Delete Confirm -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authold.js'
import { useCompanyStore } from '@/stores/company'
import CompanyForm from './CompanyForm.vue'


const showForm = ref(false)
const editId = ref(null)
const auth = useAuthStore()
const store = useCompanyStore()
const confirm = useConfirm()
const toast = useToast()

const dialogVisible = ref(false)
const editingItem = ref(null)
const formLoading = ref(false)

const filters = ref({
  search: '',
  type: null,
})

const companyTypes = [
  { label: 'دولتی', value: 'government' },
  { label: 'خصوصی', value: 'private' },
  { label: 'تعاونی', value: 'cooperative' },
]

const loadCompanies = (page = 1) => {
  store.fetchCompanies({
    page,
    search: filters.value.search || undefined,
    type: filters.value.type || undefined,
  })
}

onMounted(() => loadCompanies())

const onPageChange = (e) => {
  loadCompanies(e.page + 1)
}


const handleSubmit = async (payload) => {
  formLoading.value = true
  try {
    if (editingItem.value) {
      await store.updateCompany(editingItem.value.id, payload)
      toast.add({ severity: 'success', summary: 'موفق', detail: 'شرکت ویرایش شد', life: 3000 })
    } else {
      await store.createCompany(payload)
      toast.add({ severity: 'success', summary: 'موفق', detail: 'شرکت جدید ثبت شد', life: 3000 })
    }
    dialogVisible.value = false
  } catch (e) {
    const msg = e?.response?.data?.message || 'خطا در ثبت اطلاعات'
    toast.add({ severity: 'error', summary: 'خطا', detail: msg, life: 4000 })
  } finally {
    formLoading.value = false
  }
}

const confirmDelete = (item) => {
  confirm.require({
    message: `آیا از حذف شرکت «${item.name}» مطمئن هستید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'حذف',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.deleteCompany(item.id)
        toast.add({ severity: 'success', summary: 'حذف شد', detail: 'شرکت با موفقیت حذف شد', life: 3000 })
      } catch (e) {
        const msg = e?.response?.data?.message || 'خطا در حذف'
        toast.add({ severity: 'error', summary: 'خطا', detail: msg, life: 4000 })
      }
    },
  })
}

function openCreate() {
  editId.value = null
  showForm.value = true
}

function openEdit(id) {
  editId.value = id
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  fetchCompanies()
}
</script>
