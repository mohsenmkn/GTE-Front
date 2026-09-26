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
            <span class="text-xs text-slate-500">تخصیص خودکار شناسنامه و ارزیاب به پرسنل</span>
          </div>
          <h1 class="hero-title">تخصیص خودکار شایستگی ⚡</h1>
          <p class="hero-subtitle">
            تطبیق خودکار سمت هر کارمند با خانواده شغلی، شناسنامه شایستگی و ارزیاب زنجیره‌ای
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <!-- ✅ اگر cycles خالی باشد، دکمه ساخت چرخه نمایش داده می‌شود -->
          <Button
              v-if="cycles.length === 0"
              label="ساخت چرخه جدید"
              icon="pi pi-plus"
              severity="success"
              @click="showCreateCycleDialog = true"
          />
          <Select
              v-else
              v-model="cycleId"
              :options="cycles"
              optionLabel="title"
              optionValue="id"
              placeholder="انتخاب چرخه ارزیابی…"
              class="w-full sm:w-56"
              @change="loadPreview"
          />
          <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              :loading="loading"
              @click="loadPreview"
          />
        </div>
      </div>
    </section>

    <!-- ═══ پیام هشدار وقتی cycles خالی است ═══ -->
    <Message
        v-if="cycles.length === 0"
        severity="warn"
        :closable="false"
        class="mb-4"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle"></i>
        <span>
          هیچ چرخه ارزیابی وجود ندارد. ابتدا یک چرخه بسازید.
        </span>
      </div>
    </Message>

    <!-- ═══ کارت‌های خلاصه ═══ -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-slate-700">{{ summary.total }}</p>
        <p class="text-[11px] text-slate-500 mt-1">کل پرسنل</p>
      </div>
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-emerald-600">{{ summary.ready }}</p>
        <p class="text-[11px] text-slate-500 mt-1">آماده تخصیص</p>
      </div>
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-sky-600">{{ summary.exists }}</p>
        <p class="text-[11px] text-slate-500 mt-1">قبلاً ارزیابی شده</p>
      </div>
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-amber-600">{{ summary.no_profile }}</p>
        <p class="text-[11px] text-slate-500 mt-1">بدون شناسنامه</p>
      </div>
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-orange-600">{{ summary.no_evaluator }}</p>
        <p class="text-[11px] text-slate-500 mt-1">بدون ارزیاب</p>
      </div>
      <div class="dashboard-card p-4 text-center">
        <p class="text-2xl font-bold text-slate-400">{{ summary.out_of_scope }}</p>
        <p class="text-[11px] text-slate-500 mt-1">خارج از دامنه</p>
      </div>
    </div>

    <!-- ═══ پوشش خانواده‌ها ═══ -->
    <section class="dashboard-card overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <i class="pi pi-sitemap"></i>
        </span>
        <div>
          <h3 class="font-bold text-slate-800">پوشش خانواده‌های شغلی</h3>
          <p class="text-xs text-slate-500 mt-1">زنجیره ارزیابی و وضعیت شناسنامه هر خانواده</p>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
          <tr class="text-slate-500 text-xs border-b border-slate-100">
            <th class="text-right p-3 font-medium">خانواده شغلی</th>
            <th class="text-right p-3 font-medium">تعداد پرسنل</th>
            <th class="text-right p-3 font-medium">ارزیاب زنجیره‌ای</th>
            <th class="text-right p-3 font-medium">شناسنامه</th>
            <th class="text-right p-3 font-medium">ارزیاب موجود</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="f in familyCoverage" :key="f.family" class="border-b border-slate-50 hover:bg-slate-50/50">
            <td class="p-3 font-medium text-slate-700">{{ f.family }}</td>
            <td class="p-3 text-slate-600">{{ f.count }}</td>
            <td class="p-3 text-slate-600">{{ f.chain }}</td>
            <td class="p-3">
              <Tag :value="f.withProfile ? 'دارد' : 'ندارد'" :severity="f.withProfile ? 'success' : 'danger'" style="font-size:10px" />
            </td>
            <td class="p-3">
              <Tag :value="f.withEvaluator ? 'موجود' : 'ناموجود'" :severity="f.withEvaluator ? 'success' : 'warn'" style="font-size:10px" />
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══ پیش‌نمایش تخصیص ═══ -->
    <section class="dashboard-card overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i class="pi pi-list-check"></i>
          </span>
          <div>
            <h3 class="font-bold text-slate-800">پیش‌نمایش تخصیص</h3>
            <p class="text-xs text-slate-500 mt-1">{{ filteredRows.length }} ردیف</p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <InputText v-model="search" placeholder="جستجوی نام / کد پرسنلی…" class="w-full sm:w-56" />
          <Select
              v-model="statusFilter"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="همه وضعیت‌ها"
              showClear
              class="w-full sm:w-44"
          />
        </div>
      </div>
      <DataTable
          :value="filteredRows"
          :paginator="true"
          :rows="25"
          :rowsPerPageOptions="[25, 50, 100]"
          :loading="loading"
          responsiveLayout="scroll"
          rowHover
          stripedRows
      >
        <Column field="personnel_code" header="کد پرسنلی" class="w-24" />
        <Column field="name" header="کارمند" class="w-48" />
        <Column field="unit" header="واحد" class="w-40" />
        <Column field="post_title" header="سمت سازمانی" class="w-56" />
        <Column header="خانواده" class="w-36">
          <template #body="{ data }">
            <Tag v-if="data.family" :value="data.family" severity="info" style="font-size:10px" />
            <span v-else class="text-slate-300">—</span>
          </template>
        </Column>
        <Column header="شناسنامه" class="w-48">
          <template #body="{ data }">
            <span v-if="data.profile_title" class="text-slate-600 text-xs">{{ data.profile_title }}</span>
            <span v-else class="text-slate-300">—</span>
          </template>
        </Column>
        <Column header="ارزیاب" class="w-40">
          <template #body="{ data }">
            <span v-if="data.evaluator_name" class="text-slate-600 text-xs">{{ data.evaluator_name }}</span>
            <span v-else class="text-slate-300">—</span>
          </template>
        </Column>
        <Column header="وضعیت" class="w-32">
          <template #body="{ data }">
            <Tag :value="statusMeta(data.status).label" :severity="statusMeta(data.status).severity" style="font-size:10px" />
          </template>
        </Column>
      </DataTable>
    </section>

    <!-- ═══ نوار اجرا ══ -->
    <div class="dashboard-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
      <p class="text-sm text-slate-600">
        <i class="pi pi-info-circle text-indigo-500 ml-1"></i>
        با اجرای تخصیص، برای <b class="text-emerald-600">{{ summary.ready }}</b> کارمند آماده،
        ارزیابی پیش‌نویس در چرخه انتخابی ساخته می‌شود.
        <b class="text-sky-600">{{ summary.exists }}</b> ارزیابی موجود دست‌نخورده می‌ماند.
      </p>
      <Button
          label="اجرای تخصیص خودکار"
          icon="pi pi-bolt"
          :disabled="!cycleId || !summary.ready"
          :loading="executing"
          @click="confirmDialog = true"
      />
    </div>

    <!-- ══ دیالوگ تأیید ══ -->
    <Dialog v-model:visible="confirmDialog" header="تأیید تخصیص خودکار" modal :style="{ width: '95vw', maxWidth: '440px' }">
      <div class="space-y-3 text-sm text-slate-600 leading-7">
        <p>
          برای چرخه انتخابی، <b class="text-emerald-600">{{ summary.ready }}</b> ارزیابی جدید ساخته می‌شود.
        </p>
        <p class="text-xs text-slate-400">
          {{ summary.exists }} ارزیابی موجود تغییر نمی‌کند؛
          {{ summary.no_profile + summary.no_evaluator + summary.out_of_scope }} ردیف نامنطبق رد می‌شود.
        </p>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" outlined @click="confirmDialog = false" />
        <Button label="اجرا" icon="pi pi-bolt" :loading="executing" @click="execute" />
      </template>
    </Dialog>

    <!-- ═══ دیالوگ ساخت چرخه جدید ═══ -->
    <Dialog v-model:visible="showCreateCycleDialog" header="ساخت چرخه ارزیابی جدید" modal :style="{ width: '500px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            عنوان چرخه <span class="text-red-500">*</span>
          </label>
          <InputText
              v-model="newCycle.title"
              class="w-full"
              placeholder="مثال: ارزیابی شایستگی 1405"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
            <InputText v-model="newCycle.start_date" type="date" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان</label>
            <InputText v-model="newCycle.end_date" type="date" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">نوع</label>
          <Select
              v-model="newCycle.type"
              :options="cycleTypes"
              optionLabel="label"
              optionValue="value"
              class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="انصراف" severity="secondary" @click="showCreateCycleDialog = false" />
        <Button
            label="ساخت چرخه"
            icon="pi pi-check"
            severity="success"
            :loading="creatingCycle"
            @click="createCycle"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import assessmentService from '@/services/assessmentService'

