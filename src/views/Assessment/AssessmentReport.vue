<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Loading State
    ═══════════════════════════════════════════ -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else-if="assessment">
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
                  @click="router.back()"
              />
              <div>
                <h2 class="text-xl font-bold text-gray-800 m-0">
                  کارنامه شایستگی
                </h2>
                <p class="text-sm text-gray-500 m-0 mt-1">
                  {{ assessment.employee?.name }} - {{ assessment.post?.title }}
                </p>
              </div>
            </div>
            <Tag
                :value="getStatusLabel(assessment.status)"
                :severity="getStatusSeverity(assessment.status)"
                style="font-size: 14px; padding: 6px 12px;"
            />
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div class="text-blue-600 text-xs font-medium">کارمند</div>
              <div class="text-base font-bold text-blue-800 mt-1">
                {{ assessment.employee?.name || '—' }}
              </div>
              <div class="text-xs text-blue-600 mt-1">
                {{ assessment.employee?.personnel_code || '' }}
              </div>
            </div>
            <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <div class="text-emerald-600 text-xs font-medium">ارزیاب</div>
              <div class="text-base font-bold text-emerald-800 mt-1">
                {{ assessment.evaluator?.name || '—' }}
              </div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div class="text-purple-600 text-xs font-medium">چرخه ارزیابی</div>
              <div class="text-base font-bold text-purple-800 mt-1">
                {{ assessment.cycle?.title || '—' }}
              </div>
            </div>
            <div class="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <div class="text-amber-600 text-xs font-medium">تاریخ ثبت</div>
              <div class="text-base font-bold text-amber-800 mt-1">
                {{ formatDate(assessment.submitted_at) }}
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- ═══════════════════════════════════════════
           Stats Cards
      ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-blue-100 text-sm font-medium">نمره میانگین</div>
              <div class="text-3xl font-bold mt-2">
                {{ summary.average_score?.toFixed(2) || '0.00' }}
              </div>
              <div class="text-blue-100 text-xs mt-1">از ۵</div>
            </div>
            <i class="pi pi-star-fill text-4xl text-blue-200"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-xl text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-emerald-100 text-sm font-medium">گپ وزن‌دار کل</div>
              <div class="text-3xl font-bold mt-2">
                {{ summary.total_weighted_gap || 0 }}
              </div>
              <div class="text-emerald-100 text-xs mt-1">امتیاز</div>
            </div>
            <i class="pi pi-chart-line text-4xl text-emerald-200"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-xl text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-amber-100 text-sm font-medium">تعداد گپ‌ها</div>
              <div class="text-3xl font-bold mt-2">
                {{ summary.gaps_count || 0 }}
              </div>
              <div class="text-amber-100 text-xs mt-1">
                {{ summary.critical_count || 0 }} بحرانی
              </div>
            </div>
            <i class="pi pi-exclamation-triangle text-4xl text-amber-200"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-purple-600 p-5 rounded-xl text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-purple-100 text-sm font-medium">وضعیت کلی</div>
              <div class="text-2xl font-bold mt-2">
                {{ getOverallStatus() }}
              </div>
              <div class="text-purple-100 text-xs mt-1">
                بر اساس ماتریس ریسک
              </div>
            </div>
            <i class="pi pi-shield text-4xl text-purple-200"></i>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Gaps by Category (Accordion)
      ═══════════════════════════════════════════ -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-indigo-500"></i>
            <span class="font-bold text-gray-800">تحلیل گپ‌های شایستگی</span>
          </div>
        </template>
        <template #content>
          <div v-if="gapsByCategory.length === 0" class="text-center p-10 text-gray-500">
            <i class="pi pi-check-circle text-5xl text-green-500 mb-3"></i>
            <p class="text-lg font-medium">تبریک! هیچ گپی شناسایی نشده است.</p>
            <p class="text-sm mt-1">کارمند به تمام شایستگی‌ها نمره مطلوب را کسب کرده است.</p>
          </div>

          <Accordion v-else multiple class="w-full">
            <AccordionTab
                v-for="cat in gapsByCategory"
                :key="cat.title"
                :header="cat.title"
            >
              <div class="space-y-3">
                <div
                    v-for="gap in cat.gaps"
                    :key="gap.id"
                    class="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <!-- Header Row -->
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <Tag
                            :value="gap.severity"
                            :severity="getSeveritySeverity(gap.severity)"
                            size="small"
                        />
                        <Tag
                            v-if="gap.requires_action"
                            value="نیاز به اقدام"
                            severity="danger"
                            size="small"
                        />
                        <Tag
                            v-if="gap.fix_deadline"
                            :value="getDeadlineLabel(gap.fix_deadline)"
                            severity="warning"
                            size="small"
                        />
                      </div>
                      <p class="text-gray-800 font-medium leading-relaxed">
                        {{ gap.question }}
                      </p>
                    </div>
                  </div>

                  <!-- Score Comparison -->
                  <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                      <div class="text-xs text-gray-600 mb-1">نمره مطلوب</div>
                      <div class="text-xl font-bold text-blue-700">
                        {{ gap.required_score }}
                      </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                      <div class="text-xs text-gray-600 mb-1">نمره واقعی</div>
                      <div
                          class="text-xl font-bold"
                          :class="getScoreColor(gap.actual_score, gap.required_score)"
                      >
                        {{ gap.actual_score }}
                      </div>
                    </div>
                    <div class="bg-red-50 p-3 rounded-lg text-center">
                      <div class="text-xs text-gray-600 mb-1">گپ</div>
                      <div class="text-xl font-bold text-red-700">
                        {{ gap.gap }}
                      </div>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-600 mb-1">
                      <span>پیشرفت</span>
                      <span>{{ getProgressPercent(gap) }}٪</span>
                    </div>
                    <ProgressBar
                        :value="getProgressPercent(gap)"
                        :showValue="false"
                        class="h-2"
                    />
                  </div>

                  <!-- Actions Section -->
                  <div v-if="gap.actions?.length > 0" class="border-t border-gray-200 pt-3">
                    <div class="text-sm font-bold text-gray-700 mb-2">
                      <i class="pi pi-list-check ml-1"></i>
                      اقدامات اصلاحی ({{ gap.actions.length }})
                    </div>
                    <div class="space-y-2">
                      <div
                          v-for="action in gap.actions"
                          :key="action.id"
                          class="bg-indigo-50 border border-indigo-100 rounded p-3"
                      >
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="font-medium text-gray-800 text-sm">
                              {{ action.title }}
                            </div>
                            <div v-if="action.method" class="text-xs text-gray-600 mt-1">
                              روش: {{ action.method }}
                            </div>
                            <div v-if="action.due_date" class="text-xs text-gray-500 mt-1">
                              مهلت: {{ formatDate(action.due_date) }}
                            </div>
                          </div>
                          <Tag
                              :value="getActionStatusLabel(action.status)"
                              :severity="getActionStatusSeverity(action.status)"
                              size="small"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Add Action Button (for managers) -->
                  <div v-if="canManage && gap.requires_action" class="border-t border-gray-200 pt-3 mt-3">
                    <Button
                        icon="pi pi-plus"
                        label="افزودن اقدام اصلاحی"
                        severity="info"
                        size="small"
                        outlined
                        @click="openActionDialog(gap)"
                    />
                  </div>
                </div>
              </div>
            </AccordionTab>
          </Accordion>
        </template>
      </Card>

      <!-- ═══════════════════════════════════════════
           Action Buttons
      ═══════════════════════════════════════════ -->
      <div v-if="canApprove" class="flex justify-end gap-3">
        <Button
            label="برگشت به ارزیاب"
            icon="pi pi-undo"
            severity="warn"
            outlined
            @click="showRejectDialog = true"
        />
        <Button
            label="تایید نهایی"
            icon="pi pi-check"
            severity="success"
            @click="confirmApprove"
        />
      </div>
    </template>

    <!-- ═══════════════════════════════════════════
         Add Action Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showActionDialog"
        header="افزودن اقدام اصلاحی"
        :style="{ width: '600px' }"
        modal
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان اقدام <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="actionForm.title"
              class="w-full"
              rows="3"
              placeholder="شرح اقدام اصلاحی..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              روش اجرا
            </label>
            <Select
                v-model="actionForm.method_id"
                :options="methods"
                optionLabel="title"
                optionValue="id"
                placeholder="انتخاب روش"
                showClear
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              مهلت اجرا
            </label>
            <InputText
                v-model="actionForm.due_date"
                type="date"
                class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            توضیحات
          </label>
          <Textarea
              v-model="actionForm.description"
              class="w-full"
              rows="2"
          />
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showActionDialog = false"
        />
        <Button
            label="ذخیره"
            icon="pi pi-check"
            :loading="saving"
            @click="saveAction"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Reject Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showRejectDialog"
        header="برگشت ارزیابی به ارزیاب"
        :style="{ width: '500px' }"
        modal
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          دلیل برگشت <span class="text-red-500">*</span>
        </label>
        <Textarea
            v-model="rejectNotes"
            class="w-full"
            rows="4"
            placeholder="دلیل برگشت ارزیابی را شرح دهید..."
        />
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showRejectDialog = false"
        />
        <Button
            label="برگشت"
            icon="pi pi-undo"
            severity="warn"
            :loading="saving"
            @click="executeReject"
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
const gaps = ref([])
const methods = ref([])
const loading = ref(false)
const saving = ref(false)

