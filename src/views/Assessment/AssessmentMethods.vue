<template>
  <div class="dashboard-page">

    <!-- ═══ HERO ═══ -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="hero-status"></span>
            <span class="text-xs text-slate-500">کاتالوگ پویای روش‌های توسعه شایستگی</span>
          </div>
          <h1 class="hero-title">روش‌های رفع خلا شایستگی 🛠️</h1>
          <p class="hero-subtitle">افزودن، ویرایش و مدیریت روش‌های رفع گپ شایستگی</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="role-badge">{{ activeCount }} روش فعال</span>
          <Button label="روش جدید" icon="pi pi-plus" @click="openCreate" />
        </div>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="dashboard-card p-4"><div class="skeleton w-full h-14"></div></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!methods.length" class="dashboard-card p-12 text-center">
      <i class="pi pi-inbox text-5xl text-slate-200 mb-4 block"></i>
      <p class="text-slate-400 text-sm">هنوز روشی ثبت نشده است.</p>
    </div>

    <!-- ═══ کارت‌های روش ═══ -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
          v-for="m in methods"
          :key="m.id"
          class="dashboard-card p-4 flex items-center justify-between gap-3"
          :class="{ 'opacity-60': !m.is_active }"
      >
        <div class="flex items-center gap-3 min-w-0">
        <span class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
          <i class="pi pi-wrench"></i>
        </span>
          <div class="min-w-0">
            <p class="font-semibold text-slate-800 text-sm truncate">{{ m.title }}</p>
            <Tag
                :value="m.is_active ? 'فعال' : 'غیرفعال'"
                :severity="m.is_active ? 'success' : 'danger'"
                style="font-size:10px"
                class="mt-1"
            />
          </div>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <Button icon="pi pi-pencil" severity="info" outlined rounded size="small"
                  v-tooltip.top="'ویرایش'" @click="openEdit(m)" />
          <Button icon="pi pi-trash" severity="danger" outlined rounded size="small"
                  v-tooltip.top="'حذف'" @click="openDelete(m)" />
        </div>
      </div>
    </div>

    <!-- ═══ Dialog ایجاد/ویرایش ═══ -->
    <Dialog v-model:visible="formDialog" :header="editing ? 'ویرایش روش' : 'روش رفع خلا جدید'" modal
            :style="{ width: '95vw', maxWidth: '460px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">عنوان روش <span class="text-red-500">*</span></label>
          <InputText v-model="form.title" class="w-full" placeholder="مثال: شرکت در وبینار تخصصی" @keyup.enter="save" />
        </div>
        <div v-if="editing" class="flex items-center gap-2">
          <ToggleSwitch v-model="form.is_active" />
          <span class="text-sm text-slate-600">روش فعال است</span>
        </div>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" outlined @click="formDialog = false" />
        <Button :label="editing ? 'ذخیره تغییرات' : 'افزودن روش'" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>

    <!-- ═══ Dialog حذف ═══ -->
    <Dialog v-model:visible="deleteDialog" header="حذف روش" modal :style="{ width: '95vw', maxWidth: '420px' }">
      <div class="text-center space-y-3">
      <span class="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
        <i class="pi pi-trash text-2xl"></i>
      </span>
        <p class="text-sm text-slate-700">آیا از حذف روش <b>«{{ deleteTarget?.title }}»</b> مطمئن هستید؟</p>
        <p class="text-xs text-slate-400">اگر روش در اقدامات اصلاحی استفاده شده باشد، به جای حذف غیرفعال می‌شود.</p>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" outlined @click="deleteDialog = false" />
        <Button label="حذف" icon="pi pi-trash" severity="danger" :loading="saving" @click="confirmDelete" />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import assessmentService from '@/services/assessmentService'

const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const methods = ref([])

const formDialog = ref(false)
const deleteDialog = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const form = ref({ title: '', is_active: true })

const activeCount = computed(() => methods.value.filter(m => m.is_active).length)

const fetchMethods = async () => {
  loading.value = true
  try {
    const data = await assessmentService.getMethods(true) // همه شامل غیرفعال‌ها
    methods.value = data.methods || []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  form.value = { title: '', is_active: true }
  formDialog.value = true
}

const openEdit = (m) => {
  editing.value = m
  form.value = { title: m.title, is_active: !!m.is_active }
  formDialog.value = true
}

const save = async () => {
  if (!form.value.title.trim()) {
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'عنوان روش الزامی است.', life: 3000 })
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await assessmentService.updateMethod(editing.value.id, form.value)
      toast.add({ severity: 'success', summary: 'موفق', detail: 'روش به‌روزرسانی شد.', life: 3000 })
    } else {
      await assessmentService.createMethod({ title: form.value.title })
      toast.add({ severity: 'success', summary: 'موفق', detail: 'روش جدید افزوده شد.', life: 3000 })
    }
    formDialog.value = false
    await fetchMethods()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در ذخیره روش', life: 5000 })
  } finally {
    saving.value = false
  }
}

const openDelete = (m) => {
  deleteTarget.value = m
  deleteDialog.value = true
}

const confirmDelete = async () => {
  saving.value = true
  try {
    const res = await assessmentService.deleteMethod(deleteTarget.value.id)
    toast.add({
      severity: res.disabled ? 'warn' : 'success',
      summary: res.disabled ? 'غیرفعال شد' : 'حذف شد',
      detail: res.message,
      life: 4000,
    })
    deleteDialog.value = false
    await fetchMethods()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در حذف روش', life: 5000 })
  } finally {
    saving.value = false
  }
}

onMounted(fetchMethods)
</script>

<style scoped>
.dashboard-page { @apply space-y-5; animation: dashboard-enter .45s ease-out; }
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
.hero-status { @apply w-2 h-2 rounded-full bg-emerald-500; box-shadow: 0 0 0 4px rgb(16 185 129 / 10%); }
.role-badge { @apply px-3 py-1.5 rounded-full bg-white/80 border border-white shadow-sm text-[11px] font-medium text-slate-600 backdrop-blur-sm; }
.dashboard-card { @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
.skeleton { @apply relative overflow-hidden rounded-lg bg-slate-200/70; }
.skeleton::after { content:''; @apply absolute inset-0; transform: translateX(-100%); background: linear-gradient(90deg, transparent, rgb(255 255 255 / 55%), transparent); animation: skeleton-shimmer 1.5s infinite; }
@keyframes skeleton-shimmer { 100% { transform: translateX(100%); } }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>