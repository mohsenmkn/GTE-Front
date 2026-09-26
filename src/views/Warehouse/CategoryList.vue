<!-- resources/js/views/inventory/CategoryList.vue -->
<template>
  <div class="category-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-title">
        <i class="pi pi-tags text-2xl text-primary" />
        <h1>دسته‌بندی کالاها</h1>
        <span class="badge">{{ totalRecords }}</span>
      </div>

      <div class="header-actions">
        <Button
            label="دسته‌بندی جدید"
            icon="pi pi-plus"
            severity="success"
            @click="openCreateDialog"
        />
        <Button
            icon="pi pi-refresh"
            text
            rounded
            @click="loadCategories"
            v-tooltip.top="'بروزرسانی'"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-box">
          <i class="pi pi-search" />
          <input
              v-model="filters.search"
              placeholder="جستجوی دسته‌بندی..."
              @input="debouncedSearch"
          />
        </div>

        <Select
            v-model="filters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="وضعیت"
            class="filter-select"
            @change="applyFilters"
            showClear
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-header" />
        <div class="skeleton-body" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="empty-state">
      <i class="pi pi-tags text-5xl text-muted-color" />
      <h3>هیچ دسته‌بندی یافت نشد</h3>
      <p>اولین دسته‌بندی را ایجاد کنید</p>
      <Button label="ایجاد دسته‌بندی" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Categories Tree -->
    <div v-else class="categories-tree">
      <div class="tree-controls">
        <Button
            :label="expandAll ? 'بستن همه' : 'باز کردن همه'"
            icon="pi pi-chevron-down"
            text
            size="small"
            @click="toggleExpandAll"
        />
      </div>

      <div class="tree-container">
        <CategoryTreeNode
            v-for="category in treeData"
            :key="category.id"
            :category="category"
            :level="0"
            @edit="openEditDialog"
            @delete="confirmDelete"
            @add-child="openCreateDialog"
            @status-toggle="toggleStatus"
        />
      </div>
    </div>

    <!-- Category Form Dialog -->
    <CategoryForm
        v-model:visible="formDialogVisible"
        :category-id="editingId"
        :parent-id="parentId"
        @saved="onFormSuccess"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { inventoryService } from '@/services/inventoryService'
import CategoryForm from './CategoryForm.vue'
import CategoryTreeNode from './CategoryTreeNode.vue'

const confirm = useConfirm()
const toast = useToast()

// State
const categories = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const formDialogVisible = ref(false)
const editingId = ref(null)
const parentId = ref(null)
const expandAll = ref(false)

const filters = reactive({
  search: '',
  status: null
})

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' }
]

// Computed
const treeData = computed(() => {
  // ساخت درخت از داده‌های مسطح
  const buildTree = (items, parentId = null) => {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
          hasChildren: items.some(child => child.parent_id === item.id)
        }))
  }

  return buildTree(categories.value)
})

// Methods
const loadCategories = async () => {
  loading.value = true
  try {
    const params = {
      per_page: 100,
      search: filters.search || undefined,
      status: filters.status || undefined
    }

    const response = await inventoryService.getCategories(params)
    categories.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری دسته‌بندی‌ها با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  loadCategories()
}

const openCreateDialog = (parent = null) => {
  editingId.value = null
  parentId.value = parent?.id || null
  formDialogVisible.value = true
}

const openEditDialog = (category) => {
  editingId.value = category.id
  parentId.value = category.parent_id
  formDialogVisible.value = true
}

const onFormSuccess = () => {
  formDialogVisible.value = false
  loadCategories()
}

const toggleExpandAll = () => {
  expandAll.value = !expandAll.value
  // ارسال رویداد به کامپوننت‌های فرزند
  document.dispatchEvent(new CustomEvent('toggle-expand', {
    detail: { expand: expandAll.value }
  }))
}

const toggleStatus = async (category) => {
  try {
    const newStatus = category.status === 'active' ? 'inactive' : 'active'
    await inventoryService.updateCategory(category.id, { status: newStatus })

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `وضعیت دسته‌بندی به ${newStatus === 'active' ? 'فعال' : 'غیرفعال'} تغییر کرد`,
      life: 3000
    })
    loadCategories()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'تغییر وضعیت با خطا مواجه شد',
      life: 3000
    })
  }
}

const confirmDelete = (category) => {
  // بررسی وجود زیرمجموعه
  const hasChildren = categories.value.some(c => c.parent_id === category.id)

  if (hasChildren) {
    toast.add({
      severity: 'warn',
      summary: 'توجه',
      detail: 'این دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست.',
      life: 5000
    })
    return
  }

  confirm.require({
    message: `آیا از حذف دسته‌بندی "${category.name}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await inventoryService.deleteCategory(category.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'دسته‌بندی با موفقیت حذف شد',
          life: 3000
        })
        loadCategories()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف دسته‌بندی با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadCategories()
  }, 500)
}

// Lifecycle
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.category-list {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.badge {
  background: #e5e7eb;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 2.5rem 0.6rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: #4f46e5;
  outline: none;
}

.search-box .pi-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.filter-select {
  min-width: 140px;
}

.categories-tree {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.tree-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.tree-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Loading */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  height: 30px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  width: 60%;
}

.skeleton-body {
  height: 20px;
  background: #f3f4f6;
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  color: #1f2937;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-left {
    flex-direction: column;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }
}
</style>