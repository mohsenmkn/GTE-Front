<template>
  <div class="warehouse-page">
    <!-- ═══════ Header ═══════ -->
    <section class="warehouse-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <component :is="isEdit ? Edit : Plus" class="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h1 class="hero-title">{{ isEdit ? 'ویرایش تجهیز' : 'ایجاد تجهیز جدید' }}</h1>
          <p class="hero-subtitle">{{ isEdit ? `ویرایش اطلاعات ${form.title}` : 'اطلاعات تجهیز جدید را وارد کنید' }}</p>
        </div>
      </div>
    </section>

    <!-- ═══════ Form ═══════ -->
    <section class="warehouse-card p-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- کد -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              کد تجهیز <span class="text-red-500">*</span>
            </label>
            <input
                v-model="form.code"
                type="text"
                :disabled="isEdit"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all disabled:bg-slate-50"
                placeholder="مثال: TRK-001"
            />
            <p v-if="errors.code" class="text-xs text-red-600 mt-1">{{ errors.code }}</p>
          </div>

          <!-- نام -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">
              نام تجهیز <span class="text-red-500">*</span>
            </label>
            <input
                v-model="form.title"
                type="text"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                placeholder="مثال: کامیون ولوو FH16"
            />
            <p v-if="errors.title" class="text-xs text-red-600 mt-1">{{ errors.title }}</p>
          </div>

          <!-- نام انگلیسی -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">نام انگلیسی</label>
            <input
                v-model="form.title_en"
                type="text"
                dir="ltr"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all text-left"
                placeholder="Volvo FH16"
            />
          </div>

          <!-- نوع -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">نوع تجهیز</label>
            <select
                v-model="form.type"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
            >
              <option :value="null">انتخاب کنید...</option>
              <option v-for="(label, value) in types" :key="value" :value="Number(value)">
                {{ label }}
              </option>
            </select>
          </div>

          <!-- وضعیت -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">وضعیت</label>
            <select
                v-model="form.state"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
            >
              <option :value="1">فعال</option>
              <option :value="2">غیرفعال</option>
              <option :value="3">در تعمیر</option>
            </select>
          </div>

          <!-- تجهیز والد -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">تجهیز والد</label>
            <select
                v-model="form.parent_equipment_id"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
            >
              <option :value="null">ندارد</option>
              <option v-for="eq in allEquipment" :key="eq.id" :value="eq.id">
                {{ eq.code }} - {{ eq.title }}
              </option>
            </select>
          </div>
        </div>

        <!-- توضیحات -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">توضیحات</label>
          <textarea
              v-model="form.description"
              rows="4"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all resize-none"
              placeholder="توضیحات اضافی..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
              type="button"
              @click="$router.back()"
              class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all"
          >
            انصراف
          </button>
          <button
              type="submit"
              :disabled="submitting"
              class="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            {{ submitting ? 'در حال ذخیره...' : (isEdit ? 'به‌روزرسانی' : 'ایجاد') }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Edit, Save } from 'lucide-vue-next'
import api from '@/api/axios.js'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const submitting = ref(false)
const types = ref({})
const allEquipment = ref([])
const errors = ref({})

const form = ref({
  code: '',
  title: '',
  title_en: '',
  type: null,
  description: '',
  state: 1,
  parent_equipment_id: null,
})

const fetchTypes = async () => {
  try {
    const { data } = await api.get('/warehouse-gtrabar/equipment')
    types.value = data.types || {}
  } catch (error) {
    console.error('Error:', error)
  }
}

const fetchEquipment = async () => {
  try {
    const { data } = await api.get('/warehouse-gtrabar/equipment', { params: { per_page: 1000 } })
    allEquipment.value = data.data || []
  } catch (error) {
    console.error('Error:', error)
  }
}

const fetchCurrent = async () => {
  try {
    const { data } = await api.get(`/warehouse-gtrabar/equipment/${route.params.id}`)
    const eq = data.data
    form.value = {
      code: eq.code,
      title: eq.title,
      title_en: eq.title_en || '',
      type: eq.type,
      description: eq.description || '',
      state: eq.state,
      parent_equipment_id: eq.parent_equipment_id,
    }
  } catch (error) {
    console.error('Error:', error)
    router.back()
  }
}

const submitForm = async () => {
  submitting.value = true
  errors.value = {}
  try {
    if (isEdit.value) {
      await api.put(`/warehouse-gtrabar/equipment/${route.params.id}`, form.value)
    } else {
      await api.post('/warehouse-gtrabar/equipment', form.value)
    }
    router.push({ name: 'wg.equipment' })
  } catch (error) {
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTypes(), fetchEquipment()])
  if (isEdit.value) await fetchCurrent()
})
</script>

<style scoped>
.warehouse-page { @apply space-y-5; animation: dashboard-enter 0.45s ease-out; }
.warehouse-hero {
  @apply relative overflow-hidden rounded-3xl border border-emerald-100/70 p-6 md:p-8;
  background: linear-gradient(135deg, rgb(236 253 245), rgb(248 250 252) 55%, rgb(240 253 250));
  box-shadow: 0 8px 30px rgb(16 185 129 / 5%);
}
.hero-decoration { @apply absolute rounded-full pointer-events-none; filter: blur(50px); }
.hero-decoration-one { width: 220px; height: 220px; background: rgb(52 211 153 / 12%); top: -100px; left: -60px; }
.hero-decoration-two { width: 180px; height: 180px; background: rgb(94 234 212 / 12%); bottom: -100px; right: -50px; }
.hero-title { @apply text-2xl md:text-3xl font-bold text-slate-800 tracking-tight; }
.hero-subtitle { @apply text-sm md:text-base text-slate-500 mt-1; }
.warehouse-card { @apply bg-white rounded-2xl border border-slate-200/70 overflow-hidden; box-shadow: 0 1px 3px rgb(15 23 42 / 4%); }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
