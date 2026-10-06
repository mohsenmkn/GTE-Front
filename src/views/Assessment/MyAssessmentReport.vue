<template>
  <div class="p-6">
    <!-- ══════════════════════════════════════════
         Loading State
    ═══════════════════════════════════════════ -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- ═══════════════════════════════════════════
           Header
      ══════════════════════════════════════════ -->
      <Card class="mb-6">
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Avatar
                  :label="userInitials"
                  shape="circle"
                  size="large"
                  class="bg-indigo-500 text-white"
              />
              <div>
                <h2 class="text-xl font-bold text-gray-800 m-0">
                  کارنامه شایستگی من
                </h2>
                <p class="text-sm text-gray-500 m-0 mt-1">
                  {{ authStore.user?.name }} - کد پرسنلی: {{ authStore.user?.personnel_code }}
                </p>
              </div>
            </div>
            <Button
                icon="pi pi-refresh"
                label="بروزرسانی"
                severity="secondary"
                outlined
                :loading="loading"
                @click="loadReport"
            />
          </div>
        </template>
      </Card>

      <!-- ═══════════════════════════════════════════
           Empty State
      ═══════════════════════════════════════════ -->
      <div v-if="assessments.length === 0" class="text-center p-16 bg-white rounded-2xl border border-gray-200">
        <i class="pi pi-file text-6xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-bold text-gray-700 mb-2">
          هنوز ارزیابی ثبت‌شده‌ای ندارید
        </h3>
        <p class="text-sm text-gray-500">
          پس از انجام ارزیابی توسط ارزیاب و تایید آن، کارنامه شایستگی شما در اینجا نمایش داده می‌شود.
        </p>
      </div>

      <template v-else>
        <!-- ═══════════════════════════════════════════
             Summary Stats
        ═══════════════════════════════════════════ -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-blue-100 text-sm font-medium">تعداد ارزیابی‌ها</div>
                <div class="text-3xl font-bold mt-2">
                  {{ assessments.length }}
                </div>
              </div>
              <i class="pi pi-clipboard text-4xl text-blue-200"></i>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-xl text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-emerald-100 text-sm font-medium">میانگین نمره کل</div>
                <div class="text-3xl font-bold mt-2">
                  {{ overallAverage.toFixed(2) }}
                </div>
                <div class="text-emerald-100 text-xs mt-1">از ۵</div>
              </div>
              <i class="pi pi-star-fill text-4xl text-emerald-200"></i>
            </div>
          </div>

          <div class="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-xl text-white shadow-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-amber-100 text-sm font-medium">مجموع گپ‌های بحرانی</div>
                <div class="text-3xl font-bold mt-2">
                  {{ totalCriticalGaps }}
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
                  {{ overallStatus }}
                </div>
              </div>
              <i class="pi pi-shield text-4xl text-purple-200"></i>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════
             Assessments List
        ═══════════════════════════════════════════ -->
        <div class="space-y-4">
          <div
              v-for="assessment in assessments"
              :key="assessment.id"
              class="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <!-- Assessment Header -->
            <div
                class="p-5 cursor-pointer flex items-center justify-between"
                @click="toggleAssessment(assessment.id)"
            >
              <div class="flex items-center gap-4">
                <div
                    class="w-12 h-12 rounded-full flex items-center justify-center"
                    :class="getStatusBgColor(assessment.status)"
                >
                  <i
                      class="pi text-xl"
                      :class="getStatusIcon(assessment.status)"
                  ></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-800">
                      {{ assessment.post_title || 'شناسنامه نامشخص' }}
                    </h3>
                    <Tag
                        :value="assessment.status_label"
                        :severity="getStatusSeverity(assessment.status)"
                        size="small"
                    />
                  </div>
                  <div class="text-xs text-gray-500 flex items-center gap-3">
                    <span v-if="assessment.cycle_title">
                      <i class="pi pi-sync ml-1"></i>
                      {{ assessment.cycle_title }}
                    </span>
                    <span v-if="assessment.evaluator_name">
                      <i class="pi pi-user ml-1"></i>
                      ارزیاب: {{ assessment.evaluator_name }}
                    </span>
                    <span v-if="assessment.submitted_at">
                      <i class="pi pi-calendar ml-1"></i>
                      {{ formatDate(assessment.submitted_at) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <!-- Mini Stats -->
                <div class="flex gap-3 text-center">
                  <div class="bg-blue-50 px-3 py-2 rounded-lg">
                    <div class="text-xs text-blue-600">نمره</div>
                    <div class="font-bold text-blue-800">
                      {{ assessment.average_score?.toFixed(2) || '—' }}
                    </div>
                  </div>
                  <div class="bg-amber-50 px-3 py-2 rounded-lg">
                    <div class="text-xs text-amber-600">گپ</div>
                    <div class="font-bold text-amber-800">
                      {{ assessment.gaps_count || 0 }}
                    </div>
                  </div>
                  <div class="bg-red-50 px-3 py-2 rounded-lg">
                    <div class="text-xs text-red-600">بحرانی</div>
                    <div class="font-bold text-red-800">
                      {{ assessment.critical_count || 0 }}
                    </div>
                  </div>
                </div>

                <i
                    class="pi text-gray-400 transition-transform"
                    :class="expandedAssessments.has(assessment.id) ? 'pi-chevron-up' : 'pi-chevron-down'"
                ></i>
              </div>
            </div>

            <!-- Assessment Details (Expanded) -->
            <div
                v-show="expandedAssessments.has(assessment.id)"
                class="border-t border-gray-200 bg-gray-50 p-5"
            >
              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-600 mb-1">
                  <span>پیشرفت کلی</span>
                  <span>{{ getProgressPercent(assessment) }}٪</span>
                </div>
                <ProgressBar
                    :value="getProgressPercent(assessment)"
                    :showValue="false"
                    class="h-2"
                />
              </div>

              <!-- Categories Accordion -->
              <Accordion multiple class="w-full">
                <AccordionTab
                    v-for="category in assessment.categories"
                    :key="category.title"
                    :header="category.title"
                >
                  <div class="space-y-3">
                    <div
                        v-for="gap in category.gaps"
                        :key="gap.id"
                        class="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                    >
                      <!-- Question Header -->
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-2 flex-wrap">
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
                          <span>{{ getGapProgressPercent(gap) }}٪</span>
                        </div>
                        <ProgressBar
                            :value="getGapProgressPercent(gap)"
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
                    </div>
                  </div>
                </AccordionTab>
              </Accordion>
            </div>
          </div>
        </div>
      </template>
    </template>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import assessmentService from '@/services/assessmentService'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.js'

const toast = useToast()
const authStore = useAuthStore()

// ═══════════════════════════════════════════════
// State
// ══════════════════════════════════════════════
const assessments = ref([])
const loading = ref(false)
const expandedAssessments = ref(new Set())

// ═══════════════════════════════════════════════
// Computed
// ═══════════════════════════════════════════════
const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  const parts = name.split(' ')
  return (parts[0]?.charAt(0) || '') + (parts[1]?.charAt(0) || '')
})

