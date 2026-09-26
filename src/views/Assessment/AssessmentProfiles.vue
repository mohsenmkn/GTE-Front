<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">شناسنامه شایستگی</h1>
        <p class="text-sm text-gray-500 mt-1">
          مدیریت شناسنامه‌های شایستگی و import از فایل اکسل
        </p>
      </div>
      <div class="flex gap-2">
        <Button
            icon="pi pi-file-excel"
            label="Import گروهی"
            severity="secondary"
            @click="showBulkImport = true"
        />
        <Button
            icon="pi pi-upload"
            label="Import تکی"
            severity="info"
            @click="showSingleImport = true"
        />
        <Button
            icon="pi pi-plus"
            label="شناسنامه جدید"
            @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Filters
    ══════════════════════════════════════════ -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              جستجو
            </label>
            <InputText
                v-model="filters.search"
                placeholder="عنوان، واحد یا رده..."
                class="w-full"
                @input="debounceSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              رده شغلی
            </label>
            <Select
                v-model="filters.grade"
                :options="gradeOptions"
                placeholder="همه رده‌ها"
                showClear
                class="w-full"
                @change="loadPosts"
            />
          </div>
          <div class="flex items-end">
            <Button
                icon="pi pi-refresh"
                label="بازنشانی"
                severity="secondary"
                outlined
                @click="resetFilters"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Posts Table
    ═══════════════════════════════════════════ -->
    <Card>
      <template #content>
        <DataTable
            :value="store.posts"
            :loading="store.loading"
            stripedRows
            paginator
            :rows="15"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            class="p-datatable-sm"
            emptyMessage="شناسنامه‌ای یافت نشد"
        >
          <Column header="ردیف" style="width: 60px">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>

          <Column field="title" header="عنوان" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-book text-blue-500"></i>
                <span class="font-medium">{{ data.title }}</span>
              </div>
            </template>
          </Column>

          <Column field="grade" header="رده شغلی" sortable>
            <template #body="{ data }">
              <Tag
                  :value="data.grade || '—'"
                  :severity="getGradeSeverity(data.grade)"
              />
            </template>
          </Column>

          <Column field="unit" header="واحد سازمانی" sortable>
            <template #body="{ data }">
              {{ data.unit || '—' }}
            </template>
          </Column>

          <Column field="domain" header="حوزه تخصصی">
            <template #body="{ data }">
              {{ data.domain || '—' }}
            </template>
          </Column>

          <Column header="آمار سوالات" style="width: 150px">
            <template #body="{ data }">
              <div class="flex gap-2 text-xs">
                <Tag
                    :value="`${data.total_questions || 0} کل`"
                    severity="info"
                />
                <Tag
                    v-if="data.risk_done > 0"
                    :value="`${data.risk_done} ریسک`"
                    severity="warning"
                />
              </div>
            </template>
          </Column>

          <Column field="is_active" header="وضعیت" sortable>
            <template #body="{ data }">
              <Tag
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
                  :severity="data.is_active ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column header="عملیات" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                    icon="pi pi-question"
                    severity="success"
                    size="small"
                    text
                    tooltip="سوالات"
                    @click="goToQuestions(data)"
                />
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    text
                    tooltip="ویرایش"
                    @click="openEditDialog(data)"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    text
                    tooltip="حذف"
                    @click="confirmDelete(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Create/Edit Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showPostDialog"
        :header="editingPost ? 'ویرایش شناسنامه' : 'شناسنامه جدید'"
        :style="{ width: '600px' }"
        modal
        :closable="true"
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="postForm.title"
              class="w-full"
              placeholder="مثال: رئیس - سرمایه انسانی"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              رده شغلی
            </label>
            <Select
                v-model="postForm.grade"
                :options="gradeOptions"
                placeholder="انتخاب رده"
                showClear
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              واحد سازمانی
            </label>
            <InputText
                v-model="postForm.unit"
                class="w-full"
                placeholder="مثال: فناوری اطلاعات"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            حوزه تخصصی
          </label>
          <InputText
              v-model="postForm.domain"
              class="w-full"
              placeholder="اختیاری"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              حداقل مدرک تحصیلی
            </label>
            <InputText
                v-model="postForm.min_education"
                class="w-full"
                placeholder="مثال: لیسانس"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              حداقل سابقه (سال)
            </label>
            <InputNumber
                v-model="postForm.min_experience_years"
                class="w-full"
                :min="0"
                :max="50"
                showButtons
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            توضیحات
          </label>
          <Textarea
              v-model="postForm.description"
              class="w-full"
              rows="3"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
              v-model="postForm.is_active"
              :binary="true"
              inputId="is_active"
          />
          <label for="is_active" class="text-sm text-gray-700">
            فعال
          </label>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showPostDialog = false"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="store.loading"
            @click="savePost"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Single Import Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showSingleImport"
        header="Import شناسنامه از اکسل"
        :style="{ width: '700px' }"
        modal
    >
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
          <i class="pi pi-info-circle ml-1"></i>
          نام فایل باید به فرمت <b>رده-واحد.xlsx</b> باشد.
          <br />
          مثال: <code>رئیس-سرمایه انسانی و پشتیبانی.xlsx</code>
        </div>

        <!-- انتخاب فایل -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
              type="file"
              ref="fileInput"
              accept=".xlsx,.xls"
              class="hidden"
              @change="onFileSelected"
          />
          <Button
              v-if="!selectedFile"
              label="انتخاب فایل"
              icon="pi pi-plus"
              severity="success"
              class="w-full"
              @click="$refs.fileInput.click()"
          />
          <div v-else class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <i class="pi pi-file-excel text-3xl text-green-600"></i>
              <div class="text-right">
                <div class="font-medium text-gray-800">{{ selectedFile.name }}</div>
                <div class="text-xs text-gray-500">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB
                </div>
              </div>
            </div>
            <Button
                icon="pi pi-times"
                severity="danger"
                text
                @click="clearSelectedFile"
            />
          </div>
        </div>

        <!-- دکمه‌های پیش‌نمایش و انصراف -->
        <div class="flex gap-2 justify-end">
          <Button
              label="انصراف"
              severity="secondary"
              outlined
              @click="closeSingleImport"
          />
          <Button
              v-if="selectedFile && !previewResult"
              label="پیش‌نمایش"
              icon="pi pi-eye"
              severity="info"
              :loading="previewLoading"
              @click="executePreview"
          />
          <Button
              v-if="previewResult"
              label="تایید و Import"
              icon="pi pi-check"
              severity="success"
              :loading="store.loading"
              @click="executeSingleImport"
          />
        </div>

        <!-- نمایش نتیجه پیش‌نمایش -->
        <div v-if="previewResult" class="border rounded-lg p-4 bg-gray-50">
          <h4 class="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <i class="pi pi-chart-bar text-blue-500"></i>
            پیش‌نمایش:
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-white p-3 rounded border">
              <div class="text-xs text-gray-600">تعداد شیت</div>
              <div class="text-xl font-bold text-blue-700">
                {{ previewResult.stats?.sheets || 0 }}
              </div>
            </div>
            <div class="bg-white p-3 rounded border">
              <div class="text-xs text-gray-600">تعداد سوال</div>
              <div class="text-xl font-bold text-green-700">
                {{ previewResult.stats?.questions || 0 }}
              </div>
            </div>
            <div class="bg-white p-3 rounded border">
              <div class="text-xs text-gray-600">شناسنامه‌های جدید</div>
              <div class="text-xl font-bold text-purple-700">
                {{ previewResult.stats?.posts || 0 }}
              </div>
            </div>
            <div class="bg-white p-3 rounded border">
              <div class="text-xs text-gray-600">موارد غیرعادی</div>
              <div class="text-xl font-bold" :class="previewResult.anomalies?.length ? 'text-orange-700' : 'text-gray-400'">
                {{ previewResult.anomalies?.length || 0 }}
              </div>
            </div>
          </div>

          <!-- نمایش anomalies -->
          <div v-if="previewResult.anomalies?.length" class="mt-4">
            <h5 class="text-sm font-bold text-orange-600 mb-2 flex items-center gap-1">
              <i class="pi pi-exclamation-triangle"></i>
              موارد غیرعادی:
            </h5>
            <ul class="text-xs text-orange-700 list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
              <li v-for="(a, i) in previewResult.anomalies" :key="i">
                {{ a }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Bulk Import Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showBulkImport"
        header="Import گروهی از پوشه"
        :style="{ width: '500px' }"
        modal
    >
      <div class="space-y-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
          <i class="pi pi-exclamation-triangle ml-1"></i>
          تمام فایل‌های اکسل موجود در پوشه مشخص‌شده import خواهند شد.
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            مسیر پوشه (نسبت به storage/app)
          </label>
          <InputText
              v-model="bulkDirectory"
              class="w-full"
              placeholder="مثال: excel-samples"
          />
          <small class="text-gray-500">
            مسیر کامل: <code>storage/app/{{ bulkDirectory }}</code>
          </small>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showBulkImport = false"
        />
        <Button
            label="شروع Import"
            icon="pi pi-upload"
            severity="success"
            :loading="store.loading"
            @click="executeBulkImport"
        />
      </template>
    </Dialog>

    <!-- Toast & Confirm -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessmentStore'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const store = useAssessmentStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const filters = ref({
  search: '',
  grade: null,
})

