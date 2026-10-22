<template>
  <div class="p-6">
    <!-- ═══════════════════════════════════════════
         Header
    ═══════════════════════════════════════════ -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">پیشنهادات سوالات تخصصی</h1>
        <p class="text-sm text-gray-500 mt-1">
          مدیریت پیشنهادات سوالات تخصصی ارزیابی شایستگی
        </p>
      </div>
      <div class="flex gap-2">
        <Button
            v-if="canCreate"
            icon="pi pi-plus"
            label="ثبت سوال تخصصی"
            @click="router.push({ name: 'assessment.proposals.designable' })"
        />
        <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="loadProposals"
        />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════
         Stats (فقط برای HR Admin)
    ═══════════════════════════════════════════ -->
    <div v-if="canReview && store.stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-yellow-600 text-sm font-medium">در انتظار بررسی</div>
            <div class="text-2xl font-bold text-yellow-800 mt-1">
              {{ store.stats.pending }}
            </div>
          </div>
          <i class="pi pi-clock text-3xl text-yellow-400"></i>
        </div>
      </div>
      <div class="bg-green-50 p-4 rounded-lg border border-green-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-green-600 text-sm font-medium">تایید شده</div>
            <div class="text-2xl font-bold text-green-800 mt-1">
              {{ store.stats.approved }}
            </div>
          </div>
          <i class="pi pi-check-circle text-3xl text-green-400"></i>
        </div>
      </div>
      <div class="bg-red-50 p-4 rounded-lg border border-red-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-red-600 text-sm font-medium">رد شده</div>
            <div class="text-2xl font-bold text-red-800 mt-1">
              {{ store.stats.rejected }}
            </div>
          </div>
          <i class="pi pi-times-circle text-3xl text-red-400"></i>
        </div>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-blue-600 text-sm font-medium">کل پیشنهادات</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">
              {{ store.stats.total }}
            </div>
          </div>
          <i class="pi pi-inbox text-3xl text-blue-400"></i>
        </div>
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
                placeholder="عنوان سوال..."
                class="w-full"
                @input="debounceSearch"
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
                @change="applyFilters"
            />
          </div>
          <div v-if="canReview">
            <label class="block text-sm font-medium text-gray-700 mb-1">پیشنهاد دهنده</label>
            <InputText
                v-model="filters.proposer"
                placeholder="نام پیشنهاد دهنده..."
                class="w-full"
                @input="debounceSearch"
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
         Bulk Actions (فقط HR Admin)
    ═══════════════════════════════════════════ -->
    <Card v-if="canReview && selectedProposals.length > 0" class="mb-4">
      <template #content>
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            <i class="pi pi-check-square ml-2"></i>
            <b>{{ selectedProposals.length }}</b> مورد انتخاب شده
          </div>
          <div class="flex gap-2">
            <Button
                icon="pi pi-check"
                label="تایید گروهی"
                severity="success"
                size="small"
                @click="confirmBulkApprove"
            />
            <Button
                icon="pi pi-times"
                label="رد گروهی"
                severity="danger"
                size="small"
                @click="openBulkRejectDialog"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Proposals Table
    ═══════════════════════════════════════════ -->
    <Card>
      <template #content>
        <DataTable
            v-model:selection="selectedProposals"
            :value="filteredProposals"
            :loading="store.loading"
            stripedRows
            paginator
            :rows="15"
            :rowsPerPageOptions="[10, 15, 25, 50]"
            class="p-datatable-sm"
            emptyMessage="پیشنهادی یافت نشد"
        >
          <Column v-if="canReview" selectionMode="multiple" style="width: 40px"></Column>

          <Column header="ردیف" style="width: 60px">
            <template #body="{ index }">{{ index + 1 }}</template>
          </Column>

          <Column field="title" header="عنوان شایستگی پیشنهادی" sortable>
            <template #body="{ data }">
              <div class="font-medium text-gray-800">{{ data.title }}</div>
              <div class="text-xs text-gray-500 mt-1">
                <i class="pi pi-folder ml-1"></i>
                {{ data.category?.title || '—' }}
              </div>
            </template>
          </Column>

          <Column field="target_post.title" header="شناسنامه هدف" sortable>
            <template #body="{ data }">
              <div class="text-sm">
                <div class="font-medium">{{ data.target_post?.title || '—' }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ data.target_post?.grade || '' }}
                </div>
              </div>
            </template>
          </Column>

          <Column field="proposer.name" header="پیشنهاد دهنده">
            <template #body="{ data }">
              {{ data.proposer?.name || '—' }}
            </template>
          </Column>

          <Column field="required_score" header="نمره مطلوب" style="width: 110px">
            <template #body="{ data }">
              <Tag :value="data.required_score || '—'" severity="success" />
            </template>
          </Column>

          <Column field="risk_level" header="ریسک" style="width: 110px">
            <template #body="{ data }">
              <Tag
                  v-if="data.risk_level"
                  :value="getRiskLabel(data.risk_level)"
                  :severity="getRiskSeverity(data.risk_level)"
              />
              <span v-else class="text-gray-400 text-xs">—</span>
            </template>
          </Column>

          <Column field="status" header="وضعیت" style="width: 140px" sortable>
            <template #body="{ data }">
              <Tag
                  :value="getStatusText(data.status)"
                  :severity="getStatusSeverity(data.status)"
              />
            </template>
          </Column>

          <Column header="تاریخ ثبت" style="width: 120px">
            <template #body="{ data }">
              <div class="text-xs text-gray-600">
                {{ formatDate(data.created_at) }}
              </div>
            </template>
          </Column>

          <Column header="عملیات" style="width: 200px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <template v-if="data.status === 'pending'">
                  <Button
                      v-if="canReview"
                      icon="pi pi-check"
                      severity="success"
                      size="small"
                      text
                      tooltip="تایید"
                      @click="confirmApprove(data)"
                  />
                  <Button
                      v-if="canReview"
                      icon="pi pi-times"
                      severity="danger"
                      size="small"
                      text
                      tooltip="رد"
                      @click="openRejectDialog(data)"
                  />
                  <Button
                      v-if="isOwner(data) || canManage"
                      icon="pi pi-trash"
                      severity="secondary"
                      size="small"
                      text
                      tooltip="حذف"
                      @click="confirmDelete(data)"
                  />
                </template>
                <template v-else>
                  <span class="text-xs text-gray-500">
                    بررسی شده
                    <span v-if="data.reviewer"> توسط {{ data.reviewer?.name }}</span>
                  </span>
                </template>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- ═══════════════════════════════════════════
         Reject Dialog (تکی)
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showRejectDialog"
        header="رد پیشنهاد"
        :style="{ width: '500px' }"
        modal
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">
          در حال رد پیشنهاد: <b>{{ rejectingProposal?.title }}</b>
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          دلیل رد <span class="text-red-500">*</span>
        </label>
        <Textarea
            v-model="rejectReason"
            class="w-full"
            rows="4"
            placeholder="لطفاً دلیل رد این پیشنهاد را توضیح دهید..."
        />
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showRejectDialog = false"
        />
        <Button
            label="رد پیشنهاد"
            icon="pi pi-times"
            severity="danger"
            :loading="rejecting"
            @click="submitReject"
        />
      </template>
    </Dialog>

    <!-- ═══════════════════════════════════════════
         Bulk Reject Dialog
    ═══════════════════════════════════════════ -->
    <Dialog
        v-model:visible="showBulkRejectDialog"
        header="رد گروهی پیشنهادات"
        :style="{ width: '500px' }"
        modal
    >
      <div class="bg-amber-50 border-r-4 border-amber-400 p-3 rounded mb-4 text-sm text-amber-800">
        <i class="pi pi-exclamation-triangle ml-2"></i>
        {{ selectedProposals.length }} پیشنهاد به صورت گروهی رد خواهند شد.
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          دلیل رد <span class="text-red-500">*</span>
        </label>
        <Textarea
            v-model="bulkRejectReason"
            class="w-full"
            rows="4"
            placeholder="دلیل رد گروهی..."
        />
      </div>
      <template #footer>
        <Button
            label="انصراف"
            severity="secondary"
            @click="showBulkRejectDialog = false"
        />
        <Button
            label="رد گروهی"
            icon="pi pi-times"
            severity="danger"
            :loading="bulkRejecting"
            @click="submitBulkReject"
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
import { useProposalStore } from '@/stores/proposalStore'
import { useAuthStore } from '@/stores/authold.js'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { debounce } from '@/utils/debounce'

