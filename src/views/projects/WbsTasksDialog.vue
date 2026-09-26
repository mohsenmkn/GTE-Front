<!-- resources/js/views/projects/WbsTasksDialog.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="`تسک‌های ${wbsItem?.name || ''}`"
      modal
      :style="{ width: '80vw', maxWidth: '1200px' }"
      class="wbs-tasks-dialog"
  >
    <!-- Toolbar -->
    <div class="toolbar">
      <Button
          v-if="canCreatetasks"
          label="تسک جدید"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openCreateTaskDialog"
      />

      <div class="filters">
        <Select
            v-model="filters.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="وضعیت"
            class="filter-dropdown"
            @change="loadTasks"
            showClear
        />

        <Select
            v-model="filters.priority"
            :options="priorityOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="اولویت"
            class="filter-dropdown"
            @change="loadTasks"
            showClear
        />

        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText
              v-model="filters.search"
              placeholder="جستجو..."
              @input="debouncedSearch"
          />
        </IconField>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="summary-stats" v-if="tasks.length">
      <div class="stat-item">
        <span class="stat-label">کل تسک‌ها</span>
        <span class="stat-value">{{ totalTasks }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">در حال انجام</span>
        <span class="stat-value text-warning">{{ inProgressCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">تکمیل شده</span>
        <span class="stat-value text-success">{{ completedCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">پیشرفت کل</span>
        <span class="stat-value">{{ overallProgress }}%</span>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
        :value="tasks"
        :loading="loading"
        :lazy="true"
        :totalRecords="totalRecords"
        :rows="lazyParams.rows"
        :first="lazyParams.first"
        @page="onPage"
        @sort="onSort"
        stripedRows
        rowHover
        paginator
        :rowsPerPageOptions="[10, 25, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="نمایش {first} تا {last} از {totalRecords} رکورد"
        class="tasks-table"
    >
      <Column field="title" header="عنوان" sortable>
        <template #body="{ data }">
          <div class="task-title">
            <i :class="getPriorityIcon(data.priority)" :style="{ color: getPriorityColor(data.priority) }" />
            <span>{{ data.title }}</span>
          </div>
        </template>
      </Column>

      <Column field="status" header="وضعیت" sortable>
        <template #body="{ data }">
          <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
        </template>
      </Column>

      <Column field="priority" header="اولویت" sortable>
        <template #body="{ data }">
          <Tag :value="getPriorityLabel(data.priority)" :severity="getPrioritySeverity(data.priority)" />
        </template>
      </Column>

      <Column field="assigned_to" header="مسئول">
        <template #body="{ data }">
          <span v-if="data.assigned_user">
            {{ data.assigned_user.name }}
          </span>
          <span v-else class="text-muted-color">تعیین نشده</span>
        </template>
      </Column>

      <Column field="progress_percent" header="پیشرفت" sortable>
        <template #body="{ data }">
          <div class="progress-cell">
            <ProgressBar :value="data.progress_percent || 0" :showValue="true" style="width: 100px; height: 6px;" />
          </div>
        </template>
      </Column>

      <Column field="due_date" header="مهلت" sortable>
        <template #body="{ data }">
          <div class="due-date">
            <i :class="data.is_overdue ? 'pi pi-clock text-red-500' : 'pi pi-calendar'" />
            <span :class="{ 'text-red-500 font-bold': data.is_overdue }">
              {{ formatDate(data.due_date) }}
            </span>
          </div>
        </template>
      </Column>

      <Column header="عملیات" :frozen="true" alignFrozen="left" style="min-width: 120px;">
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
                v-if="data.status !== 'completed'"
                v-show="canUpdatetasks"
                icon="pi pi-check"
                text
                rounded
                severity="success"
                size="small"
                @click="completeTask(data)"
                v-tooltip.top="'تکمیل تسک'"
            />
            <Button
                v-if="canUpdatetasks"
                icon="pi pi-pencil"
                text
                rounded
                severity="info"
                size="small"
                @click="openEditTaskDialog(data)"
                v-tooltip.top="'ویرایش'"
            />
            <Button
                v-if="canDeletetasks"
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                size="small"
                @click="confirmDeleteTask(data)"
                v-tooltip.top="'حذف'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Empty State -->
    <div v-if="!loading && tasks.length === 0" class="empty-state">
      <i class="pi pi-check-circle text-4xl text-muted-color" />
      <p class="text-muted-color">هیچ تسکی برای این آیتم WBS یافت نشد</p>
      <Button label="ایجاد تسک جدید" severity="primary" @click="openCreateTaskDialog" />
    </div>

    <!-- Task Form Dialog -->
    <WbsTaskForm
        v-model:visible="taskFormDialogVisible"
        :wbs-item-id="wbsItem?.id"
        :task-id="editingTaskId"
        @saved="onTaskFormSuccess"
    />

    <!-- Delete Confirmation -->

  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import WbsTaskForm from './WbsTaskForm.vue'
import { wbsService } from '@/services/wbsService'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wbsItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

const confirm = useConfirm()
const toast = useToast()

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatetasks = computed(() => can('tasks.update'))
const canDeletetasks = computed(() => can('tasks.delete'))
const canCreatetasks = computed(() => can('tasks.create'))

// State
const tasks = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const taskFormDialogVisible = ref(false)
const editingTaskId = ref(null)

const filters = reactive({
  status: null,
  priority: null,
  search: ''
})

const lazyParams = reactive({
  first: 0,
  rows: 10,
  sortField: null,
  sortOrder: null
})

const statusOptions = [
  { label: 'در انتظار', value: 'pending' },
  { label: 'در حال انجام', value: 'in_progress' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'مسدود', value: 'blocked' }
]

const priorityOptions = [
  { label: 'کم', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'بالا', value: 'high' },
  { label: 'بحرانی', value: 'critical' }
]

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const totalTasks = computed(() => tasks.value.length)
const inProgressCount = computed(() =>
    tasks.value.filter(t => t.status === 'in_progress').length
)
const completedCount = computed(() =>
    tasks.value.filter(t => t.status === 'completed').length
)
const overallProgress = computed(() => {
  if (tasks.value.length === 0) return 0
  const total = tasks.value.reduce((sum, t) => sum + (t.progress_percent || 0), 0)
  return Math.round(total / tasks.value.length)
})

// Methods
const loadTasks = async () => {
  if (!props.wbsItem?.id) return

  loading.value = true
  try {
    const params = {
      page: Math.floor(lazyParams.first / lazyParams.rows) + 1,
      per_page: lazyParams.rows,
      sort_by: lazyParams.sortField,
      sort_order: lazyParams.sortOrder === 1 ? 'asc' : 'desc'
    }

    if (filters.status) params.status = filters.status
    if (filters.priority) params.priority = filters.priority
    if (filters.search) params.search = filters.search

    const response = await wbsService.getTasks(props.wbsItem.id, params)
    tasks.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری تسک‌ها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const openCreateTaskDialog = () => {
  editingTaskId.value = null
  taskFormDialogVisible.value = true
}

const openEditTaskDialog = (task) => {
  editingTaskId.value = task.id
  taskFormDialogVisible.value = true
}

const onTaskFormSuccess = () => {
  taskFormDialogVisible.value = false
  loadTasks()
}

const completeTask = async (task) => {
  confirm.require({
    message: `آیا از تکمیل تسک "${task.title}" اطمینان دارید؟`,
    header: 'تکمیل تسک',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تکمیل شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await wbsService.completeTask(props.wbsItem.id, task.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تسک با موفقیت تکمیل شد',
          life: 3000
        })
        loadTasks()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'تکمیل تسک با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

const confirmDeleteTask = (task) => {
  confirm.require({
    message: `آیا از حذف تسک "${task.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await wbsService.deleteTask(props.wbsItem.id, task.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تسک با موفقیت حذف شد',
          life: 3000
        })
        loadTasks()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'حذف تسک با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
  loadTasks()
}

const onSort = (event) => {
  lazyParams.sortField = event.sortField
  lazyParams.sortOrder = event.sortOrder
  lazyParams.first = 0
  loadTasks()
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    lazyParams.first = 0
    loadTasks()
  }, 500)
}

// Helpers
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'در انتظار',
    in_progress: 'در حال انجام',
    completed: 'تکمیل شده',
    blocked: 'مسدود'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    blocked: 'danger'
  }
  return severities[status] || 'secondary'
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'کم',
    medium: 'متوسط',
    high: 'بالا',
    critical: 'بحرانی'
  }
  return labels[priority] || priority
}

const getPrioritySeverity = (priority) => {
  const severities = {
    low: 'secondary',
    medium: 'info',
    high: 'warning',
    critical: 'danger'
  }
  return severities[priority] || 'secondary'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'pi pi-arrow-down',
    medium: 'pi pi-minus',
    high: 'pi pi-arrow-up',
    critical: 'pi pi-exclamation-triangle'
  }
  return icons[priority] || 'pi pi-circle'
}

const getPriorityColor = (priority) => {
  const colors = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    critical: '#ef4444'
  }
  return colors[priority] || '#6b7280'
}

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal && props.wbsItem) {
    lazyParams.first = 0
    loadTasks()
  }
})

watch(() => props.wbsItem?.id, (newVal) => {
  if (newVal && props.visible) {
    lazyParams.first = 0
    loadTasks()
  }
})
</script>

<style scoped>
.wbs-tasks-dialog :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-dropdown {
  min-width: 140px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #1f2937;
}

.text-warning {
  color: #f59e0b !important;
}

.text-success {
  color: #22c55e !important;
}

.tasks-table {
  background: white;
  border-radius: 6px;
}

.task-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-cell {
  display: flex;
  align-items: center;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
}

@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-wrap: wrap;
  }

  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }

  .filter-dropdown {
    min-width: 100%;
  }
}
</style>