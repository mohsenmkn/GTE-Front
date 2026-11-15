<template>
  <main class="api-page" dir="rtl">
    <header class="page-header">
      <div>
        <p class="eyebrow">یکپارچه‌سازی سامانه‌ها</p>
        <h1>{{ title }}</h1>
        <p class="subtitle">صدور دسترسی محدود و ارائه امن اطلاعات پرسنلی و ساختار سازمانی</p>
      </div>
      <span class="version">API v1</span>
    </header>

    <section v-if="section === 'clients'" class="panel">
      <div class="section-heading">
        <div>
          <h2>دسترسی‌های صادرشده</h2>
          <p>برای هر سازمان یا سامانه یک توکن مستقل بسازید و فقط مجوزهای لازم را انتخاب کنید.</p>
        </div>
      </div>

      <form class="create-form" @submit.prevent="createClient">
        <label class="field">
          <span>نام شخص یا سازمان</span>
          <input v-model.trim="form.name" required maxlength="100" placeholder="مثلاً سامانه مالی" />
        </label>
        <label class="field">
          <span>تاریخ انقضا (اختیاری)</span>
          <JalaliDatePicker v-model="form.expires_at" placeholder="انتخاب تاریخ انقضا" />
        </label>
        <div class="field scopes-field">
          <span>مجوزها</span>
          <label><input v-model="form.abilities" type="checkbox" value="hr:employees:read" /> خواندن اطلاعات پرسنل</label>
          <label><input v-model="form.abilities" type="checkbox" value="hr:hierarchy:read" /> خواندن سلسله‌مراتب سازمانی</label>
          <label><input v-model="form.abilities" type="checkbox" value="hr:attendance:read" /> خواندن اطلاعات کنترل تردد</label>
        </div>
        <button class="primary-button" type="submit" :disabled="saving || !form.abilities.length">
          {{ saving ? 'در حال صدور…' : 'صدور توکن' }}
        </button>
      </form>

      <div v-if="newToken" class="token-alert" role="status">
        <strong>توکن صادر شد؛ این مقدار فقط همین‌بار نمایش داده می‌شود.</strong>
        <code dir="ltr">{{ newToken }}</code>
        <button class="secondary-button" type="button" @click="copyToken">کپی توکن</button>
      </div>

      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div v-if="loading" class="empty-state">در حال دریافت دسترسی‌ها…</div>
      <div v-else-if="!clients.length" class="empty-state">هنوز توکنی صادر نشده است.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>نام</th><th>مجوزها</th><th>آخرین استفاده</th><th>انقضا</th><th>عملیات</th></tr></thead>
          <tbody>
            <tr v-for="client in clients" :key="client.id">
              <td>{{ client.name.replace(/^api-management:/, '') }}</td>
              <td><span v-for="scope in client.abilities" :key="scope" class="scope-chip">{{ scopeLabel(scope) }}</span></td>
              <td>{{ formatDate(client.last_used_at) }}</td>
              <td>{{ formatDate(client.expires_at) }}</td>
              <td><button class="revoke-button" type="button" @click="revokeClient(client)">لغو دسترسی</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else class="panel docs-panel">
      <div class="section-heading">
        <div>
          <h2>{{ section === 'personnel' ? 'فهرست پرسنل' : section === 'attendance' ? 'کنترل تردد' : 'سلسله‌مراتب سازمانی' }}</h2>
          <p>{{ section === 'personnel' ? 'فهرست صفحه‌بندی‌شده با فیلترهای اختیاری.' : section === 'attendance' ? 'وضعیت امروز هر کد پرسنلی، فقط به‌صورت حاضر یا غایب.' : 'دریافت درخت واحدها، سمت‌ها و کارکنان.' }}</p>
        </div>
        <span class="scope-chip">{{ requiredAbility }}</span>
      </div>
      <div class="doc-row"><span>نشانی</span><code dir="ltr">{{ endpoint }}</code></div>
      <div v-if="section === 'personnel'" class="doc-row"><span>پارامترهای اختیاری</span><p><code>search</code>، <code>unit_id</code>، <code>employee_type</code>، <code>is_active</code> و <code>per_page</code> (۱ تا ۱۰۰)</p></div>
      <div v-if="section === 'attendance'" class="doc-row"><span>خروجی</span><p>تاریخ جاری شمسی و فهرست رکوردهای دارای دو فیلد <code>personnel_code</code> و <code>status</code>. مقدار وضعیت <code>present</code> یا <code>absent</code> است. پارامتر لازم نیست.</p></div>
      <div class="doc-row"><span>احراز هویت</span><p>درخواست را با هدر <code dir="ltr">Authorization: Bearer YOUR_TOKEN</code> ارسال کنید.</p></div>
      <h3>نمونه درخواست</h3>
      <pre dir="ltr"><code>{{ curlExample }}</code></pre>
      <p class="privacy-note">پاسخ شامل اطلاعات کاری و سازمانی لازم است و شماره تماس و کد ملی را برنمی‌گرداند.</p>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import apiManagementService from '@/services/apiManagementService'
import JalaliDatePicker from '@/components/JalaliDatePicker.vue'