const showPostDialog = ref(false)
const showSingleImport = ref(false)
const showBulkImport = ref(false)

const editingPost = ref(null)
const postForm = ref({
  title: '',
  grade: null,
  unit: '',
  domain: '',
  min_education: '',
  min_experience_years: 0,
  description: '',
  is_active: true,
})

const selectedFile = ref(null)
const previewResult = ref(null)
const bulkDirectory = ref('excel-samples')

// ═══════════════════════════════════════════════
// Grade Options
// ═══════════════════════════════════════════════
const gradeOptions = [
  'معاون',
  'مدیر',
  'رئیس',
  'سرپرست/کارشناس ارشد',
  'کارشناس',
  'کاردان/تکنسین/مسئول',
  'متصدی',
  'راننده/اپراتور',
  'کارگر',
]

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(() => {
  loadPosts()
})

// ═══════════════════════════════════════════════
// Methods: Posts
// ═══════════════════════════════════════════════
async function loadPosts() {
  try {
    await store.fetchPosts({
      search: filters.value.search,
      grade: filters.value.grade,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در دریافت شناسنامه‌ها',
      life: 3000,
    })
  }
}

const debounceSearch = debounce(() => {
  loadPosts()
}, 300)

function resetFilters() {
  filters.value = { search: '', grade: null }
  loadPosts()
}

