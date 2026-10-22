<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header & Stats
    ═══════════════════════════════════════════ -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button
                icon="pi pi-arrow-right"
                severity="secondary"
                text
                @click="router.push({ name: 'assessment.templates' })"
            />
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                {{ template?.title || 'بارگذاری...' }}
              </h2>
              <p class="text-sm text-gray-500 m-0 mt-1">
                <Tag :value="`v${template?.version}`" severity="info" class="ml-2" />
                <Tag :value="template?.grade" severity="secondary" class="ml-2" />
                <Tag
                    v-if="template?.approved_at"
                    value="تایید شده"
                    severity="success"
                />
                <Tag
                    v-else
                    value="در انتظار تایید"
                    severity="warn"
                />
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button
                v-if="!template?.approved_at && template?.is_active"
                icon="pi pi-check"
                label="تایید تمپلیت"
                severity="success"
                @click="confirmApprove"
            />
            <Button
                v-if="template?.approved_at && template?.is_active"
                icon="pi pi-plus-circle"
                label="نسخه جدید"
                severity="warn"
                @click="confirmNewVersion"
            />
            <Button
                icon="pi pi-plus"
                label="سوال جدید"
                @click="openQuestionDialog()"
            />
          </div>
        </div>
      </template>

      <template #content>
        <div v-if="template?.description" class="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-700">
          {{ template.description }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div class="text-blue-600 text-sm font-medium">تعداد کل سوالات</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">
              {{ stats?.total_questions || 0 }}
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <div class="text-green-600 text-sm font-medium">سوالات فعال</div>
            <div class="text-2xl font-bold text-green-800 mt-1">
              {{ stats?.active_questions || 0 }}
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div class="text-purple-600 text-sm font-medium">تعداد مناظر</div>
            <div class="text-2xl font-bold text-purple-800 mt-1">
              {{ stats?.categories_count || 0 }}
            </div>
          </div>
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div class="text-orange-600 text-sm font-medium">شناسنامه‌های استفاده‌کننده</div>
            <div class="text-2xl font-bold text-orange-800 mt-1">
              {{ stats?.posts_using || 0 }}
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Questions by Category (Accordion)
    ═══════════════════════════════════════════ -->
    <div v-if="categories.length === 0" class="text-center p-10 text-gray-500 bg-white rounded-lg border">
      <i class="pi pi-inbox text-4xl mb-3"></i>
      <p>هنوز سوالی برای این تمپلیت ثبت نشده است.</p>
      <Button
          icon="pi pi-plus"
          label="افزودن اولین سوال"
          class="mt-4"
          @click="openQuestionDialog()"
      />
    </div>

    <Accordion v-else multiple class="w-full">
      <AccordionTab
          v-for="cat in categories"
          :key="cat.id || cat.title"
      >
        <template #header>
          <div class="flex items-center justify-between w-full px-2">
            <div class="flex items-center gap-3">
              <i class="pi pi-folder text-indigo-500 text-lg"></i>
              <span class="font-bold text-gray-800 text-base">
                {{ cat.title }}
              </span>
              <Tag
                  :value="`${cat.questions?.length || 0} سوال`"
                  severity="info"
                  style="font-size: 11px"
              />
            </div>
          </div>
        </template>

        <DataTable
            :value="cat.questions || []"
            stripedRows
            size="small"
            emptyMessage="سوالی در این منظر وجود ندارد"
            :showHeaders="true"
        >
          <Column header="ردیف" style="width: 60px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>

          <Column field="title" header="عنوان شایستگی" sortable>
            <template #body="{ data }">
              <div class="font-medium text-gray-800">{{ data.title }}</div>
            </template>
          </Column>

          <Column field="required_score" header="نمره مطلوب" style="width: 120px">
            <template #body="{ data }">
              <Tag
                  :value="data.required_score || '—'"
                  :severity="data.required_score ? 'success' : 'secondary'"
              />
            </template>
          </Column>

          <Column field="risk_level" header="سطح ریسک" style="width: 120px">
            <template #body="{ data }">
              <Tag
                  v-if="data.risk_level"
                  :value="getRiskLabel(data.risk_level)"
                  :severity="getRiskSeverity(data.risk_level)"
              />
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>
          </Column>

          <Column field="fix_deadline" header="مهلت رفع" style="width: 140px">
            <template #body="{ data }">
              <Tag
                  v-if="data.fix_deadline"
                  :value="getDeadlineLabel(data.fix_deadline)"
                  severity="warning"
              />
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>
          </Column>

          <Column field="is_active" header="وضعیت" style="width: 100px">
            <template #body="{ data }">
              <Tag
                  :value="data.is_active ? 'فعال' : 'غیرفعال'"
                  :severity="data.is_active ? 'success' : 'danger'"
              />
            </template>
          </Column>

          <Column header="عملیات" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    text
                    @click="openQuestionDialog(data)"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    text
                    @click="confirmDeleteQuestion(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </AccordionTab>
    </Accordion>

    <!-- ═══════════════════════════════════════════
         Add/Edit Question Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showQuestionDialog"
        :header="editingQuestion ? 'ویرایش سوال' : 'سوال جدید'"
        :style="{ width: '600px' }"
        modal
    >
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان شایستگی <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="questionForm.title"
              class="w-full"
              rows="3"
              placeholder="توضیح دقیق شایستگی مورد نظر..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              منظر شایستگی <span class="text-red-500">*</span>
            </label>
            <Select
                v-model="questionForm.category_id"
                :options="allCategories"
                optionLabel="title"
                optionValue="id"
                placeholder="انتخاب منظر"
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              نمره مطلوب (۱ تا ۵)
            </label>
            <InputNumber
                v-model="questionForm.required_score"
                :min="1"
                :max="5"
                showButtons
                class="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              سطح ریسک (۱ تا ۵)
            </label>
            <Select
                v-model="questionForm.risk_level"
                :options="riskOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب سطح ریسک"
                showClear
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              مهلت رفع خلا
            </label>
            <Select
                v-model="questionForm.fix_deadline"
                :options="deadlineOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب مهلت"
                showClear
                class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showQuestionDialog = false"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="saving"
            @click="saveQuestion"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/templateStore'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const store = useTemplateStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const template = ref(null)
const stats = ref(null)
const categories = ref([])
const allCategories = ref([])
const saving = ref(false)

const showQuestionDialog = ref(false)
const editingQuestion = ref(null)
const questionForm = ref({
  title: '',
  category_id: null,
  required_score: 3,
  risk_level: 3,
  fix_deadline: 'mid_term',
})

// ═══════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════
const riskOptions = [
  { label: '۱ - قابل چشم‌پوشی', value: 1 },
  { label: '۲ - ضعیف', value: 2 },
  { label: '۳ - متوسط', value: 3 },
  { label: '۴ - بحرانی', value: 4 },
  { label: '۵ - فاجعه‌بار', value: 5 },
]

const deadlineOptions = [
  { label: 'فوری (تا ۶ ماه)', value: 'immediate' },
  { label: 'کوتاه‌مدت (۶ تا ۱۲ ماه)', value: 'short_term' },
  { label: 'میان‌مدت (۱ تا ۲ سال)', value: 'mid_term' },
  { label: 'بلندمدت (۲ تا ۳ سال)', value: 'long_term' },
]

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  const templateId = route.params.id
  if (!templateId) {
    router.push({ name: 'assessment.templates' })
    return
  }
  await Promise.all([
    loadTemplate(templateId),
    loadAllCategories(),
  ])
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadTemplate(id) {
  try {
    const data = await store.fetchTemplate(id)
    template.value = data.template
    stats.value = data.stats
    categories.value = data.categories || []
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت اطلاعات تمپلیت',
      life: 3000,
    })
  }
}

