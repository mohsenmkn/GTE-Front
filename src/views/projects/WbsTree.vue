<!-- resources/js/views/projects/WbsTree.vue -->
<template>
  <div class="wbs-tree-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="flex gap-2">
        <Button
            v-if="canCreatewbs"
            label="افزودن آیتم جدید"
            icon="pi pi-plus"
            severity="success"
            size="small"
            @click="openCreateDialog(null)"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            @click="loadTree"
        />
      </div>

      <div class="filters">
        <Select
            v-model="filters.category"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="دسته‌بندی"
            class="filter-dropdown"
            @change="loadTree"
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
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-label">کل آیتم‌ها</span>
        <span class="stat-value">{{ totalItems }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">پیشرفت کل</span>
        <span class="stat-value">{{ overallProgress }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">هزینه کل</span>
        <span class="stat-value">{{ formatMoney(totalCost) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">تعداد تسک‌ها</span>
        <span class="stat-value">{{ totalTasks }}</span>
      </div>
    </div>

    <!-- Tree View -->
    <div class="tree-view" v-if="!loading">
      <div v-if="treeData.length === 0" class="empty-state">
        <i class="pi pi-sitemap text-4xl text-muted-color"></i>
        <p class="text-muted-color">هیچ آیتم WBS یافت نشد</p>
        <Button label="ایجاد اولین آیتم" severity="primary" @click="openCreateDialog(null)" />
      </div>

      <div v-else>

        <WbsTreeNode
            v-for="item in filteredTree"
            :key="item.id"
            :node="item"
            :level="0"
            @edit="editItem"
            @delete="confirmDelete"
            @add-child="addChild"
            @view-tasks="openTasksDialog"
            />

      </div>
    </div>

    <!-- Loading -->
    <div v-else class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <!-- WBS Form Dialog -->
    <WbsForm
        v-model:visible="formDialogVisible"
        :project-id="projectId"
        :wbs-id="editingId"
        :parent-id="parentId"
        @saved="onFormSuccess"
   />
    <!-- Tasks Dialog-->
    <WbsTasksDialog
        v-model:visible="tasksDialogVisible"
        :wbs-item="selectedWbsItem"
    />


  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import WbsTreeNode from '@/views/projects/WbsTreeNode.vue'
import WbsForm from '@/views/projects/WbsForm.vue'
import WbsTasksDialog from '@/views/projects/WbsTasksDialog.vue'
import { wbsService } from '@/services/wbsService'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  }
})

const confirm = useConfirm()
const toast = useToast()

// State
const treeData = ref([])
const loading = ref(false)
const formDialogVisible = ref(false)
const tasksDialogVisible = ref(false)
const editingId = ref(null)
const parentId = ref(null)
const selectedWbsItem = ref(null)


const filters = reactive({
  category: null,
  search: ''
})

const categoryOptions = [
  { label: 'عمرانی', value: 'civil' },
  { label: 'برقی', value: 'electrical' },
  { label: 'مکانیکی', value: 'mechanical' }
]

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}

const canCreatewbs = computed(() => can('wbs.create'))



// Computed
const totalItems = computed(() => {
  const count = (items) => {
    let total = items.length
    items.forEach(item => {
      if (item.children?.length) {
        total += count(item.children)
      }
    })
    return total
  }
  return count(treeData.value)
})

const totalCost = computed(() => {
  const sum = (items) => {
    let total = 0
    items.forEach(item => {
      total += parseFloat(item.total_price || 0)
      if (item.children?.length) {
        total += sum(item.children)
      }
    })
    return total
  }
  return sum(treeData.value)
})

const totalTasks = computed(() => {
  const count = (items) => {
    let total = 0
    items.forEach(item => {
      total += (item.tasks_count || 0)
      if (item.children?.length) {
        total += count(item.children)
      }
    })
    return total
  }
  return count(treeData.value)
})

const overallProgress = computed(() => {
  const getProgress = (items) => {
    let totalWeight = 0
    let weightedProgress = 0

    items.forEach(item => {
      const weight = parseFloat(item.weight || 1)
      const progress = parseFloat(item.progress_percent || 0)

      totalWeight += weight
      weightedProgress += (progress * weight)

      if (item.children?.length) {
        const childResult = getProgress(item.children)
        weightedProgress += childResult.weightedProgress
        totalWeight += childResult.totalWeight
      }
    })

    return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0
  }

  const result = getProgress(treeData.value)
  return result.weightedProgress !== undefined ? result : 0
})

const filteredTree = computed(() => {
  if (!filters.search && !filters.category) return treeData.value

  const filterItems = (items) => {
    return items
        .map(item => {
          const matchesSearch = item.name.includes(filters.search) ||
              item.code.includes(filters.search)
          const matchesCategory = !filters.category || item.category === filters.category

          const filteredChildren = item.children ? filterItems(item.children) : []
          const hasMatchingChild = filteredChildren.length > 0

          if (matchesSearch && matchesCategory || hasMatchingChild) {
            return {
              ...item,
              children: filteredChildren
            }
          }
          return null
        })
        .filter(Boolean)
  }

  return filterItems(treeData.value)
})

// Methods
const loadTree = async () => {
  loading.value = true
  try {
    const response = await wbsService.tree(props.projectId)
    treeData.value = response.data.data || []
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری درخت WBS با خطا مواجه شد',
      life: 3000
    })
    console.log(error.message)
  } finally {
    loading.value = false
  }
}

const openCreateDialog = (item, isEdit = false) => {
  if (item && isEdit) {
    // ✅ حالت ویرایش
    editingId.value = item.id
    parentId.value = null  // ✅ برای ویرایش parentId رو null بذار
  } else if (item) {
    // ✅ حالت افزودن زیرمجموعه
    editingId.value = null
    parentId.value = item.id
  } else {
    // ✅ حالت ایجاد جدید (ریشه)
    editingId.value = null
    parentId.value = null
  }
  formDialogVisible.value = true
}

// ✅ تابع جداگانه برای ویرایش
const editItem = (item) => {
  openCreateDialog(item, true)
}

// ✅ تابع جداگانه برای افزودن زیرمجموعه
const addChild = (item) => {
  openCreateDialog(item, false)
}

const openTasksDialog = (item) => {
  selectedWbsItem.value = item
  tasksDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadTree()
}

const confirmDelete = (item) => {
  confirm.require({
    message: `آیا از حذف آیتم "${item.name}" و تمام زیرمجموعه‌های آن اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await wbsService.delete(item.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'آیتم با موفقیت حذف شد',
          life: 3000
        })
        loadTree()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: 'حذف آیتم با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

const formatMoney = (value) => {
  return new Intl.NumberFormat('fa-IR').format(value || 0) + ' ریال'
}

let searchTimeout

watch([editingId, parentId], ([newEdit, newParent]) => {
  console.log('📝 editingId:', newEdit, 'parentId:', newParent)
})
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // filter handled by computed
  }, 300)
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.wbs-tree-container {
  padding: 1rem;
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
  background: white;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

.tree-view {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  min-height: 300px;
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
}
</style>