const overallAverage = computed(() => {
  if (assessments.value.length === 0) return 0
  const sum = assessments.value.reduce((acc, a) => acc + (a.average_score || 0), 0)
  return sum / assessments.value.length
})

const totalCriticalGaps = computed(() => {
  return assessments.value.reduce((acc, a) => acc + (a.critical_count || 0), 0)
})

const overallStatus = computed(() => {
  if (assessments.value.length === 0) return '—'
  const critical = totalCriticalGaps.value
  if (critical >= 5) return 'نیاز به توجه فوری'
  if (critical >= 2) return 'نیاز به بهبود'
  if (critical === 0) return 'عالی'
  return 'قابل قبول'
})

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await loadReport()
})

// ═══════════════════════════════════════════════
// Methods
// ══════════════════════════════════════════════
async function loadReport() {
  loading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) {
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: 'کاربر شناسایی نشد',
        life: 3000,
      })
      return
    }

    const data = await assessmentService.getEmployeeReport(userId)
    assessments.value = data.assessments || []

    // باز کردن اولین ارزیابی به صورت پیش‌فرض
    if (assessments.value.length > 0) {
      expandedAssessments.value.add(assessments.value[0].id)
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در دریافت کارنامه',
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

function toggleAssessment(id) {
  if (expandedAssessments.value.has(id)) {
    expandedAssessments.value.delete(id)
  } else {
    expandedAssessments.value.add(id)
  }
}

function getProgressPercent(assessment) {
  if (!assessment.average_score) return 0
  return Math.round((assessment.average_score / 5) * 100)
}

function getGapProgressPercent(gap) {
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

function getStatusSeverity(status) {
  const map = {
    draft: 'secondary',
    submitted: 'info',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'secondary'
}

function getStatusBgColor(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

function getStatusIcon(status) {
  const map = {
    draft: 'pi-pencil',
    submitted: 'pi-clock',
    approved: 'pi-check',
    rejected: 'pi-times',
  }
  return map[status] || 'pi-file'
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fa-IR')
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
