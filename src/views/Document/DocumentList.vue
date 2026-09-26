<!-- resources/js/components/DocumentList.vue -->
<template>
  <div class="document-list">
    <!-- Toolbar -->
    <div class="toolbar">
      <Button
          label="آپلود سند جدید"
          icon="pi pi-plus"
          severity="success"
          size="small"
          @click="openUploadDialog"
      />

      <div class="filters">
        <Select
            v-model="filters.type"
            :options="documentTypes"
            option-label="label"
            option-value="value"
            placeholder="نوع سند"
            class="filter-dropdown"
            @change="loadDocuments"
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

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>

    <!-- Empty State -->
    <div v-else-if="documents.length === 0" class="empty-state">
      <i class="pi pi-file text-4xl text-muted-color" />
      <p class="text-muted-color">هیچ سندی یافت نشد</p>
      <Button label="آپلود اولین سند" severity="primary" @click="openUploadDialog" />
    </div>

    <!-- Document Grid -->
    <div v-else class="document-grid">
      <div
          v-for="doc in documents"
          :key="doc.id"
          class="document-card"
      >
        <div class="document-icon">
          <i :class="getFileIcon(doc.mime_type)" />
        </div>

        <div class="document-info">
          <h4 class="document-title">{{ doc.title }}</h4>
          <p class="document-description">{{ doc.description || '-' }}</p>
          <div class="document-meta">
            <Tag :value="getTypeLabel(doc.type)" :severity="getTypeSeverity(doc.type)" size="small" />
            <span class="file-size">{{ formatFileSize(doc.file_size) }}</span>
            <span class="upload-date">{{ formatDate(doc.created_at) }}</span>
          </div>
          <span class="uploader">آپلود توسط: {{ doc.uploaded_by || 'نامشخص' }}</span>
        </div>

        <div class="document-actions">
          <Button
              icon="pi pi-download"
              text
              rounded
              severity="info"
              @click="downloadDocument(doc)"
              v-tooltip.top="'دانلود'"
          />
          <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="confirmDelete(doc)"
              v-tooltip.top="'حذف'"
          />
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <Paginator
        v-if="totalRecords > 0"
        :rows="lazyParams.rows"
        :totalRecords="totalRecords"
        @page="onPage"
        class="pagination"
    />

    <!-- Upload Dialog -->
    <DocumentUploader
        v-model:visible="uploadDialogVisible"
        :company-id="companyId"
        :documentable-type="documentableType"
        :documentable-id="documentableId"
        @saved="onUploadSuccess"
    />

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { documentService } from '@/services/documentService'
import DocumentUploader from './DocumentUploader.vue'

const props = defineProps({
  companyId: {
    type: [Number, String],
    required: true
  },
  documentableType: {
    type: String,
    required: true,
    validator: (value) => ['project', 'wbs_item', 'contract', 'petty_cash_transaction'].includes(value)
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

const filters = reactive({
  type: null,
  search: ''
})

const lazyParams = reactive({
  first: 0,
  rows: 10
})

const documentTypes = [
  { label: 'نقشه', value: 'drawing' },
  { label: 'فاکتور', value: 'invoice' },
  { label: 'قرارداد', value: 'contract' },
  { label: 'گزارش', value: 'report' },
  { label: 'تصویر', value: 'photo' },
  { label: 'سایر', value: 'other' }
]

// Methods
const loadDocuments = async () => {
  loading.value = true
  try {
    const params = {
      company_id: props.companyId,
      documentable_type: props.documentableType,
      documentable_id: props.documentableId,
      page: Math.floor(lazyParams.first / lazyParams.rows) + 1,
      per_page: lazyParams.rows
    }
    if (filters.type) params.type = filters.type
    if (filters.search) params.search = filters.search

    const response = await documentService.list(params)
    documents.value = response.data.data || []
    totalRecords.value = response.data.meta?.total || 0
  } catch (error) {
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

const openUploadDialog = () => {
  uploadDialogVisible.value = true
}

const onUploadSuccess = () => {
  uploadDialogVisible.value = false
  loadDocuments()
}

const onPage = (event) => {
  lazyParams.first = event.first
  lazyParams.rows = event.rows
  loadDocuments()
}

const downloadDocument = (doc) => {
  documentService.download(doc.id)
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'pi pi-file'
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf text-red-500'
  if (mimeType.includes('image')) return 'pi pi-image text-blue-500'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word text-blue-700'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'pi pi-file-excel text-green-600'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'pi pi-file-zip text-yellow-500'
  return 'pi pi-file'
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

const getTypeSeverity = (type) => {
  const severities = {
    drawing: 'info',
    invoice: 'warning',
    contract: 'success',
    report: 'secondary',
    photo: 'info',
    other: 'secondary'
  }
  return severities[type] || 'secondary'
}

// Watch for changes
watch(() => props.documentableId, () => {
  lazyParams.first = 0
  loadDocuments()
})

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.document-list {
  padding: 0.5rem;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background: white;
  border-radius: 6px;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.document-card {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.document-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.document-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.document-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.upload-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.uploader {
  font-size: 0.75rem;
  color: #6b7280;
}

.document-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  justify-content: center;
}

.pagination {
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-wrap: wrap;
  }

  .document-grid {
    grid-template-columns: 1fr;
  }
}
</style>