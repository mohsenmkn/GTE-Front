<!-- src/views/TripExpense/limits/LimitList.vue -->

<template>
  <div class="limit-list-page">
    <!-- Hero -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 class="hero-title">سقف هزینه‌ها 💰</h1>
          <p class="hero-subtitle">تعریف سقف مجاز برای هر دسته‌بندی هزینه</p>
        </div>
        <div class="flex justify-start md:justify-end">
          <button
              type="button"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all font-medium text-sm"
              @click="openCreateDialog"
          >
            <i class="pi pi-plus text-base"></i>
            <span>تعریف سقف جدید</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Skeleton -->
    <div v-if="loading" class="dashboard-card p-5 space-y-4">
      <div class="skeleton w-48 h-6"></div>
      <div v-for="i in 5" :key="i" class="skeleton w-full h-12 rounded-lg"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-5">
      <!-- Filters -->
      <div class="dashboard-card p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">دسته‌بندی</label>
            <Select
                v-model="filters.category_id"
                :options="categoryOptions"
                option-label="name"
                option-value="id"
                placeholder="همه دسته‌بندی‌ها"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
                @change="loadData"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-500">نوع سقف</label>
            <Select
                v-model="filters.limit_type"
                :options="limitTypeOptions"
                option-label="label"
                option-value="value"
                placeholder="همه انواع"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
                @change="loadData"
            />
          </div>
          <div class="space-y-2 flex items-end">
            <button
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-xs font-medium"
                @click="resetFilters"
            >
              <i class="pi pi-refresh text-sm"></i>
              <span>پاک کردن فیلترها</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="dashboard-card overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <i class="pi pi-wallet text-emerald-600 text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">لیست سقف هزینه‌ها</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ pagination.total }} سقف تعریف شده</p>
            </div>
          </div>
        </div>

        <DataTable
            :value="limits || []"
            :loading="loading"
            paginator
            :rows="pagination.per_page"
            :total-records="pagination.total"
            @page="onPage"
            striped-rows
            class="w-full [&_th]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-semibold [&_th]:text-xs [&_th]:py-3.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:py-3.5 hover:[&_tr]:bg-violet-50/30 transition-colors"
        >
          <Column field="id" header="#" style="width: 60px" class="text-center text-slate-400 font-mono text-xs" />
          <Column header="دسته‌بندی">
            <template #body="{ data }">
              <span class="text-xs font-medium text-slate-800">{{ data.category?.name || '-' }}</span>
            </template>
          </Column>
          <Column header="نوع سقف">
            <template #body="{ data }">
                            <span
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                                :class="data.limit_type === 'per_trip' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'"
                            >
                                <i :class="data.limit_type === 'per_trip' ? 'pi pi-map' : 'pi pi-calendar'"></i>
                                {{ data.limit_type === 'per_trip' ? 'سقف هر سفر' : 'سقف ماهانه' }}
                            </span>
            </template>
          </Column>
          <Column header="مبلغ سقف">
            <template #body="{ data }">
              <span class="font-bold text-slate-800 text-xs">{{ formatMoney(data.amount) }}</span>
            </template>
          </Column>
          <Column header="از تاریخ">
            <template #body="{ data }">
              <span class="text-xs text-slate-600 dir-ltr font-mono">{{ toJalali(data.effective_from,'YYYY/MM/DD') }}</span>
            </template>
          </Column>
          <Column header="تا تاریخ">
            <template #body="{ data }">
              <span class="text-xs text-slate-600 dir-ltr font-mono">{{ toJalali(data.effective_to,'YYYY/MM/DD') || 'نامحدود' }}</span>
            </template>
          </Column>
          <Column header="وضعیت" style="width: 100px">
            <template #body="{ data }">
                            <span
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                                :class="data.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'"
                            >
                                {{ data.is_active ? 'فعال' : 'غیرفعال' }}
                            </span>
            </template>
          </Column>
          <Column header="عملیات" style="width: 140px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <button
                    @click="openEditDialog(data)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors"
                    title="ویرایش"
                >
                  <i class="pi pi-pencil text-xs"></i>
                </button>
                <button
                    @click="deleteLimit(data.id)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                    title="حذف"
                >
                  <i class="pi pi-trash text-xs"></i>
                </button>
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog -->
    <Dialog v-model:visible="dialog.visible" :header="dialog.isEdit ? 'ویرایش سقف' : 'تعریف سقف جدید'" modal :style="{ width: '550px' }">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">دسته‌بندی <span class="text-rose-500">*</span></label>
            <Select
                v-model="dialog.form.category_id"
                :options="categoryOptions"
                option-label="name"
                option-value="id"
                placeholder="انتخاب دسته‌بندی"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
            />
            <p v-if="dialog.errors.category_id" class="text-xs text-rose-600">{{ dialog.errors.category_id }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">نوع سقف <span class="text-rose-500">*</span></label>
            <Select
                v-model="dialog.form.limit_type"
                :options="limitTypeOptions.filter(l => l.value !== null)"
                option-label="label"
                option-value="value"
                placeholder="انتخاب نوع"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
            />
            <p v-if="dialog.errors.limit_type" class="text-xs text-rose-600">{{ dialog.errors.limit_type }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">مبلغ سقف (تومان) <span class="text-rose-500">*</span></label>
            <input
                v-model.number="dialog.form.amount"
                type="number"
                min="0"
                step="1000"
                placeholder="مثلاً: 500000"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p v-if="dialog.errors.amount" class="text-xs text-rose-600">{{ dialog.errors.amount }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">از تاریخ <span class="text-rose-500">*</span></label>
            <DatePicker
                v-model="dialog.form.effective_from"
                date-format="yyyy/mm/dd"
                placeholder="انتخاب تاریخ"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
            />
            <p v-if="dialog.errors.effective_from" class="text-xs text-rose-600">{{ dialog.errors.effective_from }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">تا تاریخ</label>
            <DatePicker
                v-model="dialog.form.effective_to"
                date-format="yyyy/mm/dd"
                placeholder="نامحدود"
                class="w-full"
                :pt="{ root: 'w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:border-violet-400 transition-all' }"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">وضعیت</label>
            <div class="flex items-center gap-2 mt-2">
              <InputSwitch v-model="dialog.form.is_active" />
              <span class="text-xs text-slate-600">{{ dialog.form.is_active ? 'فعال' : 'غیرفعال' }}</span>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button type="button" @click="dialog.visible = false" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm">انصراف</button>
          <button type="submit" :disabled="dialog.submitting" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm disabled:opacity-50">
            <i v-if="dialog.submitting" class="pi pi-spin pi-spinner"></i>
            <i v-else class="pi pi-check"></i>
            <span>{{ dialog.submitting ? 'در حال ذخیره...' : 'ذخیره' }}</span>
          </button>
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import tripExpenseService from '@/services/tripExpenseService'
import { useExpenseCategoryStore } from '@/stores/expenseCategoryStore'
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()

const categoryStore = useExpenseCategoryStore()

const limits = ref([])
const loading = ref(false)
const pagination = reactive({ current_page: 1, per_page: 15, total: 0 })
const filters = ref({ category_id: null, limit_type: null })

const categoryOptions = ref([])
const limitTypeOptions = [
  { label: 'همه انواع', value: null },
  { label: 'سقف هر سفر', value: 'per_trip' },
  { label: 'سقف ماهانه', value: 'monthly' },
]

const dialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
  submitting: false,
  form: { category_id: null, limit_type: null, amount: null, effective_from: null, effective_to: null, is_active: true },
  errors: {},
})

const formatDate = (date) => {
  if (!date) return null
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return date
}

const formatMoney = (v) => v ? Number(v).toLocaleString('fa-IR') + ' تومان' : '0 تومان'

const loadData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.current_page, per_page: pagination.per_page }
    if (filters.value.category_id) params.category_id = filters.value.category_id
    if (filters.value.limit_type) params.limit_type = filters.value.limit_type

    const response = await tripExpenseService.getLimits(params)

    // ✅ اصلاح: بررسی ساختار پاسخ
    console.log('Limits response:', response)

    if (response.data && Array.isArray(response.data)) {
      limits.value = response.data
      if (response.meta) {
        pagination.total = response.meta.total
      }
    } else if (Array.isArray(response)) {
      limits.value = response
      pagination.total = response.length
    } else {
      limits.value = []
      pagination.total = 0
    }

  } catch (error) {
    console.error('Error loading limits:', error)
    limits.value = []
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = { category_id: null, limit_type: null }
  pagination.current_page = 1
  loadData()
}

