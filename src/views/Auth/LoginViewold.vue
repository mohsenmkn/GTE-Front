<template>
  <main class="auth-page" dir="rtl">
    <!-- ═════════════════════════════════════════════
         BACKGROUND (هماهنگ با dashboard-hero)
    ═════════════════════════════════════════════ -->
    <div class="auth-background" aria-hidden="true">
      <div class="auth-decoration auth-decoration-one"></div>
      <div class="auth-decoration auth-decoration-two"></div>
      <div class="auth-decoration auth-decoration-three"></div>
    </div>

    <section class="auth-shell">
      <div class="auth-card">
        <!-- ═════════════════════════════════════════════
             HEADER
        ═════════════════════════════════════════════ -->
        <header class="auth-header">
          <div class="brand-logo-wrapper">
            <img
                src="/images/ghettarabar-logo-light.png"
                alt="لوگوی شرکت گهرترابر"
                class="brand-logo"
            />
          </div>

          <div class="mt-5 text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <span class="auth-status"></span>
              <span class="text-xs text-slate-500">سامانه فعال است</span>
            </div>
            <h1 class="auth-title">سیستم یکپارچه گهرترابر</h1>
            <p class="auth-subtitle">
              برای ورود به حساب کاربری خود، اطلاعات زیر را وارد کنید.
            </p>
          </div>
        </header>

        <!-- ═════════════════════════════════════════════
             RESET SUCCESS ALERT
        ═════════════════════════════════════════════ -->
        <transition name="auth-fade">
          <div
              v-if="resetSuccess"
              class="auth-alert auth-alert-success"
              role="status"
          >
            <div class="auth-alert-icon">
              <i class="pi pi-check"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-sm">رمز عبور با موفقیت تغییر کرد.</p>
              <p class="text-xs mt-1 opacity-80">
                اکنون می‌توانید با رمز جدید وارد سامانه شوید.
              </p>
            </div>
            <button
                type="button"
                class="auth-alert-close"
                aria-label="بستن پیام"
                @click="resetSuccess = false"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
        </transition>

        <!-- ═════════════════════════════════════════════
             FORM
        ═════════════════════════════════════════════ -->
        <form class="auth-form" autocomplete="on" @submit.prevent="handleLogin">
          <!-- Mobile -->
          <div class="auth-field">
            <label for="mobile" class="auth-label">
              شماره موبایل
              <span class="text-rose-500 mr-0.5">*</span>
            </label>
            <div
                class="auth-input-wrapper"
                :class="{ 'auth-input-error': mobileError }"
            >
              <i class="pi pi-mobile auth-input-icon"></i>
              <InputText
                  id="mobile"
                  v-model="mobile"
                  type="tel"
                  inputmode="numeric"
                  autocomplete="username"
                  dir="ltr"
                  maxlength="11"
                  placeholder="09123456789"
                  class="auth-input"
                  :invalid="!!mobileError"
                  @input="normalizeMobile"
              />
            </div>
            <transition name="auth-fade">
              <small v-if="mobileError" class="auth-field-error">
                <i class="pi pi-exclamation-circle"></i>
                {{ mobileError }}
              </small>
            </transition>
            <small v-if="!mobileError" class="auth-field-hint">
              شماره موبایل ثبت‌شده در سامانه را وارد کنید.
            </small>
          </div>

          <!-- Password -->
          <div class="auth-field">
            <div class="flex items-center justify-between mb-2">
              <label for="password" class="auth-label mb-0">
                رمز عبور
                <span class="text-rose-500 mr-0.5">*</span>
              </label>
            </div>
            <div
                class="auth-input-wrapper"
                :class="{
                'auth-input-error': errorMessage,
                'auth-input-highlight': shouldHighlightPassword
              }"
            >
              <i class="pi pi-lock auth-input-icon"></i>
              <Password
                  ref="passwordRef"
                  id="password"
                  v-model="password"
                  :feedback="false"
                  toggleMask
                  autocomplete="current-password"
                  inputClass="auth-input auth-password-input"
                  class="w-full"
                  :invalid="!!errorMessage"
                  fluid
              />
            </div>
            <transition name="auth-fade">
              <div v-if="shouldHighlightPassword" class="auth-info-hint">
                <i class="pi pi-info-circle"></i>
                <span>رمز عبور جدید خود را وارد کنید.</span>
              </div>
            </transition>
          </div>

          <!-- Captcha -->
          <transition name="auth-slide">
            <div v-if="requireCaptcha" class="auth-captcha">
              <div class="auth-captcha-header">
                <div class="flex items-center gap-2">
                  <div class="auth-captcha-icon">
                    <i class="pi pi-shield"></i>
                  </div>
                  <div>
                    <p class="auth-captcha-title">تأیید امنیتی</p>
                    <p class="auth-captcha-desc">کد داخل تصویر را وارد کنید.</p>
                  </div>
                </div>
                <button
                    type="button"
                    class="auth-captcha-refresh"
                    title="تصویر جدید"
                    aria-label="دریافت تصویر امنیتی جدید"
                    :disabled="loading"
                    @click="fetchCaptcha"
                >
                  <i class="pi pi-refresh"></i>
                </button>
              </div>
              <div class="auth-captcha-content">
                <button
                    type="button"
                    class="auth-captcha-image-btn"
                    :disabled="loading"
                    @click="fetchCaptcha"
                >
                  <img
                      v-if="captchaImg"
                      :src="captchaImg"
                      alt="کد امنیتی"
                      class="auth-captcha-image"
                  />
                  <div v-else class="auth-captcha-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                  </div>
                </button>
                <InputText
                    v-model="captchaInput"
                    inputmode="numeric"
                    autocomplete="off"
                    maxlength="10"
                    placeholder="کد امنیتی"
                    class="auth-input auth-captcha-input"
                    :disabled="loading"
                />
              </div>
            </div>
          </transition>

          <!-- Error -->
          <transition name="auth-fade">
            <div v-if="errorMessage" class="auth-alert auth-alert-error" role="alert">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ errorMessage }}</span>
            </div>
          </transition>

          <!-- Forgot Password -->
          <div class="auth-forgot-row">
            <router-link to="/forgot-password" class="auth-forgot-link">
              <i class="pi pi-key"></i>
              <span>رمز عبور خود را فراموش کرده‌اید؟</span>
            </router-link>
          </div>

          <!-- Submit -->
          <Button
              type="submit"
              class="auth-submit"
              :loading="loading"
              :disabled="loading"
          >
            <template #default>
              <span v-if="!loading">ورود به سامانه</span>
              <span v-else>در حال ورود...</span>
              <i v-if="!loading" class="pi pi-arrow-left mr-2"></i>
            </template>
          </Button>
        </form>

        <!-- ═════════════════════════════════════════════
             FOOTER
        ═════════════════════════════════════════════ -->
        <footer class="auth-footer">
          <div class="auth-footer-divider">
            <span></span>
            <i class="pi pi-shield"></i>
            <span></span>
          </div>
          <p>دسترسی شما به سامانه به‌صورت امن مدیریت می‌شود.</p>
          <p class="auth-footer-brand">سیستم یکپارچه گهرترابر</p>
        </footer>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authold.js'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import axios from 'axios'
