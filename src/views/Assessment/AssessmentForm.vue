<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button
                icon="pi pi-arrow-right"
                severity="secondary"
                text
                @click="router.push({ name: 'assessment.tasks' })"
            />
            <div>
              <h2 class="text-xl font-bold text-gray-800 m-0">
                فرم ارزیابی شایستگی
              </h2>
              <p class="text-sm text-gray-500 m-0 mt-1">
                {{ assessment?.employee?.name }} - {{ assessment?.post?.title }}
              </p>
            </div>
          </div>
          <Tag
              :value="getStatusLabel(assessment?.status)"
              :severity="getStatusSeverity(assessment?.status)"
          />
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div class="text-blue-600 text-sm font-medium">چرخه ارزیابی</div>
            <div class="text-lg font-bold text-blue-800 mt-1">
              {{ assessment?.cycle?.title || '—' }}
            </div>
          </div>
          <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div class="text-emerald-600 text-sm font-medium">تعداد سوالات</div>
            <div class="text-lg font-bold text-emerald-800 mt-1">
              {{ totalQuestions }}
            </div>
          </div>
          <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <div class="text-amber-600 text-sm font-medium">سوالات پاسخ‌داده‌شده</div>
            <div class="text-lg font-bold text-amber-800 mt-1">
              {{ answeredQuestions }}
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div class="text-purple-600 text-sm font-medium">درصد تکمیل</div>
            <div class="text-lg font-bold text-purple-800 mt-1">
              {{ completionPercentage }}٪
            </div>
            <ProgressBar
                :value="completionPercentage"
                class="h-2 mt-2"
                :showValue="false"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Warning if not all answered
    ═══════════════════════════════════════════ -->
    <Message
        v-if="answeredQuestions < totalQuestions"
        severity="warn"
        :closable="false"
        class="mb-4"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle"></i>
        <span>
          شما به {{ totalQuestions - answeredQuestions }} سوال هنوز پاسخ نداده‌اید.
          لطفاً به تمام سوالات پاسخ دهید.
        </span>
      </div>
    </Message>

    <!-- ═══════════════════════════════════════════
         Questions by Category (Accordion)
    ═══════════════════════════════════════════ -->
    <div v-if="loading" class="flex justify-center p-10">
      <ProgressSpinner />
    </div>

    <Accordion v-else multiple class="w-full">
      <AccordionTab
          v-for="category in categories"
          :key="category.id"
          :header="category.title"
      >
        <div class="space-y-4">
          <div
              v-for="question in category.questions"
              :key="question.id"
              class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between gap-4 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-sm font-bold text-gray-700">
                    سوال {{ question.id }}
                  </span>
                  <Tag
                      v-if="question.risk_level"
                      :value="getRiskLabel(question.risk_level)"
                      :severity="getRiskSeverity(question.risk_level)"
                      size="small"
                  />
                  <Tag
                      v-if="question.required_score"
                      :value="`نمره مطلوب: ${question.required_score}`"
                      severity="info"
                      size="small"
                  />
                </div>
                <p class="text-gray-800 font-medium leading-relaxed">
                  {{ question.title }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <label class="text-sm font-medium text-gray-700">
                نمره شما:
              </label>
              <div class="flex gap-2">
                <Button
                    v-for="score in [1, 2, 3, 4, 5]"
                    :key="score"
                    :label="score.toString()"
                    :severity="getScoreSeverity(score, question.required_score)"
                    :outlined="scores[question.id] !== score"
                    size="small"
                    class="w-12"
                    @click="scores[question.id] = score"
                />
              </div>
              <span
                  v-if="scores[question.id]"
                  class="text-sm text-green-600 font-bold mr-2"
              >
                <i class="pi pi-check-circle"></i>
              </span>
            </div>

            <Textarea
                v-if="scores[question.id]"
                v-model="comments[question.id]"
                placeholder="توضیحات تکمیلی (اختیاری)"
                rows="2"
                class="w-full mt-3"
            />
          </div>
        </div>
      </AccordionTab>
    </Accordion>

    <!-- ═══════════════════════════════════════════
         Submit Button
    ══════════════════════════════════════════ -->
    <div class="mt-6 flex justify-end gap-3">
      <Button
          label="ذخیره موقت"
          severity="secondary"
          outlined
          :loading="submitting"
          @click="saveDraft"
      />
      <Button
          label="ثبت نهایی ارزیابی"
          icon="pi pi-check"
          severity="success"
          :disabled="answeredQuestions < totalQuestions"
          :loading="submitting"
          @click="submitAssessment"
      />
    </div>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import assessmentService from '@/services/assessmentService'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const assessment = ref(null)
const categories = ref([])
const scores = ref({})
const comments = ref({})
const loading = ref(false)
const submitting = ref(false)

// ═══════════════════════════════════════════════
// Computed
// ══════════════════════════════════════════════
const totalQuestions = computed(() => {
  return categories.value.reduce((sum, cat) => sum + cat.questions.length, 0)
})

const answeredQuestions = computed(() => {
  return Object.keys(scores.value).filter(key => scores.value[key] !== undefined).length
})

const completionPercentage = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round((answeredQuestions.value / totalQuestions.value) * 100)
})

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await loadAssessment()
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadAssessment() {
  loading.value = true
  try {
    const data = await assessmentService.getAssessment(route.params.id)
    assessment.value = data.assessment
    categories.value = data.categories || []

    // پر کردن نمرات موجود
    if (data.categories) {
      data.categories.forEach(cat => {
        cat.questions.forEach(q => {
          if (q.score !== null && q.score !== undefined) {
            scores.value[q.id] = q.score
          }
        })
      })
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت اطلاعات ارزیابی',
      life: 5000,
    })
    router.push({ name: 'assessment.tasks' })
  } finally {
    loading.value = false
  }
}

