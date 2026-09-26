<!-- resources/js/components/DocumentGrid.vue -->
<template>
  <div class="document-grid-container">
    <!-- Header با آمار -->
    <div class="grid-header">
      <div class="header-title">
        <div class="title-icon">
          <i class="pi pi-folder-open" />
        </div>
        <div>
          <h2>اسناد و مدارک</h2>
          <p class="subtitle">{{ totalRecords }} سند موجود است</p>
        </div>
      </div>

      <div class="header-actions">
        <div class="view-toggle">
          <Button
              :icon="viewMode === 'grid' ? 'pi pi-th-large' : 'pi pi-list'"
              :severity="viewMode === 'grid' ? 'primary' : 'secondary'"
              text
              rounded
              @click="toggleView"
              v-tooltip.top="viewMode === 'grid' ? 'نمایش لیستی' : 'نمایش گریدی'"
          />
        </div>
        <Button
            v-if="canCreatedocument"
            label="آپلود سند جدید"
            icon="pi pi-plus"
            severity="success"
            @click="openUploadDialog"
        />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats" v-if="documents.length > 0">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <span class="stat-icon" :style="{ background: stat.color }">
          <i :class="stat.icon" />
        </span>
        <div class="stat-info">
          <span class="stat-value">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>
    <!-- اگر داده وجود نداشته باشه، stats رو مخفی کن -->
    <div v-else-if="!loading" class="quick-stats empty-stats">
      <div class="stat-item">
        <span class="stat-icon" style="background: #9ca3af;">
          <i class="pi pi-inbox" />
        </span>
        <div class="stat-info">
          <span class="stat-value">0</span>
          <span class="stat-label">هیچ سندی یافت نشد</span>
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-box">
          <i class="pi pi-search" />
          <input
              v-model="filters.search"
              placeholder="جستجوی اسناد..."
              @input="debouncedSearch"
          />
          <i v-if="filters.search" class="pi pi-times clear-btn" @click="clearSearch" />
        </div>

        <div class="filter-tags">
          <button
              v-for="type in documentTypes"
              :key="type.value"
              class="filter-tag"
              :class="{ active: filters.type === type.value }"
              @click="toggleTypeFilter(type.value)"
          >
            <i :class="getTypeIcon(type.value)" />
            {{ type.label }}
            <span v-if="getTypeCount(type.value)" class="tag-count">
              {{ getTypeCount(type.value) }}
            </span>
          </button>
        </div>
      </div>

      <div class="filters-right">
        <Select
            v-model="filters.sort"
            :options="sortOptions"
            option-label="label"
            option-value="value"
            placeholder="مرتب‌سازی"
            @change="loadDocuments"
            class="sort-select"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div v-for="i in 6" :key="i" class="skeleton-card">
        <div class="skeleton-icon" />
        <div class="skeleton-content">
          <div class="skeleton-title" />
          <div class="skeleton-text" />
          <div class="skeleton-text" />
        </div>
      </div>
    </div>

    <!-- Empty State با انیمیشن -->
    <div v-else-if="documents.length === 0" class="empty-state">
      <div class="empty-animation">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="#f3f4f6" />
          <path d="M60 70 L140 70 L140 130 L60 130 Z" fill="#d1d5db" />
          <path d="M80 70 L80 90 L60 90 L60 70" fill="#9ca3af" />
          <line x1="75" y1="100" x2="125" y2="100" stroke="#9ca3af" stroke-width="2" />
          <line x1="75" y1="112" x2="115" y2="112" stroke="#9ca3af" stroke-width="2" />
          <line x1="75" y1="124" x2="105" y2="124" stroke="#9ca3af" stroke-width="2" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" stroke-width="2" />
        </svg>
      </div>
      <h3>هیچ سندی یافت نشد</h3>
      <p>اولین سند خود را آپلود کنید</p>
      <Button label="آپلود سند" icon="pi pi-upload" @click="openUploadDialog" />
    </div>

    <!-- Document Grid -->
    <div v-else class="document-grid" :class="viewMode">
      <div
          v-for="doc in documents"
          :key="doc.id"
          class="document-card"
          @click="openPreview(doc)"
      >
        <!-- Card Badge -->
        <div class="card-badge" :class="getTypeBadgeClass(doc.type)">
          {{ getTypeLabel(doc.type) }}
        </div>

        <!-- Card Header -->
        <div class="card-header">
          <div class="file-icon" :class="getFileIconClass(doc.mime_type)">
            <i :class="getFileIcon(doc.mime_type)" />
          </div>
          <div class="card-actions">
            <button
                v-if="canUpdatedocument"
                class="action-btn download"
                @click.stop="downloadDocument(doc)"
                v-tooltip.top="'دانلود'"
            >
              <i class="pi pi-download" />
            </button>
            <button
                v-if="canDeletedocument"
                class="action-btn delete"
                @click.stop="confirmDelete(doc)"
                v-tooltip.top="'حذف'"
            >
              <i class="pi pi-trash" />
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body">
          <h4 class="doc-title">{{ doc.title }}</h4>
          <p class="doc-description">{{ doc.description || 'بدون توضیحات' }}</p>

          <div class="doc-meta">
            <div class="meta-item">
              <i class="pi pi-user" />
              <span>{{ doc.uploaded_by || 'نامشخص' }}</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-calendar" />
              <span>{{ formatDate(doc.created_at) }}</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-file" />
              <span>{{ formatFileSize(doc.file_size) }}</span>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getRandomProgress() + '%' }" />
          </div>
          <span class="file-name">{{ doc.file_name }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination با طراحی خاص -->
    <div v-if="totalRecords > 0" class="custom-pagination">
      <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
      >
        <i class="pi pi-chevron-right" />
      </button>

      <div class="page-numbers">
        <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
      >
        <i class="pi pi-chevron-left" />
      </button>

      <span class="total-pages">از {{ totalPages }} صفحه</span>
    </div>

    <!-- Upload Dialog -->
    <DocumentUploader
        v-model:visible="uploadDialogVisible"
        :company-id="companyId"
        :documentable-type="documentableType"
        :documentable-id="documentableId"
        @saved="onUploadSuccess"
    />

    <!-- Preview Dialog -->
    <DocumentPreview
        v-model:visible="previewDialogVisible"
        :document="selectedDocument"
    />

    <!-- Delete Confirmation -->

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { documentService } from '@/services/documentService'
import DocumentUploader from './DocumentUploader.vue'
import DocumentPreview from './DocumentPreview.vue'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const props = defineProps({
  companyId: {
    type: [Number, String],
    required: true
  },
  documentableType: {
    type: String,
    required: true
  },
  documentableId: {
    type: [Number, String],
    required: true
  }
})

const confirm = useConfirm()
const toast = useToast()

// State
const documents = ref([])
const loading = ref(false)
const totalRecords = ref(0)
const uploadDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const selectedDocument = ref(null)
const viewMode = ref('grid')

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatedocument = computed(() => can('document.update'))
const canDeletedocument = computed(() => can('document.delete'))
const canCreatedocument = computed(() => can('document.create'))

const filters = reactive({
  type: null,
  search: '',
  sort: 'newest'
})

const lazyParams = reactive({
  first: 0,
  rows: 12
})

const documentTypes = [
  { label: 'همه', value: null, icon: 'pi pi-folder' },
  { label: 'نقشه', value: 'drawing', icon: 'pi pi-palette' },
  { label: 'فاکتور', value: 'invoice', icon: 'pi pi-receipt' },
  { label: 'قرارداد', value: 'contract', icon: 'pi pi-file-pdf' },
  { label: 'گزارش', value: 'report', icon: 'pi pi-chart-bar' },
  { label: 'تصویر', value: 'photo', icon: 'pi pi-image' },
  { label: 'سایر', value: 'other', icon: 'pi pi-file' }
]

const sortOptions = [
  { label: 'جدیدترین', value: 'newest' },
  { label: 'قدیمی‌ترین', value: 'oldest' },
  { label: 'بیشترین حجم', value: 'largest' },
  { label: 'کمترین حجم', value: 'smallest' },
  { label: 'الفبایی', value: 'alphabetical' }
]

// Computed
const currentPage = computed(() => Math.floor(lazyParams.first / lazyParams.rows) + 1)
const totalPages = computed(() => Math.ceil(totalRecords.value / lazyParams.rows))

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= delta) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})