function getGradeSeverity(grade) {
  const map = {
    'معاون': 'danger',
    'مدیر': 'warning',
    'رئیس': 'info',
    'سرپرست/کارشناس ارشد': 'success',
    'کارشناس': 'primary',
    'کاردان/تکنسین/مسئول': 'secondary',
  }
  return map[grade] || null
}

// ═══════════════════════════════════════════════
// Create/Edit Dialog
// ═══════════════════════════════════════════════
function openCreateDialog() {
  editingPost.value = null
  postForm.value = {
    title: '',
    grade: null,
    unit: '',
    domain: '',
    min_education: '',
    min_experience_years: 0,
    description: '',
    is_active: true,
  }
  showPostDialog.value = true
}

function openEditDialog(post) {
  editingPost.value = post
  postForm.value = {
    title: post.title,
    grade: post.grade,
    unit: post.unit,
    domain: post.domain,
    min_education: post.min_education,
    min_experience_years: post.min_experience_years,
    description: post.description,
    is_active: post.is_active,
  }
  showPostDialog.value = true
}

async function savePost() {
  if (!postForm.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان شناسنامه الزامی است',
      life: 3000,
    })
    return
  }

  try {
    if (editingPost.value) {
      await store.updatePost(editingPost.value.id, postForm.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'شناسنامه با موفقیت ویرایش شد',
        life: 3000,
      })
    } else {
      await store.createPost(postForm.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'شناسنامه با موفقیت ایجاد شد',
        life: 3000,
      })
    }
    showPostDialog.value = false
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره شناسنامه',
      life: 3000,
    })
  }
}