const toast = useToast()

const loading = ref(false)
const executing = ref(false)
const creatingCycle = ref(false)
const cycles = ref([])
const cycleId = ref(null)
const rows = ref([])
const search = ref('')
const statusFilter = ref(null)
const confirmDialog = ref(false)
const showCreateCycleDialog = ref(false)

const newCycle = ref({
  title: '',
  type: 'annual',
  start_date: '',
  end_date: '',
})

const cycleTypes = [
  { label: 'سالانه', value: 'annual' },
  { label: 'انتقالی', value: 'transfer' },
]

const summary = ref({
  total: 0, ready: 0, exists: 0,
  no_profile: 0, no_evaluator: 0, out_of_scope: 0,
})

const FAMILY_CHAIN = {
  'معاون': 'مدیرعامل',
  'مدیر': 'معاون',
  'رئیس': 'مدیر',
  'سرپرست/کارشناس ارشد': 'رئیس',
  'کارشناس': 'سرپرست/کارشناس ارشد',
  'کاردان/تکنسین/مسئول': 'سرپرست/کارشناس ارشد',
  'متصدی': 'سرپرست/کارشناس ارشد',
  'راننده/اپراتور': 'سرپرست/کارشناس ارشد',
  'کارگر': 'سرپرست/کارشناس ارشد',
}