// Methods

const getDocumentStats = () => {
  if (!documents.value || documents.value.length === 0) {
    return {
      drawing: 0,
      invoice: 0,
      contract: 0,
      report: 0,
      photo: 0,
      other: 0
    }
  }

  // گروه‌بندی بر اساس type
  const grouped = documents.value.reduce((acc, doc) => {
    const type = doc.type || 'other'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  console.log('📊 Grouped stats:', grouped)

  return {
    drawing: grouped.drawing || 0,
    invoice: grouped.invoice || 0,
    contract: grouped.contract || 0,
    report: grouped.report || 0,
    photo: grouped.photo || 0,
    other: grouped.other || 0
  }
}


const stats = computed(() => {
  const counts = {}
  documentTypes.forEach(t => {
    if (t.value) {
      const filtered = documents.value.filter(d => d.type === t.value)
      counts[t.value] = filtered.length
    }
  })

  return [
    {
      label: 'نقشه',
      icon: 'pi pi-palette',
      count: counts.drawing || 0,
      color: '#3b82f6'
    },
    {
      label: 'فاکتور',
      icon: 'pi pi-receipt',
      count: counts.invoice || 0,
      color: '#f59e0b'
    },
    {
      label: 'قرارداد',
      icon: 'pi pi-file-pdf',
      count: counts.contract || 0,
      color: '#10b981'
    },
    {
      label: 'گزارش',
      icon: 'pi pi-chart-bar',
      count: counts.report || 0,
      color: '#8b5cf6'
    },
    {
      label: 'تصویر',
      icon: 'pi pi-image',
      count: counts.photo || 0,
      color: '#ec4899'
    },
    // ✅ اضافه کردن other
    {
      label: 'سایر',
      icon: 'pi pi-file',
      count: counts.other || 0,
      color: '#6b7280'
    }
  ]
})


const loadDocuments = async () => {
  loading.value = true
  try {
    const params = {
      company_id: props.companyId,
      documentable_type: props.documentableType,
      documentable_id: props.documentableId,
      page: currentPage.value,
      per_page: lazyParams.rows
    }
    if (filters.type) params.type = filters.type
    if (filters.search) params.search = filters.search

    console.log('📤 Loading documents with params:', params)

    const response = await documentService.list(params)

    // ✅ دیباگ: بررسی ساختار پاسخ
    console.log('📥 API Response:', response)
    console.log('📥 Response data:', response.data)
    console.log('📥 Response data.data:', response.data?.data)

    // ✅ اطمینان از ساختار صحیح داده‌ها
    if (response.data && response.data.data) {
      documents.value = response.data.data
      totalRecords.value = response.data.meta?.total || response.data.data.length || 0
    } else if (Array.isArray(response.data)) {
      documents.value = response.data
      totalRecords.value = response.data.length
    } else {
      documents.value = []
      totalRecords.value = 0
    }

    console.log('✅ Documents loaded:', documents.value.length)
    console.log('✅ Total records:', totalRecords.value)

  } catch (error) {
    console.error('❌ Error loading documents:', error)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'بارگذاری اسناد با خطا مواجه شد',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

const toggleTypeFilter = (type) => {
  filters.type = filters.type === type ? null : type
  lazyParams.first = 0
  loadDocuments()
}

const getTypeCount = (type) => {
  return documents.value.filter(d => d.type === type).length
}

const clearSearch = () => {
  filters.search = ''
  lazyParams.first = 0
  loadDocuments()
}

const openUploadDialog = () => {
  uploadDialogVisible.value = true
}

const onUploadSuccess = () => {
  uploadDialogVisible.value = false
  loadDocuments()
}

const openPreview = (doc) => {
  selectedDocument.value = doc
  previewDialogVisible.value = true
}

const downloadDocument = (doc) => {
  documentService.download(doc.id)
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  lazyParams.first = (page - 1) * lazyParams.rows
  loadDocuments()
}

const confirmDelete = (doc) => {
  confirm.require({
    message: `آیا از حذف سند "${doc.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await documentService.delete(doc.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'سند با موفقیت حذف شد',
          life: 3000
        })
        loadDocuments()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: error.response?.data?.message || 'حذف سند با خطا مواجه شد',
          life: 3000
        })
      }
    }
  })
}

const getRandomProgress = () => {
  return Math.floor(Math.random() * 30) + 60
}

let searchTimeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    lazyParams.first = 0
    loadDocuments()
  }, 500)
}

// Helpers
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'امروز'
  if (days === 1) return 'دیروز'
  if (days < 7) return `${days} روز پیش`
  return d.toLocaleDateString('fa-IR')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'pi pi-file'
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf'
  if (mimeType.includes('image')) return 'pi pi-image'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'pi pi-file-excel'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'pi pi-file-zip'
  return 'pi pi-file'
}

const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'file-default'
  if (mimeType.includes('pdf')) return 'file-pdf'
  if (mimeType.includes('image')) return 'file-image'
  if (mimeType.includes('word')) return 'file-word'
  if (mimeType.includes('excel')) return 'file-excel'
  if (mimeType.includes('zip')) return 'file-zip'
  return 'file-default'
}

const getTypeLabel = (type) => {
  const labels = {
    drawing: 'نقشه',
    invoice: 'فاکتور',
    contract: 'قرارداد',
    report: 'گزارش',
    photo: 'تصویر',
    other: 'سایر'
  }
  return labels[type] || type
}

const getTypeIcon = (type) => {
  const icons = {
    drawing: 'pi pi-palette',
    invoice: 'pi pi-receipt',
    contract: 'pi pi-file-pdf',
    report: 'pi pi-chart-bar',
    photo: 'pi pi-image',
    other: 'pi pi-file'
  }
  return icons[type] || 'pi pi-file'
}

const getTypeBadgeClass = (type) => {
  const classes = {
    drawing: 'badge-drawing',
    invoice: 'badge-invoice',
    contract: 'badge-contract',
    report: 'badge-report',
    photo: 'badge-photo',
    other: 'badge-other'
  }
  return classes[type] || 'badge-other'
}

// Watch
watch(() => props.documentableId, () => {
  lazyParams.first = 0
  loadDocuments()
})
watch(documents, (newDocs) => {
  console.log('📊 Documents changed:', newDocs)
  console.log('📊 Stats recalculated:', stats.value)
}, { deep: true })

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-grid-container {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

/* Header */
.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.header-title h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.view-toggle {
  background: white;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Quick Stats */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.3s;
  background: white;
}

.search-box input:focus {
  border-color: #4f46e5;
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.search-box .pi-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.clear-btn {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.75rem;
}

.filter-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tag {
  padding: 0.4rem 0.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.filter-tag:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.filter-tag.active {
  background: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

.tag-count {
  background: rgba(255,255,255,0.2);
  padding: 0 6px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.sort-select {
  min-width: 140px;
}

/* Loading Skeleton */
.loading-state {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.skeleton-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.skeleton-title {
  height: 18px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  width: 70%;
}

.skeleton-text {
  height: 12px;
  background: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.3rem;
  width: 90%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-animation {
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

/* Document Grid */
.document-grid {
  display: grid;
  gap: 1rem;
}

.document-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.document-grid.list {
  grid-template-columns: 1fr;
}

.document-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.3s;
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
}

.document-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.12);
  border-color: #4f46e5;
}

.document-grid.list .document-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
}

/* Card Badge */
.card-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-drawing { background: #dbeafe; color: #1d4ed8; }
.badge-invoice { background: #fef3c7; color: #d97706; }
.badge-contract { background: #d1fae5; color: #059669; }
.badge-report { background: #ede9fe; color: #7c3aed; }
.badge-photo { background: #fce4ec; color: #db2777; }
.badge-other { background: #f3f4f6; color: #6b7280; }

/* Card Header */
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.file-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.file-pdf { background: #fee2e2; color: #dc2626; }
.file-image { background: #dbeafe; color: #2563eb; }
.file-word { background: #dbeafe; color: #1d4ed8; }
.file-excel { background: #d1fae5; color: #059669; }
.file-zip { background: #fef3c7; color: #d97706; }
.file-default { background: #f3f4f6; color: #6b7280; }

.card-actions {
  display: flex;
  gap: 0.3rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.download:hover {
  background: #dbeafe;
  color: #2563eb;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Card Body */
.doc-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.3rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.meta-item i {
  font-size: 0.7rem;
}

/* Card Footer */
.card-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.progress-bar {
  height: 3px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 2px;
  transition: width 1s ease;
}

.file-name {
  font-size: 0.7rem;
  color: #9ca3af;
  direction: ltr;
  text-align: left;
  display: block;
}

/* Custom Pagination */
.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.page-btn:hover:not(:disabled) {
  border-color: #4f46e5;
  color: #4f46e5;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.3rem;
}

.page-number {
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #6b7280;
}

.page-number:hover {
  border-color: #e5e7eb;
}

.page-number.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.total-pages {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .grid-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .header-actions {
    justify-content: space-between;
  }

  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters-left {
    flex-direction: column;
  }

  .filter-tags {
    justify-content: center;
  }

  .document-grid.grid {
    grid-template-columns: 1fr;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .custom-pagination {
    flex-wrap: wrap;
  }

  .page-numbers {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>