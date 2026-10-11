<!-- src/views/TripExpense/categories/CategoryList.vue -->

<template>
  <div class="category-list-page">
    <!-- Hero -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 class="hero-title">دسته‌بندی هزینه‌ها 📂</h1>
          <p class="hero-subtitle">مدیریت انواع هزینه‌های قابل ثبت در سفر</p>
        </div>
        <div class="flex justify-start md:justify-end">
          <button
              type="button"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all font-medium text-sm"
              @click="openCreateDialog"
          >
            <i class="pi pi-plus text-base"></i>
            <span>ثبت دسته‌بندی جدید</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Skeleton -->
    <div v-if="store.loading" class="dashboard-card p-5 space-y-4">
      <div class="skeleton w-48 h-6"></div>
      <div v-for="i in 5" :key="i" class="skeleton w-full h-12 rounded-lg"></div>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-card overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
            <i class="pi pi-folder text-violet-600 text-sm"></i>
          </div>
          <div>
            <h3 class="font-bold text-slate-800 text-sm">لیست دسته‌بندی‌ها</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">
              {{ store.categories?.length || 0 }} دسته‌بندی ثبت شده
            </p>
          </div>
        </div>
      </div>

      <DataTable
          :value="store.categories || []"
          :loading="store.loading"
          striped-rows
          class="w-full [&_th]:bg-slate-50/80 [&_th]:text-slate-600 [&_th]:font-semibold [&_th]:text-xs [&_th]:py-3.5 [&_td]:text-sm [&_td]:text-slate-700 [&_td]:py-3.5 hover:[&_tr]:bg-violet-50/30 transition-colors"
      >
        <Column field="id" header="#" style="width: 60px" class="text-center text-slate-400 font-mono text-xs" />
        <Column field="name" header="نام دسته‌بندی">
          <template #body="{ data }">
            <span class="font-bold text-slate-800 text-xs">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="code" header="کد">
          <template #body="{ data }">
            <span class="text-xs text-slate-600 dir-ltr font-mono">{{ data.code }}</span>
          </template>
        </Column>
        <Column field="description" header="توضیحات">
          <template #body="{ data }">
            <span class="text-xs text-slate-600">{{ data.description || '-' }}</span>
          </template>
        </Column>
        <Column field="sort_order" header="ترتیب" style="width: 80px">
          <template #body="{ data }">
            <span class="text-xs text-slate-500 font-mono">{{ data.sort_order }}</span>
          </template>
        </Column>
        <Column header="وضعیت" style="width: 120px">
          <template #body="{ data }">
                        <span
                            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                            :class="data.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'"
                        >
                            <i :class="data.is_active ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
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
                  @click="deleteCategory(data.id)"
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

    <!-- Dialog -->
    <Dialog v-model:visible="dialog.visible" :header="dialog.isEdit ? 'ویرایش دسته‌بندی' : 'ثبت دسته‌بندی جدید'" modal :style="{ width: '500px' }">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">نام <span class="text-rose-500">*</span></label>
            <input
                v-model="dialog.form.name"
                type="text"
                placeholder="مثلاً: آب معدنی"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p v-if="dialog.errors.name" class="text-xs text-rose-600">{{ dialog.errors.name }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">کد <span class="text-rose-500">*</span></label>
            <input
                v-model="dialog.form.code"
                type="text"
                placeholder="مثلاً: water"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm dir-ltr focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p v-if="dialog.errors.code" class="text-xs text-rose-600">{{ dialog.errors.code }}</p>
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">ترتیب نمایش</label>
            <input
                v-model.number="dialog.form.sort_order"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-600">وضعیت</label>
            <div class="flex items-center gap-2 mt-2">
              <InputSwitch v-model="dialog.form.is_active" />
              <span class="text-xs text-slate-600">{{ dialog.form.is_active ? 'فعال' : 'غیرفعال' }}</span>
            </div>
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="block text-xs font-semibold text-slate-600">توضیحات</label>
            <textarea
                v-model="dialog.form.description"
                rows="2"
                placeholder="توضیحات اختیاری..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            ></textarea>
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
import { reactive, onMounted } from 'vue'
import { useExpenseCategoryStore } from '@/stores/expenseCategoryStore'
import {useJalaliDate} from "@/composables/useJalaliDate.js";
const { toJalali, toJalaliTime, timeAgo } = useJalaliDate()

const store = useExpenseCategoryStore()

const dialog = reactive({
  visible: false,
  isEdit: false,
  editId: null,
  submitting: false,
  form: { name: '', code: '', description: '', sort_order: 0, is_active: true },
  errors: {},
})

const loadData = async () => {
  try {
    await store.fetchCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const openCreateDialog = () => {
  dialog.isEdit = false
  dialog.editId = null
  dialog.form = { name: '', code: '', description: '', sort_order: 0, is_active: true }
  dialog.errors = {}
  dialog.visible = true
}

const openEditDialog = (category) => {
  dialog.isEdit = true
  dialog.editId = category.id
  dialog.form = { ...category }
  dialog.errors = {}
  dialog.visible = true
}

const validate = () => {
  dialog.errors = {}
  let valid = true
  if (!dialog.form.name.trim()) { dialog.errors.name = 'نام الزامی است'; valid = false }
  if (!dialog.form.code.trim()) { dialog.errors.code = 'کد الزامی است'; valid = false }
  return valid
}

const submitForm = async () => {
  if (!validate()) return
  dialog.submitting = true
  try {
    if (dialog.isEdit) {
      await store.updateCategory(dialog.editId, dialog.form)
      alert('دسته‌بندی با موفقیت ویرایش شد')
    } else {
      await store.createCategory(dialog.form)
      alert('دسته‌بندی با موفقیت ایجاد شد')
    }
    dialog.visible = false
    loadData()
  } catch (error) {
    console.error(error)
    alert('خطا در ذخیره دسته‌بندی')
  } finally {
    dialog.submitting = false
  }
}

const deleteCategory = async (id) => {
  if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return
  try {
    await store.deleteCategory(id)
    alert('دسته‌بندی با موفقیت حذف شد')
    loadData()
  } catch (error) {
    console.error(error)
    alert(error.response?.data?.message || 'خطا در حذف دسته‌بندی')
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.category-list-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
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