function confirmDelete(post) {
  confirm.require({
    message: `آیا از حذف شناسنامه "${post.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await store.deletePost(post.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'شناسنامه حذف شد',
          life: 3000,
        })
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در حذف',
          life: 3000,
        })
      }
    },
  })
}

function goToQuestions(post) {
  router.push({
    name: 'assessment.profile-editor',
    params: { id: post.id },
  })
}

// ═══════════════════════════════════════════════
// Single Import
// ═══════════════════════════════════════════════
function onSingleFileSelect(event) {
  selectedFile.value = event.files[0]
  previewResult.value = null
}

async function executeSingleImport() {
  if (!selectedFile.value) return

  try {
    console.log('🔍 [DEBUG] شروع import فایل:', selectedFile.value.name)
    console.log('🔍 [DEBUG] حجم فایل:', selectedFile.value.size, 'bytes')

    const result = await store.importExcel(selectedFile.value)

    console.log('✅ [DEBUG] نتیجه import:', result)
    console.log('📊 [DEBUG] آمار:', result.stats)
    console.log('⚠️ [DEBUG] موارد غیرعادی:', result.anomalies)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `فایل import شد. ${result.stats?.posts || 0} شناسنامه، ${result.stats?.questions || 0} سوال`,
      life: 5000,
    })
    closeSingleImport()
    await loadPosts()
  } catch (e) {
    console.error('❌ [DEBUG] خطا در import:', e)
    console.error('❌ [DEBUG] پاسخ سرور:', e.response?.data)

    toast.add({
      severity: 'error',
      summary: 'خطا در import',
      detail: e.response?.data?.message || 'خطا',
      life: 5000,
    })
  }
}


// State جدید
const fileInput = ref(null)
const previewLoading = ref(false)

// انتخاب فایل
function onFileSelected(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewResult.value = null
  }
}

// پاک کردن فایل انتخابی
function clearSelectedFile() {
  selectedFile.value = null
  previewResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// اجرای پیش‌نمایش
async function executePreview() {
  if (!selectedFile.value) return

  try {
    console.log('🔍 [DEBUG] شروع پیش‌نمایش فایل:', selectedFile.value.name)

    previewResult.value = await store.importPreview(selectedFile.value)

    console.log('✅ [DEBUG] نتیجه پیش‌نمایش:', previewResult.value)
    console.log('📊 [DEBUG] آمار پیش‌نمایش:', previewResult.value.stats)
    console.log('⚠️ [DEBUG] anomalies:', previewResult.value.anomalies)

    toast.add({
      severity: 'success',
      summary: 'پیش‌نمایش آماده است',
      detail: 'برای تایید و import، دکمه سبز را بزنید',
      life: 3000,
    })
  } catch (e) {
    console.error('❌ [DEBUG] خطا در پیش‌نمایش:', e)
    console.error('❌ [DEBUG] پاسخ سرور:', e.response?.data)

    toast.add({
      severity: 'error',
      summary: 'خطا در پیش‌نمایش',
      detail: e.response?.data?.message || 'خطا',
      life: 5000,
    })
  }
}

// اصلاح closeSingleImport
function closeSingleImport() {
  showSingleImport.value = false
  clearSelectedFile()
}


// ═══════════════════════════════════════════════
// Bulk Import
// ═══════════════════════════════════════════════
async function executeBulkImport() {
  if (!bulkDirectory.value) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'مسیر پوشه را وارد کنید',
      life: 3000,
    })
    return
  }

  try {
    const result = await store.importBulk(bulkDirectory.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `Import گروهی انجام شد. ${result.stats?.posts || 0} شناسنامه`,
      life: 5000,
    })
    showBulkImport.value = false
    await loadPosts()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا',
      life: 3000,
    })
  }
}
</script>