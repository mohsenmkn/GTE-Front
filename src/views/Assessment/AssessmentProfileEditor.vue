<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header  & Stats
    ════════════════════════════════════════════ -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button
                icon="pi pi-arrow-right"
                severity="secondary"
                text
                @click="router.back()"
            />
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                {{ post?.title || 'بارگذاری...' }}
              </h2>
              <p class="text-sm text-gray-500 m-0 mt-1">
                <Tag :value="post?.grade" severity="info" class="ml-2" />
                <Tag :value="post?.unit" severity="secondary" />
              </p>
            </div>
          </div>
          <Button
              icon="pi pi-plus"
              label="سوال جدید"
              @click="openQuestionDialog()"
          />
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div class="text-blue-600 text-sm font-medium">تعداد کل سوالات</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">
              {{ stats?.total || 0 }}
            </div>
          </div>
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div class="text-orange-600 text-sm font-medium">تعیین سطح ریسک</div>
            <div class="text-2xl font-bold text-orange-800 mt-1">
              {{ stats?.risk_done || 0 }}
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <div class="text-green-600 text-sm font-medium">تعداد مناظر</div>
            <div class="text-2xl font-bold text-green-800 mt-1">
              {{ uniqueCategoriesCount || 0 }}
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div class="text-purple-600 text-sm font-medium">درصد تکمیل</div>
            <div class="text-2xl font-bold text-purple-800 mt-1">
              {{ stats?.completion || 0 }}٪
            </div>
            <ProgressBar
                :value="stats?.completion || 0"
                class="h-2 mt-2"
                :showValue="false"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Questions by Category (Accordion)
    ══════════════════════════════════════════ -->
    <div v-if="categories.length === 0" class="text-center p-10 text-gray-500">
      <i class="pi pi-inbox text-4xl mb-3"></i>
      <p>هنوز سوالی برای این شناسنامه ثبت نشده است.</p>
    </div>

    <Accordion v-else multiple class="w-full">
      <AccordionTab
          v-for="cat in categories"
          :key="cat.title"
      >
        <!-- ✅ Header سفارشی با نام منظر -->
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

        <!-- ✅ DataTable بدون header تکراری -->
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
              <div class="font-medium text-gray-800">
                {{ data.title }}
              </div>
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
                  :severity="getRiskSeverity(parseInt(data.risk_level, 10))"
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

          <Column header="عملیات" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                    icon="pi pi-pencil"
                    severity="info"
                    size="small"
                    text
                    @click="openQuestionDialog(data, cat.title)"
                />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    size="small"
                    text
                    @click="confirmDelete(data)"
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
              منظر شایستگی (دسته‌بندی)
            </label>
            <Select
                v-model="questionForm.category_id"
                :options="categories"
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
              سطح ریسک کاستی (۱ تا )
            </label>
            <!-- ✅ جدید (صحیح): -->
            <Select
                v-model="questionForm.risk_level"
                :options="riskOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب سطح ریسک"
                showClear
                class="w-full"
            >
              <template #option="slotProps">
                <div class="flex items-center gap-2">
                  <Tag :value="slotProps.option.value" :severity="getRiskSeverity(slotProps.option.value)" />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center gap-2">
                  <Tag :value="slotProps.value" :severity="getRiskSeverity(slotProps.value)" />
                  <span>{{ getRiskLabel(slotProps.value) }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
            </Select>
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
            :loading="loading"
            @click="saveQuestion"
        />
      </template>
    </Dialog>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssessmentStore } from '@/stores/assessmentStore'
import assessmentService from '@/services/assessmentService'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const store = useAssessmentStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const post = ref(null)
const stats = ref(null)
const categories = ref([])
const loading = ref(false)

