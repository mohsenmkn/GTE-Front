<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">تمپلیت‌های سوالات عمومی</h1>
        <p class="text-sm text-gray-500 mt-1">
          مدیریت تمپلیت‌های سوالات مشترک برای خانواده‌های شغلی مختلف
        </p>
      </div>
      <div class="flex gap-2">
        <Button
            icon="pi pi-plus"
            label="تمپلیت جدید"
            @click="openCreateDialog"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Filters
    ═══════════════════════════════════════════ -->
    <Card class="mb-4">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">جستجو</label>
            <InputText
                v-model="filters.search"
                placeholder="عنوان تمپلیت..."
                class="w-full"
                @input="debounceSearch"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">خانواده شغلی</label>
            <Select
                v-model="filters.grade"
                :options="gradeOptions"
                placeholder="همه خانواده‌ها"
                showClear
                class="w-full"
                @change="loadTemplates"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
            <Select
                v-model="filters.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="همه وضعیت‌ها"
                showClear
                class="w-full"
                @change="loadTemplates"
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
         Templates Table
    ═══════════════════════════════════════════ -->
    <Card>
      <template #content>
        <DataTable
            :value="filteredTemplates"
            :loading="store.loading"
            stripedRows
            paginator
            :rows="15"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            class="p-datatable-sm"
            emptyMessage="تمپلیتی یافت نشد"
        >
          <Column header="ردیف" style="width: 60px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>

          <Column field="title" header="عنوان تمپلیت" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-book text-indigo-500"></i>
                <div>
                  <div class="font-medium">{{ data.title }}</div>
                  <div v-if="data.description" class="text-xs text-gray-500 mt-1">
                    {{ data.description }}
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="grade" header="خانواده شغلی" sortable>
            <template #body="{ data }">
              <Tag
                  :value="data.grade || '—'"
                  :severity="getGradeSeverity(data.grade)"
              />
            </template>
          </Column>

          <Column field="version" header="نسخه" style="width: 90px" sortable>
            <template #body="{ data }">
              <Tag :value="`v${data.version}`" severity="info" />
            </template>
          </Column>

          <Column header="سوالات" style="width: 100px">
            <template #body="{ data }">
              <Tag
                  :value="`${data.questions_count || 0} سوال`"
                  severity="secondary"
              />
            </template>
          </Column>

          <Column header="وضعیت" style="width: 140px">
            <template #body="{ data }">
              <div class="flex flex-col gap-1">
                <Tag
                    :value="getStatusText(data)"
                    :severity="getStatusSeverity(data)"
                />
                <span v-if="!data.is_active" class="text-xs text-red-500">
                  غیرفعال
                </span>
              </div>
            </template>
          </Column>

          <Column field="creator.name" header="ایجادکننده">
            <template #body="{ data }">
              {{ data.creator?.name || '—' }}
            </template>
          </Column>

          <Column header="عملیات" style="width: 240px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    text
                    tooltip="ویرایش"
                    @click="goToEditor(data)"
                />
                <Button
                    v-if="!data.approved_at && data.is_active"
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    text
                    tooltip="تایید تمپلیت"
                    @click="confirmApprove(data)"
                />
                <Button
                    v-if="data.approved_at && data.is_active"
                    icon="pi pi-plus-circle"
                    severity="warn"
                    size="small"
                    text
                    tooltip="ایجاد نسخه جدید"
                    @click="confirmNewVersion(data)"
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
        v-model:visible="showDialog"
        :header="editingTemplate ? 'ویرایش تمپلیت' : 'تمپلیت جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="form.title"
              class="w-full"
              placeholder="مثال: تمپلیت عمومی سرپرستان"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            خانواده شغلی <span class="text-red-500">*</span>
          </label>
          <Select
              v-model="form.grade"
              :options="gradeOptions"
              placeholder="انتخاب خانواده شغلی"
              class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            توضیحات
          </label>
          <Textarea
              v-model="form.description"
              class="w-full"
              rows="3"
              placeholder="توضیحات اختیاری درباره این تمپلیت..."
          />
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showDialog = false"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="store.loading"
            @click="saveTemplate"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/templateStore'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const store = useTemplateStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const filters = ref({
  search: '',
  grade: null,
  status: null,
})

const showDialog = ref(false)
const editingTemplate = ref(null)
const form = ref({
  title: '',
  grade: null,
  description: '',
})

// ═══════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════
const gradeOptions = [
  'مدیرعامل',
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

const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'در انتظار تایید', value: 'pending' },
]