const router = useRouter()
const store = useProposalStore()
const authStore = useAuthStore()
const confirm = useConfirm()
const toast = useToast()

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const filters = ref({
  search: '',
  status: null,
  proposer: '',
})

const selectedProposals = ref([])
const showRejectDialog = ref(false)
const showBulkRejectDialog = ref(false)
const rejectingProposal = ref(null)
const rejectReason = ref('')
const bulkRejectReason = ref('')
const rejecting = ref(false)
const bulkRejecting = ref(false)

// ═══════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════
const statusOptions = [
  { label: 'در انتظار بررسی', value: 'pending' },
  { label: 'تایید شده', value: 'approved' },
  { label: 'رد شده', value: 'rejected' },
]

// ═══════════════════════════════════════════════
// Computed: Permissions
// ═══════════════════════════════════════════════
const canReview = computed(() => {
  return authStore.can('assessment.proposal_review') || authStore.can('assessment.manage')
})

const canCreate = computed(() => {
  return authStore.can('assessment.proposal_create')
})

const canManage = computed(() => {
  return authStore.can('assessment.manage')
})

// ═══════════════════════════════════════════════
// Computed: Filtered Proposals
// ═══════════════════════════════════════════════
const filteredProposals = computed(() => {
  let list = store.proposals

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    list = list.filter(p => p.title?.toLowerCase().includes(q))
  }

  if (filters.value.status) {
    list = list.filter(p => p.status === filters.value.status)
  }

  if (filters.value.proposer) {
    const q = filters.value.proposer.toLowerCase()
    list = list.filter(p => p.proposer?.name?.toLowerCase().includes(q))
  }

  return list
})