function getRiskLabel(level) {
  const map = {
    5: 'فاجعه‌بار',
    4: 'بحرانی',
    3: 'متوسط',
    2: 'ضعیف',
    1: 'قابل چشم‌پوشی',
  }
  return map[level] || level
}

function getRiskSeverity(level) {
  const map = { 5: 'danger', 4: 'warning', 3: 'info', 2: 'primary', 1: 'success' }
  return map[level] || 'secondary'
}

function getScoreSeverity(score, required) {
  if (score >= (required || 5)) return 'success'
  if (score >= 3) return 'warn'
  return 'danger'
}

function getStatusLabel(status) {
  const map = {
    draft: 'پیش‌نویس',
    submitted: 'تکمیل شده',
    approved: 'تایید شده',
    rejected: 'برگشت خورده',
  }
  return map[status] || status
}

function getStatusSeverity(status) {
  const map = {
    draft: 'secondary',
    submitted: 'info',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'secondary'
}

async function saveDraft() {
  if (answeredQuestions.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'حداقل به یک سوال پاسخ دهید',
      life: 3000,
    })
    return
  }

  submitting.value = true
  try {
    const payload = {}
    Object.keys(scores.value).forEach(qid => {
      if (scores.value[qid] !== undefined) {
        payload[qid] = scores.value[qid]
      }
    })

    await assessmentService.submitAnswers(route.params.id, payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'ارزیابی به صورت پیش‌نویس ذخیره شد',
      life: 3000,
    })

    await loadAssessment()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ذخیره ارزیابی',
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}

async function submitAssessment() {
  if (answeredQuestions.value < totalQuestions.value) {
    confirm.require({
      message: `شما به ${totalQuestions.value - answeredQuestions.value} سوال پاسخ نداده‌اید. آیا مطمئن هستید که می‌خواهید ثبت کنید؟`,
      header: 'تایید ثبت',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'بله، ثبت شود',
      rejectLabel: 'انصراف',
      accept: () => finalizeSubmit(),
    })
    return
  }

  finalizeSubmit()
}

async function finalizeSubmit() {
  submitting.value = true
  try {
    const payload = {}
    Object.keys(scores.value).forEach(qid => {
      if (scores.value[qid] !== undefined) {
        payload[qid] = scores.value[qid]
      }
    })

    await assessmentService.submitAnswers(route.params.id, payload)

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'ارزیابی با موفقیت ثبت و تکمیل شد',
      life: 5000,
    })

    router.push({ name: 'assessment.tasks' })
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ثبت ارزیابی',
      life: 5000,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:deep(.p-accordion .p-accordion-header) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
}

:deep(.p-accordion .p-accordion-header-active) {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #3b82f6;
}

:deep(.p-accordion .p-accordion-content) {
  background: #ffffff;
}
</style>