const onPage = (event) => {
  pagination.current_page = event.page + 1
  loadData()
}

const openCreateDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  dialog.form = { category_id: null, limit_type: null, amount: null, effective_from: null, effective_to: null, is_active: true }
  dialog.errors = {}
  dialog.visible = true
}

const openEditDialog = (limit) => {
  dialog.isEdit = true
  dialog.editId = limit.id
  dialog.form = { ...limit }
  dialog.errors = {}
  dialog.visible = true
}

const validate = () => {
  dialog.errors = {}
  let valid = true
  if (!dialog.form.category_id) { dialog.errors.category_id = 'انتخاب دسته‌بندی الزامی است'; valid = false }
  if (!dialog.form.limit_type) { dialog.errors.limit_type = 'انتخاب نوع سقف الزامی است'; valid = false }
  if (!dialog.form.amount || dialog.form.amount <= 0) { dialog.errors.amount = 'مبلغ معتبر وارد کنید'; valid = false }
  if (!dialog.form.effective_from) { dialog.errors.effective_from = 'تاریخ شروع الزامی است'; valid = false }
  return valid
}

const submitForm = async () => {
  if (!validate()) return
  dialog.submitting = true
  try {
    const payload = {
      ...dialog.form,
      effective_from: formatDate(dialog.form.effective_from),
      effective_to: formatDate(dialog.form.effective_to),
    }

    if (dialog.isEdit) {
      await tripExpenseService.updateLimit(dialog.editId, payload)
      alert('سقف با موفقیت ویرایش شد')
    } else {
      await tripExpenseService.createLimit(payload)
      alert('سقف با موفقیت ایجاد شد')
    }
    dialog.visible = false
    loadData()  // ✅ بارگذاری مجدد داده‌ها
  } catch (error) {
    console.error(error)
    alert('خطا در ذخیره سقف')
  } finally {
    dialog.submitting = false
  }
}