// ═══════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════
onMounted(async () => {
  await Promise.all([
    loadProposals(),
    canReview.value ? store.fetchStats() : Promise.resolve(),
  ])
})

// ═══════════════════════════════════════════════
// Methods
// ═══════════════════════════════════════════════
async function loadProposals() {
  try {
    await store.fetchProposals()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در دریافت پیشنهادات',
      life: 3000,
    })
  }
}

const debounceSearch = debounce(() => {
  // فیلتر از طریق computed انجام می‌شه
}, 300)

function applyFilters() {
  // فیلتر از طریق computed انجام می‌شه
}

function resetFilters() {
  filters.value = { search: '', status: null, proposer: '' }
}

function isOwner(proposal) {
  return parseInt(proposal.proposed_by_user_id, 10) === parseInt(authStore.user?.id, 10)
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
  const map = {
    5: 'danger',
    4: 'warning',
    3: 'info',
    2: 'primary',
    1: 'success',
  }
  return map[level] || 'secondary'
}

function getStatusText(status) {
  const map = {
    pending: 'در انتظار بررسی',
    approved: 'تایید شده',
    rejected: 'رد شده',
  }
  return map[status] || status
}

function getStatusSeverity(status) {
  const map = {
    pending: 'warn',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'secondary'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

// ═══════════════════════════════════════════════
// Actions: Approve
// ═══════════════════════════════════════════════
function confirmApprove(proposal) {
  confirm.require({
    message: `آیا از تایید پیشنهاد "${proposal.title}" اطمینان دارید؟ این پیشنهاد به سوال واقعی تبدیل خواهد شد.`,
    header: 'تایید پیشنهاد',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تایید شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await store.approveProposal(proposal.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'پیشنهاد تایید و به سوال تبدیل شد',
          life: 3000,
        })
        if (canReview.value) await store.fetchStats()
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

// ═══════════════════════════════════════════════
// Actions: Reject (تکی)
// ═══════════════════════════════════════════════
function openRejectDialog(proposal) {
  rejectingProposal.value = proposal
  rejectReason.value = ''
  showRejectDialog.value = true
}

async function submitReject() {
  if (!rejectReason.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'دلیل رد الزامی است',
      life: 3000,
    })
    return
  }

  rejecting.value = true
  try {
    await store.rejectProposal(rejectingProposal.value.id, rejectReason.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: 'پیشنهاد رد شد',
      life: 3000,
    })
    showRejectDialog.value = false
    if (canReview.value) await store.fetchStats()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در رد',
      life: 3000,
    })
  } finally {
    rejecting.value = false
  }
}

// ═══════════════════════════════════════════════
// Actions: Delete
// ═══════════════════════════════════════════════
function confirmDelete(proposal) {
  confirm.require({
    message: `آیا از حذف پیشنهاد "${proposal.title}" اطمینان دارید؟`,
    header: 'تایید حذف',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'بله، حذف شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await store.deleteProposal(proposal.id)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: 'پیشنهاد حذف شد',
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

// ═══════════════════════════════════════════════
// Actions: Bulk Approve
// ═══════════════════════════════════════════════
function confirmBulkApprove() {
  confirm.require({
    message: `آیا از تایید گروهی ${selectedProposals.value.length} پیشنهاد اطمینان دارید؟`,
    header: 'تایید گروهی',
    icon: 'pi pi-check-circle',
    acceptLabel: 'بله، تایید شود',
    rejectLabel: 'انصراف',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        const ids = selectedProposals.value.map(p => p.id)
        const result = await store.bulkApprove(ids)
        toast.add({
          severity: 'success',
          summary: 'موفق',
          detail: `${result.approved} پیشنهاد تایید شد`,
          life: 3000,
        })
        selectedProposals.value = []
        await store.fetchStats()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'خطا',
          detail: e.response?.data?.message || 'خطا در تایید گروهی',
          life: 3000,
        })
      }
    },
  })
}

// ═══════════════════════════════════════════════
// Actions: Bulk Reject
// ═══════════════════════════════════════════════
function openBulkRejectDialog() {
  bulkRejectReason.value = ''
  showBulkRejectDialog.value = true
}

async function submitBulkReject() {
  if (!bulkRejectReason.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'هشدار',
      detail: 'دلیل رد الزامی است',
      life: 3000,
    })
    return
  }

  bulkRejecting.value = true
  try {
    const ids = selectedProposals.value.map(p => p.id)
    const result = await store.bulkReject(ids, bulkRejectReason.value)
    toast.add({
      severity: 'success',
      summary: 'موفق',
      detail: `${result.rejected} پیشنهاد رد شد`,
      life: 3000,
    })
    showBulkRejectDialog.value = false
    selectedProposals.value = []
    await store.fetchStats()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'خطا',
      detail: e.response?.data?.message || 'خطا در رد گروهی',
      life: 3000,
    })
  } finally {
    bulkRejecting.value = false
  }
}
</script>