const STATUS_META = {
  ready:        { label: 'آماده تخصیص', severity: 'success' },
  exists:       { label: 'قبلاً ارزیابی شده', severity: 'secondary' },
  no_profile:   { label: 'بدون شناسنامه', severity: 'warn' },
  no_evaluator: { label: 'بدون ارزیاب', severity: 'warn' },
  out_of_scope: { label: 'خارج از دامنه', severity: 'secondary' },
}

const statusOptions = Object.entries(STATUS_META).map(([value, m]) => ({ value, label: m.label }))
const statusMeta = (s) => STATUS_META[s] || { label: s, severity: 'secondary' }

const familyCoverage = computed(() => {
  const map = {}
  for (const r of rows.value) {
    if (!r.family) continue
    if (!map[r.family]) {
      map[r.family] = { family: r.family, count: 0, withProfile: false, withEvaluator: false }
    }
    const f = map[r.family]
    f.count++
    if (r.post_id) f.withProfile = true
    if (r.evaluator_id) f.withEvaluator = true
  }
  return Object.values(map).map(f => ({ ...f, chain: FAMILY_CHAIN[f.family] || '—' }))
})

const filteredRows = computed(() => {
  let list = rows.value
  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value)
  }
  const q = search.value.trim()
  if (q) {
    list = list.filter(r =>
        (r.name || '').includes(q) ||
        (r.personnel_code || '').includes(q)
    )
  }
  return list
})

const loadCycles = async () => {
  try {
    const data = await assessmentService.getCycles()
    cycles.value = data.cycles || []
    if (!cycleId.value && cycles.value.length) {
      cycleId.value = cycles.value.find(c => c.status === 'active')?.id || cycles.value[0].id
      await loadPreview()
    }
  } catch (e) {
    console.error('Load cycles error:', e)
  }
}

const loadPreview = async () => {
  if (!cycleId.value) return
  loading.value = true
  try {
    const data = await assessmentService.autoAssignPreview(cycleId.value)
    rows.value = data.rows || []
    summary.value = data.summary || summary.value
  } catch (e) {
    console.error('Preview error:', e)
    toast.add({ severity: 'error', summary: 'خطا', detail: 'خطا در دریافت پیش‌نمایش تخصیص', life: 5000 })
  } finally {
    loading.value = false
  }
}

const execute = async () => {
  executing.value = true
  try {
    const res = await assessmentService.autoAssignExecute(cycleId.value)
    toast.add({ severity: 'success', summary: 'تخصیص انجام شد', detail: res.message, life: 6000 })
    confirmDialog.value = false
    await loadPreview()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در اجرای تخصیص', life: 6000 })
  } finally {
    executing.value = false
  }
}

const createCycle = async () => {
  if (!newCycle.value.title) {
    toast.add({ severity: 'warn', summary: 'هشدار', detail: 'عنوان چرخه الزامی است', life: 3000 })
    return
  }
  creatingCycle.value = true
  try {
    const data = await assessmentService.createCycle(newCycle.value)
    toast.add({ severity: 'success', summary: 'موفق', detail: 'چرخه با موفقیت ساخته شد', life: 3000 })
    showCreateCycleDialog.value = false
    newCycle.value = { title: '', type: 'annual', start_date: '', end_date: '' }
    await loadCycles()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'خطا', detail: e.response?.data?.message || 'خطا در ساخت چرخه', life: 5000 })
  } finally {
    creatingCycle.value = false
  }
}

onMounted(async () => {
  await loadCycles()
})
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
.dashboard-card { @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>