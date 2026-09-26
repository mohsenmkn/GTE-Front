<!-- resources/js/components/DocumentPreview.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="document?.title || 'پیش‌نمایش سند'"
      modal
      :style="{ width: '80vw', maxWidth: '900px' }"
      class="document-preview"
  >
    <div v-if="document" class="preview-content">
      <!-- Preview Area -->
      <div class="preview-area">
        <!-- نمایش تصویر -->
        <div v-if="isImage" class="image-preview">
          <img
              :src="getFileUrl"
              :alt="document.title"
              @error="handleImageError"
          />
          <div v-if="imageError" class="error-message">
            <i class="pi pi-exclamation-triangle" />
            <p>خطا در بارگذاری تصویر</p>
            <Button label="دانلود فایل" icon="pi pi-download" @click="downloadDocument" />
          </div>
        </div>

        <!-- نمایش PDF -->
        <div v-else-if="isPdf" class="pdf-preview">
          <iframe
              :src="getFileUrl"
              frameborder="0"
              @error="handlePdfError"
          />
          <div v-if="pdfError" class="error-message">
            <i class="pi pi-exclamation-triangle" />
            <p>خطا در بارگذاری PDF</p>
            <Button label="دانلود فایل" icon="pi pi-download" @click="downloadDocument" />
          </div>
        </div>

        <!-- سایر فایل‌ها -->
        <div v-else class="file-info-preview">
          <div class="big-icon" :class="getFileIconClass(document.mime_type)">
            <i :class="getFileIcon(document.mime_type)" />
          </div>
          <h3>{{ document.file_name }}</h3>
          <p>نوع فایل: {{ document.mime_type }}</p>
          <p>حجم: {{ formatFileSize(document.file_size) }}</p>
          <Button
              label="دانلود فایل"
              icon="pi pi-download"
              @click="downloadDocument"
              class="mt-3"
          />
        </div>
      </div>

      <!-- Document Info -->
      <div class="preview-sidebar">
        <div class="info-section">
          <h4>اطلاعات سند</h4>
          <div class="info-item">
            <span class="label">عنوان</span>
            <span class="value">{{ document.title }}</span>
          </div>
          <div class="info-item">
            <span class="label">نوع</span>
            <Tag :value="getTypeLabel(document.type)" :severity="getTypeSeverity(document.type)" />
          </div>
          <div class="info-item">
            <span class="label">نام فایل</span>
            <span class="value">{{ document.file_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">حجم</span>
            <span class="value">{{ formatFileSize(document.file_size) }}</span>
          </div>
          <div class="info-item">
            <span class="label">آپلودکننده</span>
            <span class="value">{{ document.uploaded_by || 'نامشخص' }}</span>
          </div>
          <div class="info-item">
            <span class="label">تاریخ آپلود</span>
            <span class="value">{{ formatDate(document.created_at) }}</span>
          </div>
          <div class="info-item" v-if="document.description">
            <span class="label">توضیحات</span>
            <span class="value">{{ document.description }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <Button
              v-if="canUpdatedocument"
              label="دانلود"
              icon="pi pi-download"
              class="w-full"
              @click="downloadDocument"
          />
          <Button
              v-if="canDeletedocument"
              label="حذف"
              icon="pi pi-trash"
              severity="danger"
              class="w-full"
              outlined
              @click="confirmDelete"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { documentService } from '@/services/documentService'
const BASE_URL = import.meta.env.URLBACK || 'https://apiomrani.gttmco.ir'
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  document: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'deleted'])

const can = (permission) => {
  return authStore.permissions?.includes(permission)
}
const canUpdatedocument = computed(() => can('document.update'))
const canDeletedocument = computed(() => can('document.delete'))


const confirm = useConfirm()
const toast = useToast()

// State
const imageError = ref(false)
const pdfError = ref(false)

const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// ✅ اصلاح: ساخت URL صحیح
const getFileUrl = computed(() => {
  if (!props.document?.file_path) return 'No Url File'

  // اگر URL کامل است
  if (props.document.file_path.startsWith('http')) {
    return props.document.file_path
  }

  // ساخت URL از storage
  return `${BASE_URL}/storage/${props.document.file_path}`
})

const isImage = computed(() => {
  return props.document?.mime_type?.includes('image')
})

const isPdf = computed(() => {
  return props.document?.mime_type === 'application/pdf'
})

// Methods
const handleImageError = () => {
  imageError.value = true
  console.error('❌ Image load error for:', getFileUrl.value)
}

const handlePdfError = () => {
  pdfError.value = true
  console.error('❌ PDF load error for:', getFileUrl.value)
}

const downloadDocument = () => {
  if (props.document) {
    documentService.download(props.document.id)
  }
}

const confirmDelete = () => {
  confirm.require({
    message: `آیا از حذف سند "${props.document?.title}" اطمینان دارید؟`,
    header: 'تأیید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await documentService.delete(props.document.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'سند با موفقیت حذف شد',
          life: 3000
        })
        localVisible.value = false
        emit('deleted')
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

// Reset errors when document changes
watch(() => props.document, () => {
  imageError.value = false
  pdfError.value = false
})

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
  return new Date(date).toLocaleDateString('fa-IR')
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
</script>


<style scoped>


.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #ef4444;
}

.error-message i {
  font-size: 3rem;
}

.error-message p {
  margin: 0;
  font-size: 1rem;
}

.mt-3 {
  margin-top: 1rem;
}


.document-preview :deep(.p-dialog-content) {
  padding: 0;
}

.preview-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0;
  min-height: 500px;
}

.preview-area {
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 0 12px 12px 0;
  min-height: 400px;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.pdf-preview {
  width: 100%;
  height: 500px;
}

.pdf-preview iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.file-info-preview {
  text-align: center;
}

.big-icon {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  margin: 0 auto 1.5rem;
}

.file-pdf { background: #fee2e2; color: #dc2626; }
.file-image { background: #dbeafe; color: #2563eb; }
.file-word { background: #dbeafe; color: #1d4ed8; }
.file-excel { background: #d1fae5; color: #059669; }
.file-zip { background: #fef3c7; color: #d97706; }
.file-default { background: #f3f4f6; color: #6b7280; }

.file-info-preview h3 {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.file-info-preview p {
  color: #6b7280;
  margin: 0.25rem 0;
}

/* Sidebar */
.preview-sidebar {
  padding: 2rem;
  background: white;
  border-radius: 12px 0 0 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.info-section h4 {
  font-size: 1rem;
  color: #1f2937;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
}

.info-item {
  margin-bottom: 0.75rem;
}

.info-item .label {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.2rem;
}

.info-item .value {
  font-size: 0.9rem;
  color: #1f2937;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
}

@media (max-width: 768px) {
  .preview-content {
    grid-template-columns: 1fr;
  }

  .preview-area {
    border-radius: 12px 12px 0 0;
    padding: 1rem;
    min-height: 250px;
  }

  .preview-sidebar {
    border-radius: 0 0 12px 12px;
    padding: 1.5rem;
  }

  .pdf-preview {
    height: 300px;
  }
}
</style>