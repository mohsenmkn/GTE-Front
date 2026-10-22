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
        :style="{ width: '700px' }"
        modal
        :closable="true"
    >
      <div class="grid grid-cols-1 gap-4">
        <!-- ✅ انتخاب سمت از لیست -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            سمت <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="postForm.post_title"
              :options="availablePositions"
              optionLabel="label"
              optionValue="value"
              placeholder="جستجو و انتخاب سمت..."
              filter
              showClear
              class="w-full"
              :filterPlaceholder="'جستجو در سمت‌ها...'"
              :loading="loadingPositions"
              @update:modelValue="onPositionChange"
          >
            <template #option="slotProps">
              <div class="flex flex-col">
                <span class="font-medium">{{ slotProps.option.label }}</span>
                <span class="text-xs text-gray-500">{{ slotProps.option.unit }}</span>
              </div>
            </template>
          </Select>
          <small v-if="postForm.post_title && !editingPost" class="text-gray-500 mt-1 block">
            سمت انتخابی: {{ postForm.post_title }}
          </small>
        </div>

        <!-- ✅ واحد سازمانی (خودکار و فقط خواندنی) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            واحد سازمانی
            <span v-if="postForm.unit" class="text-xs text-blue-600 mr-2">
          (خودکار از سمت انتخابی)
        </span>
          </label>
          <InputText
              v-model="postForm.unit"
              class="w-full"
              placeholder="ابتدا سمت را انتخاب کنید"
              readonly
              :class="{ 'bg-gray-100 cursor-not-allowed': postForm.unit }"
          />
          <small v-if="!postForm.unit" class="text-orange-600 mt-1 block">
            <i class="pi pi-info-circle ml-1"></i>
            لطفاً ابتدا سمت را انتخاب کنید
          </small>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            رده شغلی <span class="text-red-500">*</span>
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
import assessmentService from "@/services/assessmentService.js";

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


const selectedFile = ref(null)
const previewResult = ref(null)
const bulkDirectory = ref('excel-samples')
const postForm = ref({
  post_title: null,  // ✅ جدید: به جای title
  title: '',         // ✅ برای backward compatibility
  grade: null,
  unit: null,        // ✅ جدید: به جای string
  domain: '',
  min_education: '',
  min_experience_years: 0,
  description: '',
  is_active: true,
})
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
// State
// ═══════════════════════════════════════════════

// ✅ جدید: لیست سمت‌ها و واحدها
const availablePositions = ref([])
const availableUnits = ref([])
const loadingPositions = ref(false)
const loadingUnits = ref(false)


// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(() => {
  loadPosts()
})

// ═══════════════════════════════════════════════
// Methods: Load HR Data
// ═══════════════════════════════════════════════
async function loadPositions() {
  loadingPositions.value = true
  try {
    const data = await assessmentService.getJobPositions()
    availablePositions.value = (data.positions || []).map(p => ({
      label: p.post_title,
      value: p.post_title,
      unit: p.unit?.title || 'بدون واحد',
      unit_id: p.unit?.id || null,
    }))
  } catch (e) {
    console.error('خطا در دریافت سمت‌ها:', e)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت لیست سمت‌ها',
      life: 3000,
    })
  } finally {
    loadingPositions.value = false
  }
}

async function loadUnits() {
  loadingUnits.value = true
  try {
    const data = await assessmentService.getOrganizationalUnits()
    availableUnits.value = (data.units || []).map(u => ({
      label: u.title,
      value: u.title,
    }))
  } catch (e) {
    console.error('خطا در دریافت واحدها:', e)
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت لیست واحدها',
      life: 3000,
    })
  } finally {
    loadingUnits.value = false
  }
}

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
    post_title: null,
    title: '',
    grade: null,
    unit: '',  // ✅ خالی شروع می‌شه
    domain: '',
    min_education: '',
    min_experience_years: 0,
    description: '',
    is_active: true,
  }
  showPostDialog.value = true

  // بارگذاری سمت‌ها و واحدها
  loadPositions()
  loadUnits()
}

function openEditDialog(post) {
  editingPost.value = post
  postForm.value = {
    post_title: post.title,
    title: post.title,
    grade: post.grade,
    unit: post.unit,  // ✅ واحد از پست فعلی پر می‌شه
    domain: post.domain,
    min_education: post.min_education,
    min_experience_years: post.min_experience_years,
    description: post.description,
    is_active: post.is_active,
  }
  showPostDialog.value = true

  // بارگذاری سمت‌ها و واحدها
  loadPositions()
  loadUnits()
}

async function savePost() {
  if (!postForm.value.post_title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب سمت الزامی است',
      life: 3000,
    })
    return
  }

  if (!postForm.value.unit) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'واحد سازمانی به صورت خودکار از سمت انتخابی پر می‌شود',
      life: 3000,
    })
    return
  }

  if (!postForm.value.grade) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب رده شغلی الزامی است',
      life: 3000,
    })
    return
  }

  try {
    const payload = {
      title: postForm.value.post_title,
      grade: postForm.value.grade,
      unit: postForm.value.unit,
      domain: postForm.value.domain,
      min_education: postForm.value.min_education,
      min_experience_years: postForm.value.min_experience_years,
      description: postForm.value.description,
      is_active: postForm.value.is_active,
    }

    if (editingPost.value) {
      await store.updatePost(editingPost.value.id, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'شناسنامه با موفقیت ویرایش شد',
        life: 3000,
      })
    } else {
      await store.createPost(payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'شناسنامه با موفقیت ایجاد شد',
        life: 3000,
      })
    }
    showPostDialog.value = false
    await loadPosts()
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
    const result = await store.importExcel(selectedFile.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `فایل import شد. ${result.stats?.posts || 0} شناسنامه، ${result.stats?.questions || 0} سوال`,
      life: 5000,
    })
    closeSingleImport()
    await loadPosts()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا در import',
      detail: e.response?.data?.message || 'خطا',
      life: 5000,
    })
  }
}


function onFileSelected(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    previewResult.value = null
  }
}

function clearSelectedFile() {
  selectedFile.value = null
  previewResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function executePreview() {
  if (!selectedFile.value) return

  try {
    previewResult.value = await store.importPreview(selectedFile.value)
    toast.add({
      severity: 'success',
      summary: 'پیش‌نمایش آماده است',
      detail: 'برای تایید و import، دکمه سبز را بزنید',
      life: 3000,
    })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا در پیش‌نمایش',
      detail: e.response?.data?.message || 'خطا',
      life: 5000,
    })
  }
}

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




// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(() => {
  loadPosts()
})

// State جدید
const fileInput = ref(null)
const previewLoading = ref(false)




// ═══════════════════════════════════════════════
// Methods: Load HR Data
// ═══════════════════════════════════════════════

// ✅ متد جدید: هنگام تغییر سمت، واحد سازمانی را خودکار پر کن
function onPositionChange(selectedTitle) {
  if (!selectedTitle) {
    postForm.value.unit = ''
    return
  }

  // پیدا کردن واحد سازمانی از لیست سمت‌ها
  const selectedPosition = availablePositions.value.find(p => p.value === selectedTitle)
  if (selectedPosition) {
    postForm.value.unit = selectedPosition.unit || ''
  }
}


</script>