async function loadAllCategories() {
  try {
    await store.fetchCategories()
    allCategories.value = store.categories
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت دسته‌بندی‌ها',
      life: 3000,
    })
  }
}

function getRiskLabel(level) {
  const map = {
    1: 'قابل چشم‌پوشی',
    2: 'ضعیف',
    3: 'متوسط',
    4: 'بحرانی',
    5: 'فاجعه‌بار',
  }
  return map[level] || '—'
}

function getRiskSeverity(level) {
  const numLevel = parseInt(level, 10)
  const map = {
    5: 'danger',
    4: 'warning',
    3: 'info',
    2: 'primary',
    1: 'success',
  }
  return map[numLevel] || 'secondary'
}

function getDeadlineLabel(val) {
  const map = {
    immediate: 'فوری',
    short_term: 'کوتاه‌مدت',
    mid_term: 'میان‌مدت',
    long_term: 'بلندمدت',
  }
  return map[val] || val
}

// ═══════════════════════════════════════════════
// Question Dialog
// ═══════════════════════════════════════════════
function openQuestionDialog(question = null) {
  editingQuestion.value = question
  if (question) {
    questionForm.value = {
      title: question.title,
      category_id: question.category_id,
      required_score: question.required_score ? parseInt(question.required_score, 10) : 3,
      risk_level: question.risk_level ? parseInt(question.risk_level, 10) : 3,
      fix_deadline: question.fix_deadline || 'mid_term',
    }
  } else {
    questionForm.value = {
      title: '',
      category_id: allCategories.value[0]?.id || null,
      required_score: 3,
      risk_level: 3,
      fix_deadline: 'mid_term',
    }
  }
  showQuestionDialog.value = true
}

