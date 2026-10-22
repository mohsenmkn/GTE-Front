<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">طراحی سوالات تخصصی</h1>
        <p class="text-sm text-gray-500 mt-1">
          انتخاب زیرمجموعه برای طراحی سوالات تخصصی ارزیابی شایستگی
        </p>
      </div>
      <Button
          icon="pi pi-refresh"
          label="بارگذاری مجدد"
          severity="secondary"
          outlined
          :loading="store.loading"
          @click="loadSubordinates"
      />
    </div>

    <!-- ═══════════════════════════════════════════
         Info Alert
    ═══════════════════════════════════════════ -->
    <div class="bg-blue-50 border-r-4 border-blue-400 p-4 rounded-lg mb-6">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-blue-500 text-xl mt-1"></i>
        <div class="text-sm text-blue-800">
          <p class="font-bold mb-1">راهنما:</p>
          <p>
            در این صفحه می‌توانید برای زیرمجموعه‌های مستقیم خود، سوالات تخصصی ارزیابی شایستگی طراحی کنید.
            پس از ثبت، پیشنهادات شما توسط مدیر HR بررسی و در صورت تایید، به سوالات شناسنامه اضافه می‌شود.
          </p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Empty State
    ═══════════════════════════════════════════ -->
    <div
        v-if="!store.loading && store.designableSubordinates.length === 0"
        class="text-center p-10 bg-white rounded-lg border"
    >
      <i class="pi pi-users text-5xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg mb-2">
        زیرمجموعه‌ای برای طراحی سوال یافت نشد
      </p>
      <p class="text-gray-400 text-sm">
        احتمالاً شما در حال حاضر زیرمجموعه‌ای ندارید یا ساختار سازمانی تعریف نشده است.
      </p>
    </div>

    <!-- ═══════════════════════════════════════════
         Subordinates Grid
    ═══════════════════════════════════════════ -->
    <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <Card
          v-for="sub in store.designableSubordinates"
          :key="sub.post_title"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="selectSubordinate(sub)"
      >
        <template #content>
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <i class="pi pi-user text-indigo-600 text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-gray-800 text-base m-0">
                  {{ sub.post_title }}
                </h3>
                <p class="text-xs text-gray-500 m-0 mt-1">
                  {{ sub.unit || 'بدون واحد' }}
                </p>
              </div>
            </div>
            <Tag
                v-if="sub.has_post"
                icon="pi pi-check-circle"
                value="شناسنامه دارد"
                severity="success"
                style="font-size: 11px"
            />
            <Tag
                v-else
                icon="pi pi-plus-circle"
                value="نیاز به ایجاد"
                severity="warn"
                style="font-size: 11px"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-gray-50 p-2 rounded text-center">
              <div class="text-xs text-gray-500">خانواده شغلی</div>
              <div class="font-medium text-gray-800 text-sm mt-1">
                {{ sub.family || '—' }}
              </div>
            </div>
            <div class="bg-gray-50 p-2 rounded text-center">
              <div class="text-xs text-gray-500">تعداد کارکنان</div>
              <div class="font-medium text-gray-800 text-sm mt-1">
                {{ sub.employee_count }} نفر
              </div>
            </div>
          </div>

          <Button
              :label="sub.has_post ? 'ثبت سوال تخصصی' : 'ایجاد شناسنامه و ثبت سوال'"
              icon="pi pi-plus"
              class="w-full"
              size="small"
              @click.stop="selectSubordinate(sub)"
          />
        </template>
      </Card>
    </div>

    <!-- ═══════════════════════════════════════════
         Dialog: Create Post (if not exists)
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showCreatePostDialog"
        header="ایجاد شناسنامه شایستگی"
        :style="{ width: '600px' }"
        modal
    >
      <div class="bg-amber-50 border-r-4 border-amber-400 p-3 rounded mb-4 text-sm text-amber-800">
        <i class="pi pi-info-circle ml-2"></i>
        برای سمت <b>{{ selectedSubordinate?.post_title }}</b> هنوز شناسنامه‌ای تعریف نشده است.
        ابتدا باید شناسنامه را ایجاد کنید، سپس می‌توانید سوالات تخصصی را ثبت کنید.
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان شناسنامه <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="postForm.title"
              class="w-full"
              :placeholder="selectedSubordinate?.post_title"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              خانواده شغلی
            </label>
            <InputText
                v-model="postForm.grade"
                class="w-full"
                :placeholder="selectedSubordinate?.family"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              واحد سازمانی
            </label>
            <InputText
                v-model="postForm.unit"
                class="w-full"
                :placeholder="selectedSubordinate?.unit"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            تمپلیت سوالات عمومی
          </label>
          <div v-if="latestTemplate" class="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-green-800">
                  {{ latestTemplate.title }}
                </div>
                <div class="text-xs text-green-600 mt-1">
                  نسخه {{ latestTemplate.version }} - {{ latestTemplate.questions_count || 0 }} سوال عمومی
                </div>
              </div>
              <Checkbox
                  v-model="postForm.import_template"
                  :binary="true"
                  inputId="importTemplate"
              />
            </div>
          </div>
          <div v-else class="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-600">
            <i class="pi pi-info-circle ml-2"></i>
            تمپلیت تایید شده‌ای برای خانواده شغلی "{{ selectedSubordinate?.family }}" یافت نشد.
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showCreatePostDialog = false"
        />
        <Button
            label="ایجاد شناسنامه"
            icon="pi pi-check"
            :loading="creatingPost"
            @click="createPostAndContinue"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Dialog: Create Proposal
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showProposalDialog"
        header="ثبت سوال تخصصی"
        :style="{ width: '650px' }"
        modal
    >
      <div class="bg-indigo-50 border-r-4 border-indigo-400 p-3 rounded mb-4 text-sm text-indigo-800">
        <i class="pi pi-info-circle ml-2"></i>
        سوال تخصصی برای سمت <b>{{ selectedSubordinate?.post_title }}</b> ثبت می‌شود.
        پس از ثبت، مدیر HR آن را بررسی خواهد کرد.
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان شایستگی تخصصی <span class="text-red-500">*</span>
          </label>
          <Textarea
              v-model="proposalForm.title"
              class="w-full"
              rows="3"
              placeholder="مثال: تسلط بر معماری میکروسرویس برای پروژه‌های بزرگ..."
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              منظر شایستگی <span class="text-red-500">*</span>
            </label>
            <Select
                v-model="proposalForm.category_id"
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
                v-model="proposalForm.required_score"
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
                v-model="proposalForm.risk_level"
                :options="riskOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب سطح ریسک"
                class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              مهلت رفع خلا
            </label>
            <Select
                v-model="proposalForm.fix_deadline"
                :options="deadlineOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="انتخاب مهلت"
                class="w-full"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showProposalDialog = false"
        />
        <Button
            label="ثبت پیشنهاد"
            icon="pi pi-check"
            :loading="savingProposal"
            @click="saveProposal"
        />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProposalStore } from '@/stores/proposalStore'