const deleteLimit = async (id) => {
  if (!confirm('آیا از حذف این سقف اطمینان دارید؟')) return
  try {
    await tripExpenseService.deleteLimit(id)
    alert('سقف با موفقیت حذف شد')
    loadData()
  } catch (error) {
    console.error(error)
    alert('خطا در حذف سقف')
  }
}

onMounted(async () => {
  await categoryStore.fetchOptions()
  categoryOptions.value = categoryStore.options
  loadData()
})
</script>

<style scoped>
.limit-list-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
.dir-ltr { direction: ltr; }
.skeleton { @apply relative overflow-hidden rounded-lg bg-slate-200/70; }
.skeleton::after {
  content: ''; @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent);
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }

.dashboard-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(238 242 255), rgb(248 250 252) 55%, rgb(245 243 255));
  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}
.hero-decoration { @apply absolute rounded-full pointer-events-none; filter: blur(50px); }
.hero-decoration-one { width: 220px; height: 220px; background: rgb(129 140 248 / 12%); top: -100px; left: -60px; }
.hero-decoration-two { width: 180px; height: 180px; background: rgb(167 139 250 / 12%); bottom: -100px; right: -50px; }
.hero-title { @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight; }
.hero-subtitle { @apply text-sm md:text-base text-slate-500 mt-1; }

.dashboard-card {
  @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

@keyframes dashboard-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>