async function saveQuestion() {
  if (!questionForm.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان سوال الزامی است',
      life: 3000,
    })
    return
  }

  if (!questionForm.value.category_id) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب منظر الزامی است',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    if (editingQuestion.value) {
      await store.updateQuestion(editingQuestion.value.id, questionForm.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'سوال ویرایش شد',
        life: 3000,
      })
    } else {
      await store.addQuestion(template.value.id, questionForm.value)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'سوال اضافه شد',
        life: 3000,
      })
    }
    showQuestionDialog.value = false
    await loadTemplate(template.value.id)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

function confirmDeleteQuestion(question) {
  confirm.require({
    message: `آیا از حذف سوال "${question.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.deleteQuestion(question.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'سوال حذف شد',
          life: 3000,
        })
        await loadTemplate(template.value.id)
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

// ═══════════════════════════════════════════════
// Template Actions
// ═══════════════════════════════════════════════
function confirmApprove() {
  if (!stats.value?.active_questions || stats.value.active_questions === 0) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'تمپلیت باید حداقل یک سوال فعال داشته باشد',
      life: 3000,
    })
    return
  }

  confirm.require({
    message: `آیا از تایید تمپلیت "${template.value.title}" اطمینان دارید؟`,
    header: 'تایید تمپلیت',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تایید شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await store.approveTemplate(template.value.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'تمپلیت تایید شد',
          life: 3000,
        })
        await loadTemplate(template.value.id)
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در تایید',
          life: 3000,
        })
      }
    },
  })
}

function confirmNewVersion() {
  confirm.require({
    message: `با ایجاد نسخه جدید، نسخه فعلی غیرفعال می‌شود و تمام سوالات به نسخه جدید کپی خواهند شد. آیا ادامه می‌دهید؟`,
    header: 'ایجاد نسخه جدید',
    icon: 'pi pi-plus-circle',
    acceptLabel: 'بله، ایجاد شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-warn',
    accept: async () => {
      try {
        const newTemplate = await store.incrementVersion(template.value.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: `نسخه جدید v${newTemplate.version} ایجاد شد`,
          life: 3000,
        })
        router.push({
          name: 'assessment.template-editor',
          params: { id: newTemplate.id },
        })
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
</script>