// ═══════════════════════════════════════════════
// Computed
// ═══════════════════════════════════════════════
const filteredTemplates = computed(() => {
  let list = store.templates

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    )
  }

  if (filters.value.grade) {
    list = list.filter(t => t.grade === filters.value.grade)
  }

  if (filters.value.status) {
    const s = filters.value.status
    if (s === 'active') list = list.filter(t => t.is_active)
    else if (s === 'inactive') list = list.filter(t => !t.is_active)
    else if (s === 'approved') list = list.filter(t => t.approved_at)
    else if (s === 'pending') list = list.filter(t => !t.approved_at && t.is_active)
  }

  return list
})

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(() => {
  loadTemplates()
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadTemplates() {
  try {
    await store.fetchTemplates()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در دریافت تمپلیت‌ها',
      life: 3000,
    })
  }
}

const debounceSearch = debounce(() => {
  // جستجو از طریق computed انجام می‌شه
}, 300)

function resetFilters() {
  filters.value = { search: '', grade: null, status: null }
}

function getGradeSeverity(grade) {
  const map = {
    'مدیرعامل': 'danger',
    'معاون': 'danger',
    'مدیر': 'warning',
    'رئیس': 'info',
    'سرپرست/کارشناس ارشد': 'success',
    'کارشناس': 'primary',
    'کاردان/تکنسین/مسئول': 'secondary',
  }
  return map[grade] || null
}

function getStatusText(t) {
  if (!t.is_active) return 'غیرفعال'
  if (t.approved_at) return `تایید شده (v${t.version})`
  return 'در انتظار تایید'
}

function getStatusSeverity(t) {
  if (!t.is_active) return 'danger'
  if (t.approved_at) return 'success'
  return 'warn'
}

// ═══════════════════════════════════════════════
// Dialog: Create/Edit
// ═══════════════════════════════════════════════
function openCreateDialog() {
  editingTemplate.value = null
  form.value = {
    title: '',
    grade: null,
    description: '',
  }
  showDialog.value = true
}

async function saveTemplate() {
  if (!form.value.title || !form.value.grade) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان و خانواده شغلی الزامی است',
      life: 3000,
    })
    return
  }

  try {
    if (editingTemplate.value) {
      await store.updateTemplate(editingTemplate.value.id, form.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تمپلیت با موفقیت ویرایش شد',
        life: 3000,
      })
    } else {
      const created = await store.createTemplate(form.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تمپلیت با موفقیت ایجاد شد',
        life: 3000,
      })
      // رفتن به ویرایشگر برای افزودن سوالات
      router.push({
        name: 'assessment.template-editor',
        params: { id: created.id },
      })
      return
    }
    showDialog.value = false
    await loadTemplates()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره تمپلیت',
      life: 3000,
    })
  }
}

// ═══════════════════════════════════════════════
// Actions
// ═══════════════════════════════════════════════
function goToEditor(template) {
  router.push({
    name: 'assessment.template-editor',
    params: { id: template.id },
  })
}

function confirmApprove(template) {
  confirm.require({
    message: `آیا از تایید تمپلیت "${template.title}" اطمینان دارید؟ پس از تایید، قابل استفاده در شناسنامه‌ها خواهد بود.`,
    header: 'تایید تمپلیت',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تایید شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await store.approveTemplate(template.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تمپلیت با موفقیت تایید شد',
          life: 3000,
        })
        await loadTemplates()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در تایید تمپلیت',
          life: 3000,
        })
      }
    },
  })
}

function confirmNewVersion(template) {
  confirm.require({
    message: `با ایجاد نسخه جدید، نسخه فعلی (v${template.version}) غیرفعال می‌شود و تمام سوالات به نسخه جدید کپی خواهند شد. آیا ادامه می‌دهید؟`,
    header: 'ایجاد نسخه جدید',
    icon: 'pi pi-plus-circle',
    acceptLabel: 'بله، ایجاد شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-warn',
    accept: async () => {
      try {
        const newTemplate = await store.incrementVersion(template.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: `نسخه جدید v${newTemplate.version} ایجاد شد`,
          life: 3000,
        })
        await loadTemplates()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در ایجاد نسخه جدید',
          life: 3000,
        })
      }
    },
  })
}

function confirmDelete(template) {
  confirm.require({
    message: `آیا از حذف تمپلیت "${template.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.deleteTemplate(template.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تمپلیت حذف شد',
          life: 3000,
        })
        await loadTemplates()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در حذف تمپلیت',
          life: 3000,
        })
      }
    },
  })
}
</script>