import { useApiErrorHandler } from '@/composables/useApiErrorHandler'

/* ═════════════════════════════════════════════
   Router / Store
═════════════════════════════════════════════ */
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { handleApiError } = useApiErrorHandler()

/* ═════════════════════════════════════════════
   Config
═════════════════════════════════════════════ */
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    'https://apiomrani.gttmco.ir/api/v1'

/* ═════════════════════════════════════════════
   Form State
═════════════════════════════════════════════ */
const mobile = ref('')
const password = ref('')
const mobileError = ref('')
const errorMessage = ref('')
const loading = ref(false)
const passwordRef = ref(null)

/* ═════════════════════════════════════════════
   Reset Password State
═════════════════════════════════════════════ */
const resetSuccess = ref(false)
const shouldHighlightPassword = ref(false)

/* ═════════════════════════════════════════════
   Captcha
═════════════════════════════════════════════ */
const requireCaptcha = ref(false)
const captchaImg = ref('')
const captchaKey = ref('')
const captchaInput = ref('')

/* ═════════════════════════════════════════════
   Mobile Normalization
═════════════════════════════════════════════ */
const normalizeMobile = () => {
  mobile.value = mobile.value
      .replace(/[۰-۹]/g, digit => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
      .replace(/\D/g, '')
      .slice(0, 11)

  if (mobileError.value) validateMobile()
}

/* ═════════════════════════════════════════════
   Validation
═════════════════════════════════════════════ */
const validateMobile = () => {
  if (!mobile.value) {
    mobileError.value = 'شماره موبایل را وارد کنید.'
    return false
  }
  if (!/^09\d{9}$/.test(mobile.value)) {
    mobileError.value = 'شماره موبایل باید با 09 شروع شده و 11 رقم باشد.'
    return false
  }
  mobileError.value = ''
  return true
}

/* ═════════════════════════════════════════════
   Captcha
═════════════════════════════════════════════ */
const fetchCaptcha = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/captcha`)
    captchaImg.value = response.data.img
    captchaKey.value = response.data.key
    captchaInput.value = ''
  } catch (error) {
    console.error('خطا در دریافت کپچا:', error)
    errorMessage.value = 'دریافت تصویر امنیتی با خطا مواجه شد. دوباره تلاش کنید.'
  }
}

/* ═════════════════════════════════════════════
   Login
═════════════════════════════════════════════ */
const handleLogin = async () => {
  errorMessage.value = ''

  if (!validateMobile()) return

  if (!password.value) {
    errorMessage.value = 'رمز عبور را وارد کنید.'
    focusOnPassword()
    return
  }

  if (requireCaptcha.value && !captchaInput.value.trim()) {
    errorMessage.value = 'لطفاً کد امنیتی را وارد کنید.'
    return
  }

  loading.value = true

  try {
    const payload = {
      mobile: mobile.value,
      password: password.value
    }

    if (requireCaptcha.value) {
      payload.captcha = captchaInput.value.trim()
      payload.captcha_key = captchaKey.value
    }

    await authStore.login(payload)
    router.push({ name: 'Dashboard' })
  } catch (error) {
    handleApiError(error, {
      setErrors: validationErrors => {
        errorMessage.value = validationErrors
      }
    })

    if (error.response?.status === 429 && error.response?.data?.locked === true) {
      errorMessage.value = error.response.data.message || 'این حساب و مرورگر برای ۵ دقیقه موقتاً مسدود شده است.'
      requireCaptcha.value = false
      captchaInput.value = ''
    } else if (error.response?.status === 429) {
      requireCaptcha.value = true
      await fetchCaptcha()
    } else if (error.response?.status === 400 && requireCaptcha.value) {
      await fetchCaptcha()
    }
  } finally {
    loading.value = false
  }
}

/* ═════════════════════════════════════════════
   Password Focus
═════════════════════════════════════════════ */
const focusOnPassword = () => {
  nextTick(() => {
    const inputElement = passwordRef.value?.$el?.querySelector('input')
    if (inputElement) {
      inputElement.focus()
      inputElement.select()
    }
  })
}

/* ═════════════════════════════════════════════
   Mounted
═════════════════════════════════════════════ */
onMounted(() => {
  const queryMobile = route.query.mobile
  const isFromReset = route.query.reset === 'success'

  if (queryMobile) mobile.value = String(queryMobile)

  if (isFromReset) {
    resetSuccess.value = true
    shouldHighlightPassword.value = true

    nextTick(() => {
      setTimeout(() => focusOnPassword(), 350)
    })

    router.replace({ path: '/login' })
    setTimeout(() => (shouldHighlightPassword.value = false), 5000)
  }
})

/* ═════════════════════════════════════════════
   Watchers
═════════════════════════════════════════════ */
watch(mobile, () => {
  if (shouldHighlightPassword.value) shouldHighlightPassword.value = false
  if (mobileError.value) validateMobile()
})
</script>

<style scoped>
/* ═════════════════════════════════════════════
   PAGE (هماهنگ با dashboard-page)
═════════════════════════════════════════════ */
.auth-page {
  @apply relative min-h-[100dvh] flex items-center justify-center
  overflow-hidden py-8 px-5;
  background: linear-gradient(
      135deg,
      rgb(238 242 255),
      rgb(248 250 252) 55%,
      rgb(245 243 255)
  );
  animation: auth-enter 0.45s ease-out;
}

/* ═════════════════════════════════════════════
   BACKGROUND DECORATIONS (مشابه hero-decoration)
═════════════════════════════════════════════ */
.auth-background {
  @apply absolute inset-0 pointer-events-none overflow-hidden;
}

.auth-decoration {
  @apply absolute rounded-full pointer-events-none;
  filter: blur(60px);
}

.auth-decoration-one {
  width: 280px;
  height: 280px;
  background: rgb(129 140 248 / 14%);
  top: -120px;
  left: -80px;
}

.auth-decoration-two {
  width: 240px;
  height: 240px;
  background: rgb(167 139 250 / 14%);
  bottom: -110px;
  right: -70px;
}

.auth-decoration-three {
  width: 180px;
  height: 180px;
  background: rgb(99 102 241 / 10%);
  top: 40%;
  right: 20%;
}

/* ═════════════════════════════════════════════
   SHELL / CARD (مشابه dashboard-card)
═════════════════════════════════════════════ */
.auth-shell {
  @apply relative z-10 w-full max-w-[470px];
}

.auth-card {
  @apply bg-white rounded-3xl overflow-hidden
  border border-slate-200/70;
  box-shadow:
      0 20px 50px rgb(79 70 229 / 8%),
      0 4px 12px rgb(15 23 42 / 4%);
}

/* ═════════════════════════════════════════════
   HEADER
═════════════════════════════════════════════ */
.auth-header {
  @apply px-9 pt-9 pb-6 text-center;
}

.brand-logo-wrapper {
  @apply mx-auto flex items-center justify-center
  w-[220px] h-[120px];
}

.brand-logo {
  @apply w-full h-full object-contain;
}

.auth-status {
  @apply w-2 h-2 rounded-full bg-emerald-500;
  box-shadow: 0 0 0 4px rgb(16 185 129 / 10%);
}

.auth-title {
  @apply text-2xl font-bold text-slate-800 tracking-tight;
}

.auth-subtitle {
  @apply text-sm text-slate-500 mt-2 max-w-sm mx-auto;
}

/* ═════════════════════════════════════════════
   FORM
═════════════════════════════════════════════ */
.auth-form {
  @apply px-9 pb-7;
}

.auth-field {
  @apply mb-5;
}

.auth-label {
  @apply block mb-2 text-sm font-bold text-slate-700;
}

.auth-input-wrapper {
  @apply relative;
}

.auth-input-icon {
  @apply absolute z-10 top-1/2 right-3.5 -translate-y-1/2
  text-slate-400 pointer-events-none
  transition-colors;
}

.auth-input-wrapper:focus-within .auth-input-icon {
  @apply text-indigo-600;
}

.auth-input {
  @apply w-full min-h-[48px] px-3 py-2.5
  bg-white border border-slate-200 rounded-xl
  text-slate-800 text-sm
  transition-all duration-200 !important;
}

.auth-input:hover {
  @apply border-slate-300 !important;
}

.auth-input:focus {
  @apply border-indigo-500 outline-none !important;
  box-shadow: 0 0 0 3px rgb(99 102 241 / 12%) !important;
}

.auth-input::placeholder {
  @apply text-slate-400 !important;
}

.auth-password-input {
  @apply pr-10 pl-11 !important;
}

.auth-input-error .auth-input {
  @apply border-rose-400 !important;
}

.auth-input-error .auth-input:focus {
  box-shadow: 0 0 0 3px rgb(244 63 94 / 12%) !important;
}

.auth-input-highlight .auth-input {
  @apply border-indigo-500 !important;
  box-shadow: 0 0 0 4px rgb(99 102 241 / 15%) !important;
}

.auth-field-hint {
  @apply block mt-1.5 text-[11px] text-slate-400;
}

.auth-field-error {
  @apply flex items-center gap-1 mt-1.5
  text-[11px] text-rose-600;
}

.auth-info-hint {
  @apply flex items-center gap-1.5 mt-2
  text-[11px] text-indigo-600;
}

/* ═════════════════════════════════════════════
   CAPTCHA
═════════════════════════════════════════════ */
.auth-captcha {
  @apply mb-5 p-4 rounded-2xl
  bg-gradient-to-br from-indigo-50/60 to-white
  border border-indigo-100/70;
}

.auth-captcha-header {
  @apply flex items-center justify-between gap-3 mb-3;
}

.auth-captcha-icon {
  @apply w-9 h-9 rounded-xl
  bg-indigo-100 border border-indigo-200
  flex items-center justify-center
  text-indigo-600;
}

.auth-captcha-title {
  @apply text-xs font-bold text-slate-700;
}

.auth-captcha-desc {
  @apply text-[10px] text-slate-500 mt-0.5;
}

.auth-captcha-refresh {
  @apply w-9 h-9 flex items-center justify-center
  rounded-xl border border-slate-200
  bg-white text-slate-500
  transition-all duration-200
  hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50;
}

.auth-captcha-content {
  @apply flex items-stretch gap-2.5;
}

.auth-captcha-image-btn {
  @apply w-[145px] min-w-[145px] h-12 overflow-hidden
  rounded-xl border border-slate-200 bg-white
  cursor-pointer transition-all
  hover:border-indigo-300;
}

.auth-captcha-image {
  @apply w-full h-full object-contain;
}

.auth-captcha-loading {
  @apply h-full flex items-center justify-center text-slate-400;
}

.auth-captcha-input {
  @apply flex-1 text-center !important;
}

/* ═════════════════════════════════════════════
   ALERTS
═════════════════════════════════════════════ */
.auth-alert {
  @apply flex items-center gap-2.5
  rounded-xl text-xs px-3.5 py-3 mb-4;
}

.auth-alert-error {
  @apply bg-rose-50 border border-rose-100 text-rose-700;
}

.auth-alert-success {
  @apply mx-9 mb-5 bg-emerald-50 border border-emerald-100 text-emerald-700;
}

.auth-alert-icon {
  @apply w-8 h-8 min-w-[32px] rounded-lg
  bg-emerald-100 flex items-center justify-center
  text-emerald-600;
}

.auth-alert-close {
  @apply mr-auto text-emerald-400 transition-colors
  hover:text-emerald-700;
}

/* ═════════════════════════════════════════════
   FORGOT PASSWORD
═════════════════════════════════════════════ */
.auth-forgot-row {
  @apply flex justify-start my-0.5 mb-4;
}

.auth-forgot-link {
  @apply inline-flex items-center gap-1.5
  text-xs font-semibold text-indigo-600
  transition-colors
  hover:text-indigo-700 hover:underline;
}

/* ═════════════════════════════════════════════
   SUBMIT BUTTON (هماهنگ با Dashboard)
═════════════════════════════════════════════ */
.auth-submit {
  @apply w-full min-h-[50px]
  rounded-xl border-0
  text-white text-sm font-bold
  transition-all duration-200 !important;
  background: linear-gradient(120deg, #6366f1, #8b5cf6) !important;
  box-shadow: 0 8px 20px rgb(99 102 241 / 25%) !important;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  background: linear-gradient(120deg, #4f46e5, #7c3aed) !important;
  box-shadow: 0 12px 26px rgb(99 102 241 / 32%) !important;
}

.auth-submit:active:not(:disabled) {
  transform: translateY(0);
}

/* ═════════════════════════════════════════════
   FOOTER
═════════════════════════════════════════════ */
.auth-footer {
  @apply px-9 pb-7 text-center text-[10px] leading-relaxed text-slate-400;
}

.auth-footer-divider {
  @apply flex items-center gap-2.5 mb-2.5;
}

.auth-footer-divider span {
  @apply h-px flex-1 bg-slate-200;
}

.auth-footer-divider i {
  @apply text-slate-400 text-[11px];
}

.auth-footer-brand {
  @apply mt-0.5 text-slate-600 font-semibold;
}

/* ═════════════════════════════════════════════
   TRANSITIONS
═════════════════════════════════════════════ */
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: all 0.22s ease;
}

.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.auth-slide-enter-active,
.auth-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.auth-slide-enter-from,
.auth-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ═════════════════════════════════════════════
   ANIMATION
═════════════════════════════════════════════ */
@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ═════════════════════════════════════════════
   RESPONSIVE
═════════════════════════════════════════════ */
@media (max-width: 640px) {
  .auth-page {
    @apply items-start pt-7 px-4;
  }

  .auth-card {
    @apply rounded-[22px];
  }

  .auth-header {
    @apply px-5 pt-7 pb-5;
  }

  .auth-form {
    @apply px-5 pb-6;
  }

  .auth-footer {
    @apply px-5 pb-6;
  }

  .auth-alert-success {
    @apply mx-5;
  }

  .auth-title {
    @apply text-xl;
  }

  .auth-captcha-content {
    @apply flex-col;
  }

  .auth-captcha-image-btn {
    @apply w-full;
  }

  .brand-logo-wrapper {
    @apply w-[180px] h-[95px];
  }
}

@media (max-width: 380px) {
  .auth-page {
    @apply py-2.5 px-2.5;
  }

  .auth-header {
    @apply px-4 pt-6 pb-4;
  }

  .auth-form {
    @apply px-4 pb-5;
  }

  .auth-footer {
    @apply px-4 pb-5;
  }

  .auth-alert-success {
    @apply mx-4;
  }
}

/* ═════════════════════════════════════════════
   REDUCED MOTION
═════════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