const showActionDialog = ref(false)
const showRejectDialog = ref(false)
const currentGap = ref(null)
const rejectNotes = ref('')

const actionForm = ref({
  title: '',
  method_id: null,
  due_date: '',
  description: '',
})

// ═══════════════════════════════════════════════
// Computed
// ═══════════════════════════════════════════════
const summary = computed(() => ({
  average_score: assessment.value?.average_score || 0,
  total_weighted_gap: assessment.value?.total_weighted_gap || 0,
  gaps_count: assessment.value?.gaps_count || gaps.value.length,
  critical_count: gaps.value.filter(g => g.severity === 'بحرانی').length,
}))

const gapsByCategory = computed(() => {
  const grouped = {}
  gaps.value.forEach(gap => {
    const catTitle = gap.category || 'سایر'
    if (!grouped[catTitle]) {
      grouped[catTitle] = { title: catTitle, gaps: [] }
    }
    grouped[catTitle].gaps.push(gap)
  })
  return Object.values(grouped)
})

const canManage = computed(() => {
  // بررسی ساده - در پروژه واقعی از auth store استفاده کنید
  return true
})

const canApprove = computed(() => {
  return assessment.value?.status === 'submitted' && canManage.value
})

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await loadData()
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadData() {
  loading.value = true
  try {
    const id = route.params.id
    const [assessmentData, gapsData, methodsData] = await Promise.all([
      assessmentService.getAssessment(id),
      assessmentService.getGaps(id),
      assessmentService.getMethods(true),
    ])

    assessment.value = assessmentData.assessment
    categories.value = assessmentData.categories || []
    gaps.value = gapsData.gaps || []
    methods.value = methodsData.methods || []
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: 'خطا در دریافت اطلاعات کارنامه',
      life: 5000,
    })
    router.push({ name: 'assessment.tasks' })
  } finally {
    loading.value = false
  }
}