const props = defineProps({ section: { type: String, required: true } })
const section = computed(() => props.section)
const title = computed(() => ({ clients: 'مدیریت دسترسی‌ها', personnel: 'API پرسنل', hierarchy: 'API سلسله‌مراتب سازمانی', attendance: 'API کنترل تردد' }[section.value]))
const apiBase = (import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1`).replace(/\/$/, '')
const endpoint = computed(() => `${apiBase}/external/hr/${({ personnel: 'employees', hierarchy: 'org-chart', attendance: 'attendance' })[section.value]}`)
const requiredAbility = computed(() => ({ personnel: 'hr:employees:read', hierarchy: 'hr:hierarchy:read', attendance: 'hr:attendance:read' })[section.value])
const curlExample = computed(() => `curl -H "Accept: application/json" -H "Authorization: Bearer YOUR_TOKEN" "${endpoint.value}${section.value === 'personnel' ? '?per_page=25&unit_id=1' : ''}"`)
const clients = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const newToken = ref('')
const form = reactive({ name: '', abilities: [], expires_at: '' })

const scopeLabel = (scope) => scope === 'hr:employees:read' ? 'پرسنل' : scope === 'hr:hierarchy:read' ? 'سلسله‌مراتب' : scope
const formatDate = (value) => value ? new Date(value).toLocaleString('fa-IR') : '—'

async function loadClients() {
  if (section.value !== 'clients') return
  loading.value = true
  error.value = ''
  try { clients.value = await apiManagementService.listClients() }
  catch { error.value = 'دریافت فهرست دسترسی‌ها ناموفق بود.' }
  finally { loading.value = false }
}

async function createClient() {
  saving.value = true
  error.value = ''
  newToken.value = ''
  try {
    const payload = { name: form.name, abilities: form.abilities }
    if (form.expires_at) {
      const expiryAtEndOfDay = new Date(`${form.expires_at}T23:59:59`)
      payload.expires_at = expiryAtEndOfDay.toISOString()
    }
    const result = await apiManagementService.createClient(payload)
    newToken.value = result.token
    form.name = ''
    form.abilities = []
    form.expires_at = ''
    await loadClients()
  } catch { error.value = 'صدور توکن انجام نشد. مجوزها و اطلاعات واردشده را بررسی کنید.' }
  finally { saving.value = false }
}

async function revokeClient(client) {
  if (!window.confirm(`دسترسی «${client.name.replace(/^api-management:/, '')}» لغو شود؟`)) return
  try {
    await apiManagementService.revokeClient(client.id)
    clients.value = clients.value.filter((item) => item.id !== client.id)
  } catch { error.value = 'لغو دسترسی ناموفق بود.' }
}

async function copyToken() {
  await navigator.clipboard.writeText(newToken.value)
}

watch(section, loadClients, { immediate: true })
</script>

<style scoped>
.api-page{max-width:1180px;margin:0 auto;padding:32px 24px;color:#172033}.page-header,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:20px}.page-header{margin-bottom:24px}.eyebrow{margin:0 0 6px;color:#64748b;font-size:13px}.page-header h1{margin:0;font-size:25px}.subtitle,.section-heading p{color:#64748b;font-size:14px}.version,.scope-chip{display:inline-flex;padding:6px 10px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px}.panel{padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;box-shadow:0 4px 16px #0f172a08}.section-heading h2{margin:0;font-size:18px}.section-heading p{margin:6px 0 0}.create-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}.field{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:600}.field input:not([type=checkbox]){min-height:42px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:9px;font:inherit}.scopes-field label{font-weight:400}.scopes-field input{margin-left:7px}.primary-button,.secondary-button,.revoke-button{width:max-content;border:0;border-radius:8px;padding:10px 16px;cursor:pointer;font:inherit}.primary-button{background:#2563eb;color:#fff;align-self:end}.primary-button:disabled{opacity:.55;cursor:not-allowed}.secondary-button{background:#dbeafe;color:#1d4ed8}.revoke-button{background:#fff1f2;color:#be123c;padding:7px 11px}.token-alert{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-bottom:20px;padding:16px;border:1px solid #86efac;border-radius:10px;background:#f0fdf4;color:#166534}.token-alert strong{grid-column:1/-1}.token-alert code{overflow-wrap:anywhere;padding:10px;border-radius:6px;background:#fff;color:#14532d}.error-message{color:#b91c1c}.empty-state{padding:28px;text-align:center;color:#64748b}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:right}th,td{padding:13px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap}th{color:#475569;font-size:13px}.scope-chip{margin:2px}.doc-row{display:grid;grid-template-columns:180px 1fr;gap:14px;padding:16px 0;border-bottom:1px solid #e2e8f0}.doc-row>span{color:#64748b}.doc-row p{margin:0}.docs-panel h3{margin:24px 0 10px}pre{overflow:auto;padding:18px;border-radius:10px;background:#0f172a;color:#e2e8f0;line-height:1.8}.privacy-note{color:#64748b;font-size:13px}@media(max-width:700px){.api-page{padding:20px 14px}.create-form{grid-template-columns:1fr}.page-header,.section-heading{align-items:flex-start}.doc-row{grid-template-columns:1fr;gap:6px}.token-alert{grid-template-columns:1fr}.token-alert strong{grid-column:auto}}
</style>
