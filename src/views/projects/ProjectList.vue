<template>
  <div class="p-4">
    <Toast />
    <ConfirmDialog />

    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">لیست پروژه‌ها</h1>
      <Button
          label="پروژه جدید"
          icon="pi pi-plus"
          @click="openCreateDialog"
      />
    </div>

    <DataTable
        :value="projects"
        :loading="loading"
        class="p-datatable-sm"
    >
      <Column field="name" header="نام پروژه" />
      <Column field="description" header="توضیحات" />
      <Column field="status" header="وضعیت" >
        <template #body="{ data }">
          <Tag
              :value="getStatusLabel(data.status)"
              :icon="getStatusIcon(data.status)"
              :severity="getStatusSeverity(data.status)"
              :class="sizeClasses"
              rounded
              class="status-tag"
          />
        </template>
      </Column>
      <Column header="عملیات">
        <template #body="{ data }">
          <Button
              v-if="can('projects.update')"
              icon="pi pi-pencil"
              class="p-button-sm p-button-text"
              @click="openEditDialog(data.id)"
          />
          <Button
              v-if="can('projects.delete')"
              icon="pi pi-trash"
              class="p-button-sm p-button-text p-button-danger"
              @click="deleteProject(data.id)"
          />
          <Button
              v-if="can('projects.view')"
              icon="pi pi-eye"
              text
              rounded
              severity="info"
              @click="$router.push({ name: 'projects.detail', params: { id: data.id } })"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog
        v-model:visible="showDialog"
        :header="dialogTitle"
        modal
        :style="{ width: '50vw' }"
        :closable="true"
    >
      <DynamicForm
          module="projects"
          :model-id="editingId"
          @success="handleSuccess"
          @cancel="handleCancel"
      />
    </Dialog>
  </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/axios'
import DynamicForm from '@/components/General/DynamicForm.vue'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()


const toast = useToast()
const confirm = useConfirm()

const projects = ref([])
const loading = ref(false)
const showDialog = ref(false)
const editingId = ref(null)

const isEditMode = computed(() => editingId.value !== null)

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}

const dialogTitle = computed(() => {
  return isEditMode.value ? 'ویرایش پروژه' : 'پروژه جدید'
})

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'normal' // 'small', 'normal', 'large'
  }
})

const statusConfig = {
  active: {
    severity: 'success',
    icon: 'pi pi-play-circle',
    label: 'فعال',
    color: '#10b981',
    bgColor: '#d1fae5',
    dotColor: '#10b981'
  },
  planning: {
    severity: 'info',
    icon: 'pi pi-clock',
    label: 'در حال برنامه‌ریزی',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    dotColor: '#3b82f6'
  },
  on_hold: {
    severity: 'warn',
    icon: 'pi pi-pause-circle',
    label: 'متوقف شده',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    dotColor: '#f59e0b'
  },
  completed: {
    severity: 'secondary',
    icon: 'pi pi-check-circle',
    label: 'تکمیل شده',
    color: '#10b981',
    bgColor: '#d1fae5',
    dotColor: '#10b981'
  },
  cancelled: {
    severity: 'danger',
    icon: 'pi pi-times-circle',
    label: 'لغو شده',
    color: '#ef4444',
    bgColor: '#fee2e2',
    dotColor: '#ef4444'
  }
}
const getStatusSeverity = (status) => {
  return statusConfig[status]?.severity || 'secondary'
}

const getStatusIcon = (status) => {
  return statusConfig[status]?.icon || 'pi pi-circle'
}

const getStatusLabel = (status) => {
  return statusConfig[status]?.label || status
}

const sizeClasses = computed(() => {
  const sizes = {
    small: 'text-xs px-2 py-0.5',
    normal: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-1.5'
  }
  return sizes[props.size] || sizes.normal
})

const loadProjects = async () => {
  loading.value = true
  try {
    const response = await api.get('/projects')
    projects.value = response.data.data || response.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت لیست پروژه‌ها',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  editingId.value = null
  showDialog.value = true
}

const openEditDialog = (id) => {
  editingId.value = id
  showDialog.value = true
}

const handleSuccess = (data) => {
  showDialog.value = false
  editingId.value = null

  toast.add({
    severity: 'success',
    summary: 'موفق',
    detail: isEditMode.value ? 'پروژه با موفقیت ویرایش شد' : 'پروژه با موفقیت ایجاد شد',
    life: 3000
  })

  loadProjects()
}

const handleCancel = () => {
  showDialog.value = false
  editingId.value = null
}

const deleteProject = (id) => {
  confirm.require({
    message: 'آیا از حذف این پروژه اطمینان دارید؟',
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'انصراف',
    acceptLabel: 'حذف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/projects/${id}`)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'پروژه با موفقیت حذف شد',
          life: 3000
        })
        await loadProjects()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'خطا در حذف پروژه',
          life: 3000
        })
      }
    }
  })
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.status-tag {
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}
:deep(.p-tag-warning) {
  background: #fef3c7 !important;
  color: #92400e !important;
  border: 1px solid #fde68a !important;
}

:deep(.p-tag-warning .p-tag-icon) {
  color: #f59e0b !important;
}
.status-tag:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* استایل‌های سفارشی برای هر وضعیت */
:deep(.p-tag-success) {
  background: #d1fae5 !important;
  color: #065f46 !important;
  border: 1px solid #a7f3d0 !important;
}

:deep(.p-tag-info) {
  background: #dbeafe !important;
  color: #1e40af !important;
  border: 1px solid #bfdbfe !important;
}

:deep(.p-tag-warning) {
  background: #fef3c7 !important;
  color: #92400e !important;
  border: 1px solid #fde68a !important;
}

:deep(.p-tag-danger) {
  background: #fee2e2 !important;
  color: #991b1b !important;
  border: 1px solid #fca5a5 !important;
}
</style>