function getProgressPercent(gap) {
  if (!gap.required_score) return 100
  return Math.round((gap.actual_score / gap.required_score) * 100)
}

function getScoreColor(actual, required) {
  if (actual >= required) return 'text-green-600'
  if (actual >= required - 1) return 'text-amber-600'
  return 'text-red-600'
}

function getSeveritySeverity(severity) {
  const map = {
    'بحرانی': 'danger',
    'عمده': 'warning',
    'جزئی': 'info',
    'بدون گپ': 'success',
  }
  return map[severity] || 'secondary'
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

function getActionStatusLabel(status) {
  const map = {
    planned: 'برنامه‌ریزی شده',
    in_progress: 'در حال اجرا',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  }
  return map[status] || status
}

function getActionStatusSeverity(status) {
  const map = {
    planned: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'secondary'
}

function getOverallStatus() {
  const critical = summary.value.critical_count
  const total = summary.value.gaps_count

  if (total === 0) return 'عالی'
  if (critical >= 3) return 'بحرانی'
  if (critical >= 1) return 'نیاز به توجه'
  return 'قابل قبول'
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

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fa-IR')
}

function openActionDialog(gap) {
  currentGap.value = gap
  actionForm.value = {
    title: '',
    method_id: null,
    due_date: '',
    description: '',
  }
  showActionDialog.value = true
}

async function saveAction() {
  if (!actionForm.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان اقدام الزامی است',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    await assessmentService.createAction(assessment.value.id, {
      gap_id: currentGap.value.id,
      ...actionForm.value,
    })
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'اقدام اصلاحی ثبت شد',
      life: 3000,
    })
    showActionDialog.value = false
    await loadData()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ثبت اقدام',
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}

function confirmApprove() {
  confirm.require({
    message: 'آیا از تایید نهایی این ارزیابی اطمینان دارید؟',
    header: 'تایید ارزیابی',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تایید شود',
    rejectLabel: 'انصراف',
    accept: async () => {
      saving.value = true
      try {
        await assessmentService.approve(assessment.value.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'ارزیابی تایید شد',
          life: 3000,
        })
        await loadData()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در تایید',
          life: 5000,
        })
      } finally {
        saving.value = false
      }
    },
  })
}

async function executeReject() {
  if (!rejectNotes.value) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'دلیل برگشت الزامی است',
      life: 3000,
    })
    return
  }

  saving.value = true
  try {
    await assessmentService.reject(assessment.value.id, rejectNotes.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'ارزیابی برگشت داده شد',
      life: 3000,
    })
    showRejectDialog.value = false
    await loadData()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در برگشت',
      life: 5000,
    })
  } finally {
    saving.value = false
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