const showQuestionDialog = ref(false)
const editingQuestion = ref(null)
const questionForm = ref({
  title: '',
  category_id: null,
  required_score: null,
  risk_level: null,
  fix_deadline: null,
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
// Computed
// ═══════════════════════════════════════════════

/** ✅ شمارش مناظر یکتا (حذف تکراری‌ها) */
const uniqueCategoriesCount = computed(() => {
  const uniqueTitles = new Set(categories.value.map(c => c.title))
  return uniqueTitles.size
})

// ═══════════════════════════════════════════════
// Lifecycle
// ══════════════════════════════════════════════
onMounted(async () => {
  const postId = route.params.id
  if (!postId) {
    router.push({ name: 'assessment.profiles' })
    return
  }
  await loadData(postId)
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadData(postId) {
  loading.value = true
  try {
    const data = await store.fetchPostQuestions(postId)
    post.value = data.post
    stats.value = data.stats
    // ✅ merge کردن دسته‌بندی‌های تکراری
    categories.value = mergeDuplicateCategories(data.categories || [])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت اطلاعات', life: 3000 })
  } finally {
    loading.value = false
  }
}

/** ✅ ادغام دسته‌بندی‌های تکراری بر اساس title */
function mergeDuplicateCategories(cats) {
  const map = new Map()
  for (const cat of cats) {
    const title = cat.title?.trim()
    if (!title) continue

    if (map.has(title)) {
      // ادغام سوالات
      const existing = map.get(title)
      existing.questions = [...(existing.questions || []), ...(cat.questions || [])]
      // استفاده از اولین category_id
      if (!existing.id && cat.id) existing.id = cat.id
    } else {
      map.set(title, { ...cat, title })
    }
  }
  return Array.from(map.values())
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
  // ✅ تبدیل به عدد صحیح
  const numLevel = parseInt(level, 10)
  const map = {
    5: 'danger',    // قرمز
    4: 'warning',   // نارنجی
    3: 'info',      // آبی
    2: 'primary',   // آبی تیره
    1: 'success'    // سبز
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

function openQuestionDialog(question = null, categoryName = null) {
  editingQuestion.value = question
  if (question) {
    questionForm.value = {
      title: question.title,
      category_id: question.category_id,
      required_score: question.required_score ? parseInt(question.required_score, 10) : null,
      risk_level: question.risk_level ? parseInt(question.risk_level, 10) : null,
      fix_deadline: question.fix_deadline || null,
    }
  } else {
    questionForm.value = {
      title: '',
      category_id: categories.value.find(c => c.title === categoryName)?.id || null,
      required_score: null,
      risk_level: null,
      fix_deadline: null,
    }
  }
  showQuestionDialog.value = true
}

async function saveQuestion() {
  if (!questionForm.value.title) {
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'عنوان سوال الزامی است', life: 3000 })
    return
  }

  // ✅ تبدیل risk_level به عدد صحیح (اگر object باشد)
  if (questionForm.value.risk_level && typeof questionForm.value.risk_level === 'object') {
    questionForm.value.risk_level = questionForm.value.risk_level.value
  }

  // ✅ تبدیل به عدد صحیح
  if (questionForm.value.risk_level !== null && questionForm.value.risk_level !== undefined) {
    questionForm.value.risk_level = parseInt(questionForm.value.risk_level, 10)
  } else {
    questionForm.value.risk_level = null
  }

  // ✅ تبدیل required_score به عدد صحیح
  if (questionForm.value.required_score !== null && questionForm.value.required_score !== undefined) {
    questionForm.value.required_score = parseInt(questionForm.value.required_score, 10)
  } else {
    questionForm.value.required_score = null
  }

  loading.value = true
  try {
    if (editingQuestion.value) {
      await assessmentService.updateQuestion(editingQuestion.value.id, questionForm.value)
      toast.add({ severity: 'success', summary: 'موفق', detail: 'سوال ویرایش شد', life: 3000 })
    } else {
      await assessmentService.createQuestion({
        ...questionForm.value,
        post_id: post.value.id,
      })
      toast.add({ severity: 'success', summary: 'موفق', detail: 'سوال اضافه شد', life: 3000 })
    }
    showQuestionDialog.value = false
    await loadData(post.value.id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در ذخیره', life: 3000 })
  } finally {
    loading.value = false
  }
}

function confirmDelete(question) {
  confirm.require({
    message: `آیا از حذف سوال "${question.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      try {
        await assessmentService.deleteQuestion(question.id)
        toast.add({ severity: 'success', summary: 'موفق', detail: 'سوال حذف شد', life: 3000 })
        await loadData(post.value.id)
      } catch (e) {
        toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در حذف', life: 3000 })
      }
    },
  })
}
</script>