import { useTemplateStore } from '@/stores/templateStore'
import assessmentService from '@/services/assessmentService'
import { useToast } from 'primevue/usetoast'

const store = useProposalStore()
const templateStore = useTemplateStore()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const selectedSubordinate = ref(null)
const latestTemplate = ref(null)
const allCategories = ref([])

const showCreatePostDialog = ref(false)
const showProposalDialog = ref(false)
const creatingPost = ref(false)
const savingProposal = ref(false)

const postForm = ref({
  title: '',
  grade: '',
  unit: '',
  import_template: false,
})

const proposalForm = ref({
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
  await Promise.all([
    loadSubordinates(),
    loadCategories(),
  ])
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadSubordinates() {
  try {
    await store.fetchDesignableSubordinates()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در دریافت زیرمجموعه‌ها',
      life: 3000,
    })
  }
}

async function loadCategories() {
  try {
    await templateStore.fetchCategories()
    allCategories.value = templateStore.categories
  } catch (e) {
    console.error('خطا در دریافت دسته‌بندی‌ها', e)
  }
}

async function selectSubordinate(sub) {
  selectedSubordinate.value = sub

  if (sub.has_post) {
    // شناسنامه موجود است → مستقیم dialog سوال
    openProposalDialog()
  } else {
    // شناسنامه موجود نیست → dialog ایجاد شناسنامه
    postForm.value = {
      title: sub.post_title,
      grade: sub.family || '',
      unit: sub.unit || '',
      import_template: false,
    }

    // دریافت آخرین تمپلیت تایید شده برای این خانواده شغلی
    if (sub.family) {
      try {
        const data = await templateStore.fetchLatestApproved(sub.family)
        latestTemplate.value = data
        if (data) {
          postForm.value.import_template = true
        }
      } catch (e) {
        latestTemplate.value = null
      }
    } else {
      latestTemplate.value = null
    }

    showCreatePostDialog.value = true
  }
}

async function createPostAndContinue() {
  if (!postForm.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان شناسنامه الزامی است',
      life: 3000,
    })
    return
  }

  creatingPost.value = true
  try {
    const payload = {
      title: postForm.value.title,
      grade: postForm.value.grade,
      unit: postForm.value.unit,
    }

    if (postForm.value.import_template && latestTemplate.value) {
      payload.template_id = latestTemplate.value.id
      payload.import_template = true
    }

    const data = await assessmentService.createPost(payload)
    const postId = data.post.id

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'شناسنامه با موفقیت ایجاد شد',
      life: 3000,
    })

    // به‌روزرسانی subordinate
    selectedSubordinate.value = {
      ...selectedSubordinate.value,
      has_post: true,
      existing_post_id: postId,
    }

    showCreatePostDialog.value = false
    openProposalDialog()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ایجاد شناسنامه',
      life: 3000,
    })
  } finally {
    creatingPost.value = false
  }
}

function openProposalDialog() {
  proposalForm.value = {
    title: '',
    category_id: allCategories.value[0]?.id || null,
    required_score: 3,
    risk_level: 3,
    fix_deadline: 'mid_term',
  }
  showProposalDialog.value = true
}

async function saveProposal() {
  if (!proposalForm.value.title) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'عنوان سوال الزامی است',
      life: 3000,
    })
    return
  }

  if (!proposalForm.value.category_id) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'انتخاب منظر الزامی است',
      life: 3000,
    })
    return
  }

  savingProposal.value = true
  try {
    await store.createProposal({
      target_post_id: selectedSubordinate.value.existing_post_id,
      ...proposalForm.value,
    })

    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'پیشنهاد سوال با موفقیت ثبت شد و در انتظار بررسی مدیر HR است',
      life: 4000,
    })

    showProposalDialog.value = false
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در ثبت پیشنهاد',
      life: 3000,
    })
  } finally {
    savingProposal.value = false
  }
}
</script>