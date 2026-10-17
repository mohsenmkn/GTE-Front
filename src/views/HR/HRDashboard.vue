<template>
  <div class="hr-dashboard" dir="rtl">
    <!-- ═════════════════════════════════════════════
         HERO — منطبق با Dashboard.vue
    ═════════════════════════════════════════════ -->
    <section class="dashboard-hero">
      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>

      <div class="relative z-10">
        <div
            class="flex flex-col gap-6
                 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- هویت صفحه -->
          <div class="flex items-start gap-4">
            <div class="hero-icon tone-indigo">
              <i class="pi pi-chart-pie"></i>
            </div>

            <div class="min-w-0">
              <div class="mb-2 flex items-center gap-2">
                <span
                    class="hero-status"
                    :class="systemState.tone"
                ></span>
                <span class="text-xs text-slate-500">
                  {{ systemState.text }}
                </span>
              </div>

              <h1 class="hero-title">
                داشبورد مدیریتی منابع انسانی
              </h1>

              <p class="hero-subtitle">
                تحلیل استراتژیک نیروی کار، ساختار سازمانی، آموزش و ارزیابی شایستگی
              </p>

              <div class="mt-4 flex flex-wrap items-center gap-3">
                <div class="hero-meta">
                  <i class="pi pi-calendar"></i>
                  <span>{{ todayDate }}</span>
                </div>

                <span class="text-slate-300">•</span>

                <div class="hero-meta">
                  <i class="pi pi-clock"></i>
                  <span>{{ currentTime }}</span>
                </div>

                <span
                    v-if="lastLoadedAt"
                    class="text-slate-300"
                >
                  •
                </span>

                <div
                    v-if="lastLoadedAt"
                    class="hero-meta"
                >
                  <i class="pi pi-refresh"></i>
                  <span>به‌روزرسانی {{ formatTime(lastLoadedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- کنش‌های صفحه -->
          <div class="hero-actions flex flex-wrap items-center gap-3">
            <div class="hero-health">
              <span class="icon-box tone-slate !h-9 !w-9 !text-base">
                <i class="pi pi-database"></i>
              </span>
              <div class="text-right">
                <p class="text-[10px] text-slate-400">
                  آخرین همگام‌سازی
                </p>
                <p class="mt-0.5 text-xs font-semibold text-slate-600">
                  {{ lastSyncText }}
                </p>
              </div>
            </div>

            <Button
                label="بروزرسانی"
                icon="pi pi-refresh"
                :loading="loading"
                severity="secondary"
                outlined
                size="small"
                @click="loadDashboard"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═════════════════════════════════════════════
         ERROR
    ═════════════════════════════════════════════ -->
    <div
        v-if="errorMessage"
        class="error-banner"
        role="alert"
    >
      <span class="error-banner-icon">
        <i class="pi pi-exclamation-triangle"></i>
      </span>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-bold text-rose-700">
          دریافت اطلاعات داشبورد موفقیت‌آمیز نبود
        </p>
        <p class="mt-1 text-xs leading-6 text-rose-500">
          {{ errorMessage }}
        </p>
      </div>

      <Button
          label="تلاش مجدد"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          outlined
          @click="loadDashboard"
      />

      <button
          type="button"
          class="icon-button"
          aria-label="بستن پیام خطا"
          @click="errorMessage = ''"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- ═════════════════════════════════════════════
         LOADING
    ═════════════════════════════════════════════ -->
    <div
        v-if="loading && !data"
        class="space-y-5"
        aria-busy="true"
        aria-label="در حال دریافت اطلاعات داشبورد"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div
            v-for="i in 6"
            :key="`kpi-skeleton-${i}`"
            class="kpi-card"
        >
          <div class="flex items-center justify-between">
            <div class="skeleton h-10 w-10 !rounded-xl"></div>
            <div class="skeleton h-4 w-16 !rounded-full"></div>
          </div>
          <div class="skeleton mt-4 h-3 w-2/3"></div>
          <div class="skeleton mt-3 h-7 w-1/2"></div>
          <div class="skeleton mt-4 h-2 w-full !rounded-full"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div
            v-for="i in 2"
            :key="`chart-skeleton-${i}`"
            class="dashboard-card p-5"
        >
          <div class="flex items-center gap-3">
            <div class="skeleton h-10 w-10 !rounded-xl"></div>
            <div class="skeleton h-4 w-40"></div>
          </div>
          <div class="skeleton mt-6 h-64 w-full !rounded-xl"></div>
        </div>
      </div>
    </div>

    <template v-else-if="data">
      <!-- ═══════════════════════════════════════════
           SECTION NAV
      ═══════════════════════════════════════════ -->
      <nav
          class="section-nav"
          aria-label="بخش‌های داشبورد"
      >
        <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            class="nav-chip"
            :class="{ 'is-active': activeSection === section.id }"
            :aria-current="
            activeSection === section.id ? 'location' : undefined
          "
            @click="scrollToSection(section.id)"
        >
          <i :class="`pi ${section.icon}`"></i>
          <span>{{ section.short }}</span>

          <span
              v-if="section.count > 0"
              class="nav-count"
          >
            {{ fmt(section.count) }}
          </span>
        </button>
      </nav>

      <!-- ═══════════════════════════════════════════
           01 — KPI
      ═══════════════════════════════════════════ -->
      <section
          id="hr-overview"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۱</span>
            <div>
              <h2 class="section-title">شاخص‌های کلیدی عملکرد</h2>
              <p class="section-caption">
                تصویر لحظه‌ای از وضعیت نیروی کار و توسعه شایستگی
              </p>
            </div>
          </div>

          <span class="soft-badge">
            <i class="pi pi-chart-line"></i>
            نمای مدیریتی
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article
              v-for="item in kpiCards"
              :key="item.key"
              class="kpi-card"
              :class="[`tone-${item.tone}`, { 'is-alert': item.alert }]"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="icon-box">
                <i :class="`pi ${item.icon}`"></i>
              </span>

              <span
                  v-if="item.alert"
                  class="pill pill-warning"
              >
                <i class="pi pi-exclamation-circle"></i>
                نیازمند توجه
              </span>

              <i
                  v-else
                  class="pi pi-arrow-up-left kpi-watermark"
              ></i>
            </div>

            <div class="mt-4">
              <p class="kpi-label">{{ item.label }}</p>

              <div class="mt-1.5 flex items-baseline gap-1.5">
                <strong class="kpi-value">{{ item.value }}</strong>
                <span
                    v-if="item.unit"
                    class="kpi-unit"
                >
                  {{ item.unit }}
                </span>
              </div>
            </div>

            <div
                v-if="item.progress !== null"
                class="kpi-progress"
                role="progressbar"
                :aria-label="item.label"
                :aria-valuenow="item.progress"
                aria-valuemin="0"
                aria-valuemax="100"
            >
              <span
                  class="kpi-progress-bar"
                  :style="{ width: `${item.progress}%` }"
              ></span>
            </div>

            <p class="kpi-foot">
              <i :class="`pi ${item.footIcon}`"></i>
              <span>{{ item.hint }}</span>
            </p>
          </article>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           03 — STRUCTURE
      ═══════════════════════════════════════════ -->
      <section
          id="hr-structure"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۳</span>
            <div>
              <h2 class="section-title">ساختار سازمانی و نیروی کار</h2>
              <p class="section-caption">
                توزیع پرسنل، پوشش سمت‌ها و شاخص‌های ساختاری سازمان
              </p>
            </div>
          </div>

          <span class="soft-badge">
            <i class="pi pi-building"></i>
            {{ fmt(data.organization.units.active) }} واحد فعال
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <!-- توزیع پرسنل -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-indigo !h-9 !w-9 !text-base">
                  <i class="pi pi-users"></i>
                </span>
                <div>
                  <h3 class="panel-title">توزیع پرسنل در واحدها</h3>
                  <p class="panel-subtitle">۱۰ واحد برتر بر اساس تعداد پرسنل</p>
                </div>
              </div>
              <span class="soft-badge">نفراز</span>
            </header>

            <div class="panel-body flex-1">
              <div class="chart-box chart-tall">
                <Chart
                    type="bar"
                    :data="employeesByUnitChart"
                    :options="horizontalBarOptions"
                />
                <div
                    v-if="!chartHasData('employees_by_unit')"
                    class="chart-empty"
                >
                  <i class="pi pi-chart-bar"></i>
                  <span>داده‌ای برای نمایش وجود ندارد</span>
                </div>
              </div>
            </div>
          </article>

          <!-- پوشش سمت‌ها -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-emerald !h-9 !w-9 !text-base">
                  <i class="pi pi-sitemap"></i>
                </span>
                <div>
                  <h3 class="panel-title">پوشش سمت‌ها به تفکیک واحد</h3>
                  <p class="panel-subtitle">مقایسه سمت‌های تکمیل‌شده و خالی</p>
                </div>
              </div>
              <span class="soft-badge">
                <i class="pi pi-layer-group"></i>
                انباشته
              </span>
            </header>

            <div class="panel-body flex-1">
              <div class="chart-box chart-tall">
                <Chart
                    type="bar"
                    :data="positionCoverageChart"
                    :options="stackedBarOptions"
                />
                <div
                    v-if="!chartHasData('position_coverage')"
                    class="chart-empty"
                >
                  <i class="pi pi-chart-bar"></i>
                  <span>داده‌ای برای نمایش وجود ندارد</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <!-- ترکیب نیروی کار -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-violet !h-9 !w-9 !text-base">
                  <i class="pi pi-users"></i>
                </span>
                <div>
                  <h3 class="panel-title">ترکیب نیروی کار</h3>
                  <p class="panel-subtitle">سهم هر گروه از کل پرسنل</p>
                </div>
              </div>
            </header>

            <div class="panel-body flex-1">
              <div class="chart-box">
                <Chart
                    type="doughnut"
                    :data="workforceChart"
                    :options="doughnutOptions"
                />
                <div
                    v-if="!chartHasData('workforce_composition')"
                    class="chart-empty"
                >
                  <i class="pi pi-chart-pie"></i>
                  <span>اطلاعات نیروی کار ثبت نشده است</span>
                </div>
              </div>
            </div>
          </article>

          <!-- سابقه خدمت -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-indigo !h-9 !w-9 !text-base">
                  <i class="pi pi-history"></i>
                </span>
                <div>
                  <h3 class="panel-title">توزیع سابقه خدمت</h3>
                  <p class="panel-subtitle">گروه‌بندی پرسنل بر اساس سنوات</p>
                </div>
              </div>
            </header>

            <div class="panel-body flex-1">
              <div class="chart-box">
                <Chart
                    type="bar"
                    :data="tenureChart"
                    :options="verticalBarOptions"
                />
                <div
                    v-if="!chartHasData('tenure_distribution')"
                    class="chart-empty"
                >
                  <i class="pi pi-chart-bar"></i>
                  <span>اطلاعات سابقه خدمت موجود نیست</span>
                </div>
              </div>
            </div>
          </article>

          <!-- شاخص‌های ساختاری -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-slate !h-9 !w-9 !text-base">
                  <i class="pi pi-network"></i>
                </span>
                <div>
                  <h3 class="panel-title">شاخص‌های ساختاری</h3>
                  <p class="panel-subtitle">گزارش سریع از وضعیت تشکیلات</p>
                </div>
              </div>
            </header>

            <div class="panel-body flex-1">
              <ul class="space-y-2">
                <li
                    v-for="stat in structureStats"
                    :key="stat.label"
                    class="stat-row"
                >
                  <span class="flex items-center gap-2 text-xs text-slate-500">
                    <i :class="`pi ${stat.icon} text-slate-400`"></i>
                    {{ stat.label }}
                  </span>

                  <span class="flex items-baseline gap-1">
                    <strong class="text-sm font-extrabold text-slate-800">
                      {{ stat.value }}
                    </strong>
                    <small
                        v-if="stat.unit"
                        class="text-[10px] text-slate-400"
                    >
                      {{ stat.unit }}
                    </small>
                  </span>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           04 — TRAINING & COMPETENCY
      ═══════════════════════════════════════════ -->
      <section
          id="hr-development"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۴</span>
            <div>
              <h2 class="section-title">آموزش و توسعه شایستگی</h2>
              <p class="section-caption">
                روند یادگیری سازمان، وضعیت ارزیابی و شکاف‌های مهارتی
              </p>
            </div>
          </div>

          <span class="soft-badge">
            <i class="pi pi-calendar"></i>
            ۱۲ ماه اخیر
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <!-- روند آموزش + خلاصه -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-indigo !h-9 !w-9 !text-base">
                  <i class="pi pi-graduation-cap"></i>
                </span>
                <div>
                  <h3 class="panel-title">روند دوره‌های آموزشی</h3>
                  <p class="panel-subtitle">
                    تعداد دوره و ساعات آموزش در بازه زمانی
                  </p>
                </div>
              </div>
              <span class="soft-badge">
                <i class="pi pi-chart-line"></i>
                روند ماهانه
              </span>
            </header>

            <div class="panel-body flex flex-1 flex-col">
              <div class="chart-box chart-tall">
                <Chart
                    type="line"
                    :data="trainingTrendChart"
                    :options="lineOptions"
                />
                <div
                    v-if="!chartHasData('training_trend')"
                    class="chart-empty"
                >
                  <i class="pi pi-book"></i>
                  <span>در این بازه دوره‌ای ثبت نشده است</span>
                </div>
              </div>

              <!-- آمار آموزش: ادغام‌شده در پنل -->
              <div class="training-summary">
                <div
                    v-for="metric in trainingMetrics"
                    :key="metric.label"
                    class="training-summary-item"
                    :class="`tone-${metric.tone}`"
                >
                  <div class="flex items-center gap-2">
                    <i
                        :class="`pi ${metric.icon}`"
                        class="text-sm"
                        :style="{ color: 'var(--tone-fg)' }"
                    ></i>
                    <span class="text-[10px] text-slate-400">
                      {{ metric.label }}
                    </span>
                  </div>
                  <strong class="mt-1.5 block text-lg font-extrabold text-slate-800">
                    {{ metric.value }}
                  </strong>
                </div>
              </div>
            </div>
          </article>

          <!-- ارزیابی و گپ -->
          <article class="dashboard-card flex h-full flex-col">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-emerald !h-9 !w-9 !text-base">
                  <i class="pi pi-clipboard-check"></i>
                </span>
                <div>
                  <h3 class="panel-title">ارزیابی شایستگی و گپ‌های مهارتی</h3>
                  <p class="panel-subtitle">
                    وضعیت چرخه ارزیابی و اقدامات اصلاحی
                  </p>
                </div>
              </div>
            </header>

            <div class="panel-body flex flex-1 flex-col">
              <div class="chart-box !h-[190px]">
                <Chart
                    type="doughnut"
                    :data="assessmentStatusChart"
                    :options="doughnutOptions"
                />
                <div
                    v-if="!hasAssessmentData"
                    class="chart-empty"
                >
                  <i class="pi pi-clipboard"></i>
                  <span>ارزیابی‌ای ثبت نشده است</span>
                </div>
              </div>

              <!-- گپ‌ها -->
              <div class="mt-4 grid grid-cols-3 gap-2">
                <div
                    v-for="gap in gapItems"
                    :key="gap.key"
                    class="gap-chip"
                    :class="`tone-${gap.tone}`"
                >
                  <i
                      :class="`pi ${gap.icon}`"
                      class="text-base"
                      :style="{ color: 'var(--tone-fg)' }"
                  ></i>
                  <strong
                      class="block text-xl font-extrabold"
                      :style="{ color: 'var(--tone-fg)' }"
                  >
                    {{ gap.value }}
                  </strong>
                  <span class="mt-0.5 block text-[10px] text-slate-500">
                    {{ gap.label }}
                  </span>
                </div>
              </div>

              <!-- اقدامات -->
              <div class="action-summary">
                <p class="mb-2 flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                  <i class="pi pi-list-check text-slate-400"></i>
                  وضعیت اقدامات اصلاحی
                </p>

                <div
                    v-for="action in assessmentActions"
                    :key="action.label"
                    class="action-row"
                >
                  <span class="flex items-center gap-2 text-xs text-slate-500">
                    <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="action.dot"
                    ></span>
                    {{ action.label }}
                  </span>
                  <strong
                      class="text-xs font-bold"
                      :class="action.textClass"
                  >
                    {{ action.value }}
                  </strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           05 — ALERTS
      ═══════════════════════════════════════════ -->
      <section
          id="hr-alerts"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۵</span>
            <div>
              <h2 class="section-title">هشدارها و اقدامات فوری</h2>
              <p class="section-caption">
                مواردی که نیاز به تصمیم یا پیگیری مدیریت دارند
              </p>
            </div>
          </div>

          <span
              class="soft-badge"
              :class="alertCount > 0 ? 'badge-danger' : 'badge-success'"
          >
            <i :class="alertCount > 0 ? 'pi pi-bell' : 'pi pi-check-circle'"></i>
            {{ alertCount > 0 ? `${fmt(alertCount)} مورد قابل پیگیری` : 'همه موارد پایدار' }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <!-- سمت‌های خالی -->
          <article
              class="dashboard-card"
              :class="{ 'panel-danger': data.alerts.critical_vacancies.length > 0 }"
          >
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-rose !h-9 !w-9 !text-base">
                  <i class="pi pi-briefcase"></i>
                </span>
                <div>
                  <h3 class="panel-title">سمت‌های خالی</h3>
                  <p class="panel-subtitle">
                    {{ fmt(data.kpis.vacant_positions) }} سمت تکمیل‌نشده در سازمان
                  </p>
                </div>
              </div>
              <span
                  v-if="data.kpis.vacant_positions > 0"
                  class="pill pill-danger"
              >
                {{ fmt(data.kpis.vacant_positions) }} سمت
              </span>
            </header>

            <ul
                v-if="data.alerts.critical_vacancies.length"
                class="alert-list"
                tabindex="0"
                aria-label="فهرست سمت‌های خالی"
            >
              <li
                  v-for="vacancy in data.alerts.critical_vacancies"
                  :key="vacancy.id"
                  class="alert-item"
              >
                <span class="item-avatar tone-rose">
                  <i class="pi pi-briefcase"></i>
                </span>

                <div class="min-w-0 flex-1">
                  <p class="item-title">{{ vacancy.title }}</p>
                  <p class="item-sub">
                    {{ vacancy.unit }}
                    <span v-if="vacancy.job_title">
                      • {{ vacancy.job_title }}
                    </span>
                  </p>
                </div>

                <span
                    class="pill"
                    :class="vacancy.is_custom ? 'pill-warning' : 'pill-danger'"
                >
                  {{ vacancy.is_custom ? 'سفارشی' : 'سازمانی' }}
                </span>
              </li>
            </ul>

            <div v-else class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>همه سمت‌ها تکمیل شده‌اند</p>
              <span>وضعیت پوشش تشکیلات مطلوب است.</span>
            </div>
          </article>

          <!-- اقدامات معوق -->
          <article
              class="dashboard-card"
              :class="{ 'panel-danger': data.alerts.overdue_actions.length > 0 }"
          >
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-amber !h-9 !w-9 !text-base">
                  <i class="pi pi-clock"></i>
                </span>
                <div>
                  <h3 class="panel-title">اقدامات اصلاحی معوق</h3>
                  <p class="panel-subtitle">
                    اقداماتی که از مهلت تعیین‌شده عبور کرده‌اند
                  </p>
                </div>
              </div>
              <span
                  v-if="data.alerts.overdue_actions.length"
                  class="pill pill-danger"
              >
                {{ fmt(data.alerts.overdue_actions.length) }} مورد
              </span>
            </header>

            <ul
                v-if="data.alerts.overdue_actions.length"
                class="alert-list"
                tabindex="0"
                aria-label="فهرست اقدامات معوق"
            >
              <li
                  v-for="action in data.alerts.overdue_actions"
                  :key="action.id"
                  class="alert-item"
              >
                <span class="item-avatar tone-amber">
                  {{ initials(action.employee_name) }}
                </span>

                <div class="min-w-0 flex-1">
                  <p class="item-title">{{ action.title }}</p>
                  <p class="item-sub">
                    {{ action.employee_name }} • {{ action.method }}
                  </p>
                </div>

                <span class="pill pill-danger">
                  <i class="pi pi-alert"></i>
                  {{ fmt(action.days_overdue) }} روز تأخیر
                </span>
              </li>
            </ul>

            <div v-else class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>اقدام معوقی وجود ندارد</p>
              <span>تمام اقدامات اصلاحی در بازه زمانی خود هستند.</span>
            </div>
          </article>

          <!-- تغییرات احکام -->
          <article class="dashboard-card">
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-indigo !h-9 !w-9 !text-base">
                  <i class="pi pi-file-edit"></i>
                </span>
                <div>
                  <h3 class="panel-title">آخرین تغییرات احکام</h3>
                  <p class="panel-subtitle">تغییرات اخیر صادرشده برای پرسنل</p>
                </div>
              </div>
              <span class="soft-badge">تاریخ صدور</span>
            </header>

            <ul
                v-if="data.alerts.recent_changes.length"
                class="alert-list"
                tabindex="0"
                aria-label="فهرست تغییرات احکام"
            >
              <li
                  v-for="change in data.alerts.recent_changes"
                  :key="change.id"
                  class="alert-item"
              >
                <span class="item-avatar tone-indigo">
                  {{ initials(change.employee) }}
                </span>

                <div class="min-w-0 flex-1">
                  <p class="item-title">{{ change.employee }}</p>
                  <p class="item-sub">
                    {{ change.post_title }}
                    <span v-if="change.job_title">
                      ({{ change.job_title }})
                    </span>
                  </p>
                </div>

                <span class="item-date" dir="rtl">
                  <i class="pi pi-calendar-minus text-[10px]"></i>
                  {{ change.issue_date }}
                </span>
              </li>
            </ul>

            <div v-else class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>رکوردی ثبت نشده است</p>
              <span>پس از صدور حکم جدید، اینجا نمایش داده می‌شود.</span>
            </div>
          </article>

          <!-- بدون سمت -->
          <article
              class="dashboard-card"
              :class="{ 'panel-warning': data.alerts.unassigned.length > 0 }"
          >
            <header class="panel-head">
              <div class="flex items-center gap-3">
                <span class="icon-box tone-amber !h-9 !w-9 !text-base">
                  <i class="pi pi-user-minus"></i>
                </span>
                <div>
                  <h3 class="panel-title">پرسنل بدون تخصیص سمت</h3>
                  <p class="panel-subtitle">
                    نیازمند بررسی واحد منابع انسانی
                  </p>
                </div>
              </div>
              <span
                  v-if="data.alerts.unassigned.length"
                  class="pill pill-warning"
              >
                {{ fmt(data.alerts.unassigned.length) }} نفر
              </span>
            </header>

            <ul
                v-if="data.alerts.unassigned.length"
                class="alert-list"
                tabindex="0"
                aria-label="فهرست پرسنل بدون سمت"
            >
              <li
                  v-for="person in data.alerts.unassigned"
                  :key="person.id || person.personnel_code"
                  class="alert-item"
              >
                <span class="item-avatar tone-amber">
                  {{ initials(person.name) }}
                </span>

                <div class="min-w-0 flex-1">
                  <p class="item-title">{{ person.name }}</p>
                  <p class="item-sub">
                    کد پرسنلی: {{ person.personnel_code || '—' }}
                  </p>
                </div>

                <i
                    class="pi pi-exclamation-triangle text-sm text-amber-500"
                    aria-label="نیازمند تخصیص سمت"
                ></i>
              </li>
            </ul>

            <div v-else class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p>همه پرسنل دارای سمت هستند</p>
              <span>پرسنل بدون تخصیص سازمانی شناسایی نشد.</span>
            </div>
          </article>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           06 — DATA HEALTH
      ═══════════════════════════════════════════ -->
      <section
          id="hr-data-health"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۶</span>
            <div>
              <h2 class="section-title">سلامت داده و همگام‌سازی</h2>
              <p class="section-caption">
                پایش اعتبار داده‌ها و عملیات اتصال به سامانه‌های مبدأ
              </p>
            </div>
          </div>

          <span
              class="soft-badge"
              :class="
              data.sync_health.failed_records > 0
                ? 'badge-danger'
                : 'badge-success'
            "
          >
            <i
                :class="
                data.sync_health.failed_records > 0
                  ? 'pi pi-exclamation-circle'
                  : 'pi pi-shield-check'
              "
            ></i>
            {{
              data.sync_health.failed_records > 0
                  ? 'نیازمند بررسی'
                  : 'داده‌ها سالم هستند'
            }}
          </span>
        </div>

        <!-- کارت‌های سلامت -->
        <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div
              v-for="card in syncCards"
              :key="card.label"
              class="sync-card"
              :class="`tone-${card.tone}`"
          >
            <span class="icon-box !h-10 !w-10 !text-lg">
              <i :class="`pi ${card.icon}`"></i>
            </span>

            <div class="min-w-0">
              <strong class="block text-xl font-extrabold text-slate-800">
                {{ card.value }}
              </strong>
              <p class="mt-1 text-[10px] leading-5 text-slate-400">
                {{ card.label }}
              </p>
            </div>
          </div>
        </div>

        <!-- جدول لاگ -->
        <article class="dashboard-card mt-4">
          <header class="panel-head">
            <div class="flex items-center gap-3">
              <span class="icon-box tone-slate !h-9 !w-9 !text-base">
                <i class="pi pi-history"></i>
              </span>
              <div>
                <h3 class="panel-title">آخرین عملیات‌های همگام‌سازی</h3>
                <p class="panel-subtitle">
                  {{ lastSyncText }}
                </p>
              </div>
            </div>

            <span
                class="pill"
                :class="
                data.sync_health.last_sync_status === 'success'
                  ? 'pill-success'
                  : 'pill-danger'
              "
            >
              <i
                  :class="
                  data.sync_health.last_sync_status === 'success'
                    ? 'pi pi-check-circle'
                    : 'pi pi-times-circle'
                "
              ></i>
              {{
                data.sync_health.last_sync_status === 'success'
                    ? 'آخرین همگام‌سازی موفق'
                    : 'آخرین همگام‌سازی ناموفق'
              }}
            </span>
          </header>

          <div
              v-if="data.sync_health.recent_logs.length"
              class="table-scroll"
              tabindex="0"
              aria-label="جدول عملیات همگام‌سازی"
          >
            <table class="sync-table">
              <thead>
              <tr>
                <th scope="col">نوع عملیات</th>
                <th scope="col">وضعیت</th>
                <th scope="col">رکوردها</th>
                <th scope="col">مدت (ms)</th>
                <th scope="col">منبع</th>
                <th scope="col">زمان اجرا</th>
              </tr>
              </thead>

              <tbody>
              <tr
                  v-for="log in data.sync_health.recent_logs"
                  :key="log.id"
              >
                <td>
                    <span class="flex items-center gap-2 font-medium text-slate-700">
                      <i
                          :class="
                          log.type === 'training'
                            ? 'pi pi-graduation-cap'
                            : 'pi pi-users'
                        "
                          class="text-xs text-slate-400"
                      ></i>
                      {{ log.type === 'training' ? 'آموزش' : 'پرسنلی' }}
                    </span>
                </td>

                <td>
                    <span
                        class="pill"
                        :class="
                        log.status === 'success'
                          ? 'pill-success'
                          : 'pill-danger'
                      "
                    >
                      <i
                          :class="
                          log.status === 'success'
                            ? 'pi pi-check'
                            : 'pi pi-times'
                        "
                      ></i>
                      {{ log.status === 'success' ? 'موفق' : 'ناموفق' }}
                    </span>
                </td>

                <td class="font-semibold text-slate-700">
                  {{ fmt(log.records) }}
                </td>

                <td>
                    <span class="duration-chip">
                      {{ fmt(log.duration_ms) }}
                    </span>
                </td>

                <td>
                    <span class="soft-badge !py-0.5">
                      <i
                          :class="
                          log.trigger === 'cli'
                            ? 'pi pi-terminal'
                            : 'pi pi-globe'
                        "
                      ></i>
                      {{ log.trigger === 'cli' ? 'خط فرمان' : 'وب' }}
                    </span>
                </td>

                <td class="whitespace-nowrap text-[11px] text-slate-400">
                  {{ log.created_at }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state">
            <i class="pi pi-cloud"></i>
            <p>هنوز عملیات همگام‌سازی ثبت نشده است</p>
            <span>پس از اولین اجرای سینک، گزارش آن اینجا نمایش داده می‌شود.</span>
          </div>
        </article>
      </section>


      <!-- ═══════════════════════════════════════════
     02 — SPAN OF CONTROL (یکپارچه‌شده)
═══════════════════════════════════════════ -->
      <section
          id="hr-span"
          class="dash-section"
      >
        <div class="section-head">
          <div class="flex items-center gap-3">
            <span class="section-number">۰۲</span>
            <div>
              <h2 class="section-title">تحلیل حیطه نظارت</h2>
              <p class="section-caption">
                توزیع حیطه نظارت، شناسایی مدیران بحرانی و ناکارآمد
              </p>
            </div>
          </div>

          <span
              class="soft-badge"
              :class="spanHasData ? 'badge-success' : 'badge-muted'"
          >
            <i :class="spanHasData ? 'pi pi-check-circle' : 'pi pi-info-circle'"></i>
            {{ spanHasData ? 'داده ساختاری موجود است' : 'ساختار تعریف نشده' }}
          </span>
        </div>

        <template v-if="spanHasData">
          <!-- کارت‌های آماری حیطه نظارت -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
                v-for="stat in spanStatCards"
                :key="stat.key"
                class="kpi-card"
                :class="[
                `tone-${stat.tone}`,
                { 'is-alert': stat.alert }
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="icon-box">
                  <i :class="`pi ${stat.icon}`"></i>
                </span>

                <span
                    v-if="stat.alert"
                    class="pill pill-warning"
                >
                  <i class="pi pi-exclamation-circle"></i>
                  خارج از استاندارد
                </span>

                <i
                    v-else
                    class="pi pi-arrow-up-left kpi-watermark"
                ></i>
              </div>

              <div class="mt-4">
                <p class="kpi-label">{{ stat.label }}</p>

                <div class="mt-1.5 flex items-baseline gap-1.5">
                  <strong class="kpi-value">{{ stat.value }}</strong>
                  <span
                      v-if="stat.unit"
                      class="kpi-unit"
                  >
                    {{ stat.unit }}
                  </span>
                </div>
              </div>

              <p class="kpi-foot">
                <i :class="`pi ${stat.footIcon}`"></i>
                <span>{{ stat.hint }}</span>
              </p>
            </article>
          </div>

          <!-- نمودار + لیست‌ها -->
          <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <!-- نمودار توزیع -->
            <article class="dashboard-card flex h-full flex-col">
              <header class="panel-head">
                <div class="flex items-center gap-3">
                  <span class="icon-box tone-indigo !h-9 !w-9 !text-base">
                    <i class="pi pi-chart-bar"></i>
                  </span>
                  <div>
                    <h3 class="panel-title">توزیع حیطه نظارت</h3>
                    <p class="panel-subtitle">
                      بر اساس تعداد زیرمجموعه هر مدیر
                    </p>
                  </div>
                </div>
                <span class="soft-badge">
                  <i class="pi pi-users"></i>
                  {{ fmt(data.span_of_control.total_managers) }} مدیر
                </span>
              </header>

              <div class="panel-body flex-1">
                <div class="chart-box chart-tall">
                  <Chart
                      type="bar"
                      :data="spanDistributionChart"
                      :options="spanDistributionOptions"
                  />
                  <div
                      v-if="!spanChartHasData"
                      class="chart-empty"
                  >
                    <i class="pi pi-chart-bar"></i>
                    <span>داده‌ای برای نمایش وجود ندارد</span>
                  </div>
                </div>
              </div>
            </article>

            <!-- ستون لیست‌ها -->
            <div class="flex flex-col gap-4">
              <!-- مدیران بحرانی -->
              <article
                  class="dashboard-card"
                  :class="{
                  'panel-danger': data.span_of_control.critical_managers.length > 0
                }"
              >
                <header class="panel-head">
                  <div class="flex items-center gap-3">
                    <span class="icon-box tone-rose !h-9 !w-9 !text-base">
                      <i class="pi pi-exclamation-triangle"></i>
                    </span>
                    <div>
                      <h3 class="panel-title">حیطه نظارت بیش از حد بزرگ</h3>
                      <p class="panel-subtitle">
                        احتمال فرسودگی مدیریتی و کاهش کیفیت نظارت
                      </p>
                    </div>
                  </div>
                  <span
                      v-if="data.span_of_control.critical_managers.length"
                      class="pill pill-danger"
                  >
                    {{ fmt(data.span_of_control.critical_managers.length) }} مورد
                  </span>
                </header>

                <ul
                    v-if="data.span_of_control.critical_managers.length"
                    class="alert-list"
                    tabindex="0"
                    aria-label="فهرست مدیران با حیطه نظارت بحرانی"
                >
                  <li
                      v-for="manager in data.span_of_control.critical_managers"
                      :key="manager.id"
                      class="alert-item"
                  >
                    <span class="item-avatar tone-rose">
                      <i class="pi pi-user"></i>
                    </span>

                    <div class="min-w-0 flex-1">
                      <p class="item-title">{{ manager.position }}</p>
                      <p class="item-sub">{{ manager.unit }}</p>
                    </div>

                    <span
                        class="pill"
                        :class="
                        manager.severity === 'critical'
                          ? 'pill-danger'
                          : 'pill-warning'
                      "
                    >
                      <i class="pi pi-users"></i>
                      {{ fmt(manager.reports) }} زیرمجموعه
                    </span>
                  </li>
                </ul>

                <div v-else class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <p>مدیری با حیطه نظارت بحرانی وجود ندارد</p>
                  <span>همه مدیران در محدوده استاندارد هستند.</span>
                </div>
              </article>

              <!-- مدیران کم‌بازده -->
              <article
                  class="dashboard-card"
                  :class="{
                  'panel-warning': data.span_of_control.underutilized_managers.length > 0
                }"
              >
                <header class="panel-head">
                  <div class="flex items-center gap-3">
                    <span class="icon-box tone-amber !h-9 !w-9 !text-base">
                      <i class="pi pi-info-circle"></i>
                    </span>
                    <div>
                      <h3 class="panel-title">حیطه نظارت خیلی کوچک</h3>
                      <p class="panel-subtitle">
                        احتمال ناکارآمدی و تمرکززدایی ضعیف
                      </p>
                    </div>
                  </div>
                  <span
                      v-if="data.span_of_control.underutilized_managers.length"
                      class="pill pill-warning"
                  >
                    {{ fmt(data.span_of_control.underutilized_managers.length) }} مورد
                  </span>
                </header>

                <ul
                    v-if="data.span_of_control.underutilized_managers.length"
                    class="alert-list"
                    tabindex="0"
                    aria-label="فهرست مدیران با حیطه نظارت کوچک"
                >
                  <li
                      v-for="manager in data.span_of_control.underutilized_managers"
                      :key="manager.id"
                      class="alert-item"
                  >
                    <span class="item-avatar tone-amber">
                      <i class="pi pi-user"></i>
                    </span>

                    <div class="min-w-0 flex-1">
                      <p class="item-title">{{ manager.position }}</p>
                      <p class="item-sub">{{ manager.unit }}</p>
                    </div>

                    <span class="pill pill-warning">
                      <i class="pi pi-users"></i>
                      {{ fmt(manager.reports) }} زیرمجموعه
                    </span>
                  </li>
                </ul>

                <div v-else class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <p>همه مدیران حیطه نظارت مناسب دارند</p>
                  <span>مورد ناکارآمدی شناسایی نشد.</span>
                </div>
              </article>
            </div>
          </div>
        </template>

        <div
            v-else
            class="dashboard-card"
        >
          <div class="empty-state !py-16">
            <i class="pi pi-info-circle"></i>
            <p>ساختار سازمانی هنوز تعریف نشده است</p>
            <span>
              پس از ثبت واحدها و سمت‌ها، تحلیل حیطه نظارت اینجا نمایش داده می‌شود.
            </span>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           FOOTER
      ═══════════════════════════════════════════ -->
      <footer class="dashboard-footer">
        <i class="pi pi-shield-check"></i>
        <span>
          اطلاعات بر پایه آخرین داده‌های همگام‌شده نمایش داده می‌شود.
        </span>
        <span
            v-if="lastLoadedAt"
            class="mr-auto text-slate-400"
        >
          آخرین دریافت: {{ formatDateTime(lastLoadedAt) }}
        </span>
      </footer>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Button from 'primevue/button'
import Chart from 'primevue/chart'
import api from '@/api/axios.js'

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */

const loading = ref(false)
const errorMessage = ref('')
const lastLoadedAt = ref(null)
const data = ref(null)

const currentTime = ref('')
const activeSection = ref('hr-overview')

let clockTimer = null
let sectionObserver = null

/* ═══════════════════════════════════════════════
   DESIGN TOKENS — منطبق با داشبورد مرجع
═══════════════════════════════════════════════ */

const PALETTE = {
  indigo: '#6366f1',
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
  sky: '#0ea5e9'
}

const FONT_FAMILY = 'Vazirmatn, IRANSans, sans-serif'
const GRID_COLOR = 'rgba(148, 163, 184, 0.14)'

const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

const chartAnimation = prefersReducedMotion
    ? false
    : { duration: 700, easing: 'easeOutQuart' }

/* ═══════════════════════════════════════════════
   EMPTY SCHEMA
═══════════════════════════════════════════════ */

const emptyData = () => ({
  kpis: {
    total_active_workforce: 0,
    official_personnel: 0,
    contractors: 0,
    position_coverage_rate: 0,
    filled_positions: 0,
    vacant_positions: 0,
    total_positions: 0,
    avg_training_per_user: 0,
    trained_users: 0,
    total_training_hours: 0,
    assessment_completion: 0,
    completed_assessments: 0,
    total_assessments: 0,
    overdue_actions: 0,
    critical_skill_gaps: 0
  },

  workforce: {
    by_type: { official: 0, contractor: 0 },
    by_status: { active: 0, inactive: 0 },
    by_position: { assigned: 0, unassigned: 0 }
  },

  organization: {
    units: { total: 0, active: 0, custom: 0 },
    positions: { total: 0, active: 0, custom: 0 },
    max_depth: 0,
    avg_span_of_control: 0
  },

  training: {
    total_courses: 0,
    trained_users: 0,
    total_performance_hours: 0,
    avg_hours_per_trained: 0,
    completed: 0,
    in_progress: 0,
    registered: 0,
    completion_rate: 0
  },

  assessment: {
    assessments_by_status: {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    },
    open_gaps: { critical: 0, major: 0, minor: 0 },
    actions: {
      planned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0
    }
  },

  span_of_control: {
    has_data: false,
    total_managers: 0,
    avg: 0,
    min: 0,
    max: 0,
    median: 0,
    distribution: {
      very_small: 0,
      small: 0,
      normal: 0,
      large: 0,
      very_large: 0
    },
    critical_managers: [],
    underutilized_managers: []
  },

  charts: {
    employees_by_unit: { labels: [], values: [] },
    workforce_composition: { labels: [], values: [] },
    position_coverage: { labels: [], filled: [], vacant: [] },
    training_trend: { labels: [], values: [], hours: [] },
    tenure_distribution: { labels: [], values: [] },
    skill_gaps: { labels: [], values: [] }
  },

  alerts: {
    critical_vacancies: [],
    overdue_actions: [],
    recent_changes: [],
    unassigned: []
  },

  sync_health: {
    today_success: 0,
    today_failed: 0,
    last_sync_at: null,
    last_sync_status: null,
    stale_records: 0,
    failed_records: 0,
    recent_logs: []
  }
})

/* ═══════════════════════════════════════════════
   NORMALIZER — ادغام بازگشتی برای حفظ پیش‌فرض‌ها
═══════════════════════════════════════════════ */

const mergeSchema = (base, incoming) => {
  if (!incoming || typeof incoming !== 'object') return { ...base }

  const result = { ...base }

  Object.keys(base).forEach((key) => {
    const baseValue = base[key]
    const nextValue = incoming[key]

    if (nextValue === undefined) return

    if (
        baseValue &&
        typeof baseValue === 'object' &&
        !Array.isArray(baseValue)
    ) {
      result[key] = mergeSchema(baseValue, nextValue)
    } else {
      result[key] = nextValue
    }
  })

  return result
}

const normalizeResponse = (res) => {
  const schema = emptyData()
  const source = res?.data?.data ?? res?.data ?? res ?? {}

  return {
    kpis: mergeSchema(schema.kpis, source.kpis),
    workforce: mergeSchema(schema.workforce, source.workforce),
    organization: mergeSchema(schema.organization, source.organization),
    training: mergeSchema(schema.training, source.training),
    assessment: mergeSchema(schema.assessment, source.assessment),
    span_of_control: mergeSchema(schema.span_of_control, source.span_of_control),
    charts: mergeSchema(schema.charts, source.charts),
    alerts: mergeSchema(schema.alerts, source.alerts),
    sync_health: mergeSchema(schema.sync_health, source.sync_health)
  }
}

/* ═══════════════════════════════════════════════
   FORMAT HELPERS
═══════════════════════════════════════════════ */

const numberFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 1
})

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit'
})

const fmt = (value) => {
  const number = Number(value ?? 0)
  return numberFormatter.format(Number.isFinite(number) ? number : 0)
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
      ? '—'
      : dateTimeFormatter.format(date)
}

const formatTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
      ? '—'
      : timeFormatter.format(date)
}

const initials = (name = '') =>
    String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join('')

const clampPercent = (value) => {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, number))
}

/* ═══════════════════════════════════════════════
   CLOCK & DATE
═══════════════════════════════════════════════ */

const updateClock = () => {
  currentTime.value = new Date().toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const todayDate = computed(() =>
    new Date().toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
)

/* ═══════════════════════════════════════════════
   API
═══════════════════════════════════════════════ */

const loadDashboard = async () => {
  if (loading.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/hr/dashboard/overview')
    data.value = normalizeResponse(response)
    lastLoadedAt.value = new Date()
  } catch (error) {
    console.error('[HR Dashboard]', error)
    errorMessage.value =
        error?.response?.data?.message ||
        'ارتباط با سرور برقرار نشد. اتصال شبکه خود را بررسی کنید.'
  } finally {
    loading.value = false
  }
}

/* ═══════════════════════════════════════════════
   HERO STATE
═══════════════════════════════════════════════ */

const systemState = computed(() => {
  if (errorMessage.value) {
    return { tone: 'rose', text: 'ارتباط با سرویس برقرار نیست' }
  }

  if (!data.value) {
    return { tone: 'slate', text: 'در حال دریافت اطلاعات' }
  }

  const failed = Number(data.value.sync_health.failed_records ?? 0)

  return failed > 0
      ? {
        tone: 'amber',
        text: `${fmt(failed)} رکورد نیازمند بررسی`
      }
      : { tone: 'emerald', text: 'سامانه فعال است' }
})

const lastSyncText = computed(() => {
  const syncedAt = data.value?.sync_health?.last_sync_at
  return syncedAt ? formatDateTime(syncedAt) : 'هنوز همگام‌سازی نشده'
})

/* ═══════════════════════════════════════════════
   SECTION NAVIGATION
═══════════════════════════════════════════════ */

const alertCount = computed(() => {
  const alerts = data.value?.alerts
  if (!alerts) return 0

  return (
      alerts.critical_vacancies.length +
      alerts.overdue_actions.length +
      alerts.unassigned.length
  )
})

const spanHasData = computed(() => Boolean(data.value?.span_of_control?.has_data))

const spanChartHasData = computed(() => {
  const distribution = data.value?.span_of_control?.distribution
  if (!distribution) return false

  return Object.values(distribution).some((value) => Number(value) > 0)
})

const sections = computed(() => [
  {
    id: 'hr-overview',
    short: 'خلاصه مدیریتی',
    icon: 'pi-chart-line'
  },
  {
    id: 'hr-span',
    short: 'حیطه نظارت',
    icon: 'pi-sitemap'
  },
  {
    id: 'hr-structure',
    short: 'ساختار سازمانی',
    icon: 'pi-building'
  },
  {
    id: 'hr-development',
    short: 'آموزش و شایستگی',
    icon: 'pi-graduation-cap'
  },
  {
    id: 'hr-alerts',
    short: 'هشدارها',
    icon: 'pi-bell',
    count: alertCount.value
  },
  {
    id: 'hr-data-health',
    short: 'سلامت داده',
    icon: 'pi-database'
  }
])

const observeSections = async () => {
  sectionObserver?.disconnect()

  await nextTick()

  if (typeof IntersectionObserver === 'undefined') return

  sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
                (a, b) =>
                    a.boundingClientRect.top - b.boundingClientRect.top
            )

        if (visible[0]) {
          activeSection.value = visible[0].target.id
        }
      },
      {
        rootMargin: '-110px 0px -60% 0px',
        threshold: 0
      }
  )

  sections.value.forEach((section) => {
    const element = document.getElementById(section.id)
    if (element) sectionObserver.observe(element)
  })
}

const scrollToSection = (id) => {
  const element = document.getElementById(id)
  if (!element) return

  activeSection.value = id

  element.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  })
}

watch(data, (value) => {
  if (value) observeSections()
})

/* ═══════════════════════════════════════════════
   KPI CARDS
═══════════════════════════════════════════════ */

const kpiCards = computed(() => {
  if (!data.value) return []

  const k = data.value.kpis
  const sync = data.value.sync_health

  const lowCoverage = Number(k.position_coverage_rate) < 70
  const hasCriticalGaps = Number(k.critical_skill_gaps) > 0
  const hasSyncErrors = Number(sync.failed_records) > 0

  return [
    {
      key: 'workforce',
      label: 'نیروی کار فعال',
      value: fmt(k.total_active_workforce),
      unit: 'نفر',
      icon: 'pi-users',
      tone: 'indigo',
      progress: null,
      footIcon: 'pi-user-check',
      hint: `${fmt(k.official_personnel)} رسمی · ${fmt(k.contractors)} پیمانکار`,
      alert: false
    },
    {
      key: 'coverage',
      label: 'پوشش ساختار سازمانی',
      value: fmt(k.position_coverage_rate),
      unit: '٪',
      icon: 'pi-sitemap',
      tone: lowCoverage ? 'rose' : 'emerald',
      progress: clampPercent(k.position_coverage_rate),
      footIcon: 'pi-briefcase',
      hint: `${fmt(k.vacant_positions)} سمت خالی از ${fmt(k.total_positions)}`,
      alert: lowCoverage
    },
    {
      key: 'training',
      label: 'سرانه آموزش',
      value: fmt(k.avg_training_per_user),
      unit: 'ساعت',
      icon: 'pi-graduation-cap',
      tone: 'violet',
      progress: null,
      footIcon: 'pi-users',
      hint: `${fmt(k.trained_users)} نفر آموزش دیده‌اند`,
      alert: false
    },
    {
      key: 'assessment',
      label: 'تکمیل ارزیابی شایستگی',
      value: fmt(k.assessment_completion),
      unit: '٪',
      icon: 'pi-clipboard-check',
      tone: 'indigo',
      progress: clampPercent(k.assessment_completion),
      footIcon: 'pi-check-circle',
      hint: `${fmt(k.completed_assessments)} از ${fmt(k.total_assessments)} ارزیابی`,
      alert: false
    },
    {
      key: 'gaps',
      label: 'گپ‌های مهارتی بحرانی',
      value: fmt(k.critical_skill_gaps),
      unit: 'مورد',
      icon: 'pi-exclamation-triangle',
      tone: hasCriticalGaps ? 'amber' : 'emerald',
      progress: null,
      footIcon: 'pi-clock',
      hint: `${fmt(k.overdue_actions)} اقدام اصلاحی معوق`,
      alert: hasCriticalGaps
    },
    {
      key: 'sync',
      label: 'سلامت همگام‌سازی',
      value: hasSyncErrors ? fmt(sync.failed_records) : 'سالم',
      unit: hasSyncErrors ? 'خطا' : '',
      icon: 'pi-sync',
      tone: hasSyncErrors ? 'rose' : 'emerald',
      progress: null,
      footIcon: 'pi-database',
      hint: `${fmt(sync.stale_records)} رکورد قدیمی`,
      alert: hasSyncErrors
    }
  ]
})

/* ═══════════════════════════════════════════════
   SPAN OF CONTROL — کارت‌های آماری
═══════════════════════════════════════════════ */

const spanStatCards = computed(() => {
  const span = data.value?.span_of_control
  if (!span || !span.has_data) return []

  const normalCount = Number(span.distribution?.normal ?? 0)
  const totalManagers = Number(span.total_managers ?? 0)
  const isHealthy = totalManagers > 0 && normalCount > totalManagers / 2

  return [
    {
      key: 'total-managers',
      label: 'تعداد مدیران',
      value: fmt(span.total_managers),
      unit: 'نفر',
      icon: 'pi-users',
      tone: 'indigo',
      footIcon: 'pi-briefcase',
      hint: 'سمت دارای زیرمجموعه',
      alert: false
    },
    {
      key: 'avg-span',
      label: 'میانگین حیطه نظارت',
      value: fmt(span.avg),
      unit: 'زیرمجموعه',
      icon: 'pi-chart-bar',
      tone: 'violet',
      footIcon: 'pi-users',
      hint: 'به ازای هر مدیر',
      alert: false
    },
    {
      key: 'median-span',
      label: 'میانه حیطه نظارت',
      value: fmt(span.median),
      unit: '',
      icon: 'pi-minus',
      tone: 'emerald',
      footIcon: 'pi-sort-amount-down',
      hint: `کمترین: ${fmt(span.min)} | بیشترین: ${fmt(span.max)}`,
      alert: false
    },
    {
      key: 'normal-managers',
      label: 'مدیران با حیطه نظارت نرمال',
      value: fmt(normalCount),
      unit: 'نفر',
      icon: 'pi-check-circle',
      tone: isHealthy ? 'emerald' : 'amber',
      footIcon: 'pi-info-circle',
      hint: 'استاندارد: ۶ تا ۱۱ زیرمجموعه',
      alert: !isHealthy
    }
  ]
})

/* ═══════════════════════════════════════════════
   DERIVED LISTS
═══════════════════════════════════════════════ */

const structureStats = computed(() => {
  const org = data.value?.organization

  if (!org) return []

  return [
    {
      label: 'واحدهای فعال',
      value: fmt(org.units.active),
      unit: `از ${fmt(org.units.total)}`,
      icon: 'pi-building'
    },
    {
      label: 'سمت‌های فعال',
      value: fmt(org.positions.active),
      unit: `از ${fmt(org.positions.total)}`,
      icon: 'pi-briefcase'
    },
    {
      label: 'سمت‌های سفارشی',
      value: fmt(org.positions.custom),
      unit: '',
      icon: 'pi-sliders-h'
    },
    {
      label: 'عمق سازمان',
      value: fmt(org.max_depth),
      unit: 'سطح',
      icon: 'pi-sitemap'
    },
    {
      label: 'حیطه نظارت',
      value: fmt(org.avg_span_of_control),
      unit: 'نفر / سمت',
      icon: 'pi-users'
    }
  ]
})

const trainingMetrics = computed(() => {
  const training = data.value?.training

  if (!training) return []

  return [
    {
      label: 'کل دوره‌ها',
      value: fmt(training.total_courses),
      icon: 'pi-book',
      tone: 'indigo'
    },
    {
      label: 'افراد آموزش‌دیده',
      value: fmt(training.trained_users),
      icon: 'pi-users',
      tone: 'violet'
    },
    {
      label: 'ساعت عملکرد',
      value: fmt(training.total_performance_hours),
      icon: 'pi-clock',
      tone: 'emerald'
    },
    {
      label: 'نرخ تکمیل',
      value: `${fmt(training.completion_rate)}٪`,
      icon: 'pi-percentage',
      tone: 'amber'
    }
  ]
})

const gapItems = computed(() => {
  const gaps = data.value?.assessment.open_gaps

  return [
    {
      key: 'critical',
      label: 'بحرانی',
      value: fmt(gaps?.critical ?? 0),
      icon: 'pi-exclamation-circle',
      tone: 'rose'
    },
    {
      key: 'major',
      label: 'عمده',
      value: fmt(gaps?.major ?? 0),
      icon: 'pi-exclamation-triangle',
      tone: 'amber'
    },
    {
      key: 'minor',
      label: 'جزئی',
      value: fmt(gaps?.minor ?? 0),
      icon: 'pi-info-circle',
      tone: 'emerald'
    }
  ]
})

const assessmentActions = computed(() => {
  const actions = data.value?.assessment.actions

  return [
    {
      label: 'در حال اجرا',
      value: fmt(actions?.in_progress ?? 0),
      dot: 'bg-indigo-400',
      textClass: 'text-indigo-600'
    },
    {
      label: 'معوق',
      value: fmt(actions?.overdue ?? 0),
      dot: 'bg-rose-400',
      textClass: 'text-rose-600'
    },
    {
      label: 'تکمیل شده',
      value: fmt(actions?.completed ?? 0),
      dot: 'bg-emerald-400',
      textClass: 'text-emerald-600'
    }
  ]
})

const syncCards = computed(() => {
  const sync = data.value?.sync_health

  if (!sync) return []

  return [
    {
      label: 'همگام‌سازی موفق امروز',
      value: fmt(sync.today_success),
      icon: 'pi-check-circle',
      tone: 'emerald'
    },
    {
      label: 'همگام‌سازی ناموفق امروز',
      value: fmt(sync.today_failed),
      icon: 'pi-times-circle',
      tone: 'rose'
    },
    {
      label: 'رکوردهای قدیمی (+۲۴ ساعت)',
      value: fmt(sync.stale_records),
      icon: 'pi-clock',
      tone: 'amber'
    },
    {
      label: 'رکوردهای خطادار',
      value: fmt(sync.failed_records),
      icon: 'pi-exclamation-circle',
      tone: 'rose'
    }
  ]
})

/* ═══════════════════════════════════════════════
   CHART DATA
═══════════════════════════════════════════════ */

const chartHasData = (key) => {
  const chart = data.value?.charts?.[key]
  if (!chart) return false

  if (Array.isArray(chart.filled)) {
    return [...chart.filled, ...(chart.vacant ?? [])].some(
        (value) => Number(value) > 0
    )
  }

  if (Array.isArray(chart.values)) {
    return [
      ...chart.values,
      ...(chart.hours ?? [])
    ].some((value) => Number(value) > 0)
  }

  return false
}

const hasAssessmentData = computed(() => {
  const status = data.value?.assessment.assessments_by_status
  if (!status) return false

  return Object.values(status).some((value) => Number(value) > 0)
})

const employeesByUnitChart = computed(() => ({
  labels: data.value?.charts.employees_by_unit.labels ?? [],
  datasets: [
    {
      label: 'تعداد پرسنل',
      data: data.value?.charts.employees_by_unit.values ?? [],
      backgroundColor: 'rgba(99, 102, 241, 0.78)',
      hoverBackgroundColor: PALETTE.indigo,
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 16
    }
  ]
}))

const positionCoverageChart = computed(() => ({
  labels: data.value?.charts.position_coverage.labels ?? [],
  datasets: [
    {
      label: 'تکمیل شده',
      data: data.value?.charts.position_coverage.filled ?? [],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      hoverBackgroundColor: PALETTE.emerald,
      borderRadius: 4,
      borderSkipped: false
    },
    {
      label: 'خالی',
      data: data.value?.charts.position_coverage.vacant ?? [],
      backgroundColor: 'rgba(244, 63, 94, 0.75)',
      hoverBackgroundColor: PALETTE.rose,
      borderRadius: 4,
      borderSkipped: false
    }
  ]
}))

const workforceChart = computed(() => ({
  labels: data.value?.charts.workforce_composition.labels ?? [],
  datasets: [
    {
      data: data.value?.charts.workforce_composition.values ?? [],
      backgroundColor: [
        PALETTE.indigo,
        PALETTE.violet,
        PALETTE.slate
      ],
      hoverBackgroundColor: [
        '#4f46e5',
        '#7c3aed',
        '#64748b'
      ],
      hoverOffset: 8,
      borderWidth: 0,
      spacing: 3
    }
  ]
}))

const tenureChart = computed(() => ({
  labels: data.value?.charts.tenure_distribution.labels ?? [],
  datasets: [
    {
      label: 'تعداد پرسنل',
      data: data.value?.charts.tenure_distribution.values ?? [],
      backgroundColor: 'rgba(139, 92, 246, 0.75)',
      hoverBackgroundColor: PALETTE.violet,
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 26
    }
  ]
}))

const trainingTrendChart = computed(() => ({
  labels: data.value?.charts.training_trend.labels ?? [],
  datasets: [
    {
      label: 'تعداد دوره',
      data: data.value?.charts.training_trend.values ?? [],
      borderColor: PALETTE.indigo,
      backgroundColor: 'rgba(99, 102, 241, 0.09)',
      pointBackgroundColor: '#ffffff',
      pointBorderColor: PALETTE.indigo,
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      yAxisID: 'y'
    },
    {
      label: 'ساعت آموزش',
      data: data.value?.charts.training_trend.hours ?? [],
      borderColor: PALETTE.emerald,
      backgroundColor: 'transparent',
      pointBackgroundColor: '#ffffff',
      pointBorderColor: PALETTE.emerald,
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderDash: [5, 5],
      tension: 0.4,
      borderWidth: 2,
      yAxisID: 'y1'
    }
  ]
}))

const assessmentStatusChart = computed(() => ({
  labels: ['پیش‌نویس', 'ارسال شده', 'تأیید شده', 'برگشت خورده'],
  datasets: [
    {
      data: [
        data.value?.assessment.assessments_by_status.draft ?? 0,
        data.value?.assessment.assessments_by_status.submitted ?? 0,
        data.value?.assessment.assessments_by_status.approved ?? 0,
        data.value?.assessment.assessments_by_status.rejected ?? 0
      ],
      backgroundColor: [
        PALETTE.slate,
        PALETTE.amber,
        PALETTE.emerald,
        PALETTE.rose
      ],
      hoverOffset: 8,
      borderWidth: 0,
      spacing: 3
    }
  ]
}))

const spanDistributionChart = computed(() => ({
  labels: [
    'خیلی کوچک (<۳)',
    'کوچک (۳-۵)',
    'نرمال (۶-۱۱)',
    'بزرگ (۱۲-۱۹)',
    'خیلی بزرگ (+۲۰)'
  ],
  datasets: [
    {
      label: 'تعداد مدیران',
      data: [
        data.value?.span_of_control.distribution.very_small ?? 0,
        data.value?.span_of_control.distribution.small ?? 0,
        data.value?.span_of_control.distribution.normal ?? 0,
        data.value?.span_of_control.distribution.large ?? 0,
        data.value?.span_of_control.distribution.very_large ?? 0
      ],
      backgroundColor: [
        PALETTE.slate,
        PALETTE.amber,
        PALETTE.emerald,
        '#fb923c',
        PALETTE.rose
      ],
      hoverBackgroundColor: [
        '#64748b',
        '#d97706',
        '#059669',
        '#ea580c',
        '#e11d48'
      ],
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 38
    }
  ]
}))

/* ═══════════════════════════════════════════════
   CHART OPTIONS — RTL + یکپارچه
═══════════════════════════════════════════════ */

const tooltipStyle = {
  rtl: true,
  textDirection: 'rtl',
  backgroundColor: '#0f172a',
  titleColor: '#f8fafc',
  bodyColor: '#cbd5e1',
  padding: 12,
  cornerRadius: 12,
  caretSize: 5,
  boxPadding: 5,
  usePointStyle: true,
  titleFont: { family: FONT_FAMILY, size: 12, weight: '600' },
  bodyFont: { family: FONT_FAMILY, size: 11 }
}

const legendStyle = {
  position: 'bottom',
  rtl: true,
  textDirection: 'rtl',
  labels: {
    usePointStyle: true,
    pointStyle: 'circle',
    boxWidth: 6,
    boxHeight: 6,
    padding: 16,
    color: '#64748b',
    font: { family: FONT_FAMILY, size: 11 }
  }
}

const tickStyle = (size = 11) => ({
  color: '#94a3b8',
  font: { family: FONT_FAMILY, size }
})

const baseLayout = {
  padding: { top: 6, right: 6, bottom: 0, left: 6 }
}

const horizontalBarOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: baseLayout,
  animation: chartAnimation,
  plugins: {
    legend: { display: false },
    tooltip: tooltipStyle
  },
  scales: {
    x: {
      beginAtZero: true,
      reverse: true,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { ...tickStyle(), precision: 0 }
    },
    y: {
      position: 'right',
      grid: { display: false },
      ticks: { ...tickStyle(10), maxRotation: 0 }
    }
  }
}

const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: baseLayout,
  animation: chartAnimation,
  plugins: {
    legend: legendStyle,
    tooltip: { ...tooltipStyle, mode: 'index', intersect: false }
  },
  scales: {
    x: {
      stacked: true,
      reverse: true,
      grid: { display: false },
      ticks: { ...tickStyle(10), maxRotation: 40, minRotation: 0 }
    },
    y: {
      stacked: true,
      position: 'right',
      beginAtZero: true,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { ...tickStyle(), precision: 0 }
    }
  }
}

const verticalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: baseLayout,
  animation: chartAnimation,
  plugins: {
    legend: { display: false },
    tooltip: tooltipStyle
  },
  scales: {
    x: {
      reverse: true,
      grid: { display: false },
      ticks: { ...tickStyle(10), maxRotation: 40, minRotation: 0 }
    },
    y: {
      position: 'right',
      beginAtZero: true,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { ...tickStyle(), precision: 0 }
    }
  }
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: baseLayout,
  animation: chartAnimation,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: legendStyle,
    tooltip: tooltipStyle
  },
  scales: {
    x: {
      reverse: true,
      grid: { display: false },
      ticks: { ...tickStyle(10), maxRotation: 40, minRotation: 0 }
    },
    y: {
      position: 'right',
      beginAtZero: true,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { ...tickStyle(), precision: 0 },
      title: {
        display: true,
        text: 'تعداد دوره',
        color: '#94a3b8',
        font: { family: FONT_FAMILY, size: 10 }
      }
    },
    y1: {
      position: 'left',
      beginAtZero: true,
      grid: { display: false },
      ticks: tickStyle(),
      title: {
        display: true,
        text: 'ساعت آموزش',
        color: '#94a3b8',
        font: { family: FONT_FAMILY, size: 10 }
      }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  layout: baseLayout,
  animation: chartAnimation,
  plugins: {
    legend: legendStyle,
    tooltip: tooltipStyle
  }
}

const spanDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: baseLayout,
  animation: chartAnimation,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipStyle,
      callbacks: {
        label: (ctx) => `${fmt(ctx.parsed.y)} مدیر`
      }
    }
  },
  scales: {
    x: {
      reverse: true,
      grid: { display: false },
      ticks: { ...tickStyle(10), maxRotation: 0, minRotation: 0 }
    },
    y: {
      position: 'right',
      beginAtZero: true,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { ...tickStyle(), precision: 0 }
    }
  }
}

/* ═══════════════════════════════════════════════
   LIFECYCLE
═══════════════════════════════════════════════ */

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 30000)
  loadDashboard()
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  sectionObserver?.disconnect()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   TOKENS
═══════════════════════════════════════════════ */

.tone-indigo {
  --tone-bg: #eef2ff;
  --tone-fg: #6366f1;
  --tone-border: #e0e7ff;
  --tone-ring: rgb(99 102 241 / 12%);
}

.tone-violet {
  --tone-bg: #f5f3ff;
  --tone-fg: #8b5cf6;
  --tone-border: #ede9fe;
  --tone-ring: rgb(139 92 246 / 12%);
}

.tone-emerald {
  --tone-bg: #ecfdf5;
  --tone-fg: #10b981;
  --tone-border: #d1fae5;
  --tone-ring: rgb(16 185 129 / 12%);
}

.tone-amber {
  --tone-bg: #fffbeb;
  --tone-fg: #f59e0b;
  --tone-border: #fef3c7;
  --tone-ring: rgb(245 158 11 / 14%);
}

.tone-rose {
  --tone-bg: #fff1f2;
  --tone-fg: #f43f5e;
  --tone-border: #ffe4e6;
  --tone-ring: rgb(244 63 94 / 12%);
}

.tone-slate {
  --tone-bg: #f8fafc;
  --tone-fg: #64748b;
  --tone-border: #e2e8f0;
  --tone-ring: rgb(100 116 139 / 12%);
}

/* ═══════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════ */

.hr-dashboard {
  @apply space-y-5;
  animation: dashboard-enter 0.45s ease-out;
}

.dash-section {
  @apply scroll-mt-24;
}

/* ═══════════════════════════════════════════════
   SKELETON — منطبق با مرجع
═══════════════════════════════════════════════ */

.skeleton {
  @apply relative overflow-hidden rounded-lg bg-slate-200/70;
}

.skeleton::after {
  content: '';
  @apply absolute inset-0;
  transform: translateX(-100%);
  background: linear-gradient(
      90deg,
      transparent,
      rgb(255 255 255 / 55%),
      transparent
  );
  animation: skeleton-shimmer 1.5s infinite;
}

/* ═══════════════════════════════════════════════
   HERO — عیناً همان زبان بصری Dashboard.vue
═══════════════════════════════════════════════ */

.dashboard-hero {
  @apply relative overflow-hidden rounded-3xl border border-indigo-100/70 p-6 md:p-8;

  background: linear-gradient(
      135deg,
      rgb(238 242 255),
      rgb(248 250 252) 55%,
      rgb(245 243 255)
  );

  box-shadow: 0 8px 30px rgb(79 70 229 / 5%);
}

.hero-decoration {
  @apply pointer-events-none absolute rounded-full;
  filter: blur(50px);
}

.hero-decoration-one {
  @apply -left-16 -top-24 h-[220px] w-[220px];
  background: rgb(129 140 248 / 12%);
}

.hero-decoration-two {
  @apply -bottom-24 -right-12 h-[180px] w-[180px];
  background: rgb(167 139 250 / 12%);
}

.hero-icon {
  @apply flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-2xl;
  background: rgb(255 255 255 / 80%);
  border-color: var(--tone-border);
  color: var(--tone-fg);
  box-shadow: 0 4px 14px rgb(79 70 229 / 6%);
}

.hero-title {
  @apply text-2xl font-bold tracking-tight text-slate-800 md:text-3xl;
}

.hero-subtitle {
  @apply mt-1 text-sm text-slate-500 md:text-base;
}

.hero-status {
  @apply h-2 w-2 rounded-full;
  background: var(--tone-fg, #10b981);
  box-shadow: 0 0 0 4px var(--tone-ring, rgb(16 185 129 / 10%));
  animation: status-pulse 2.8s ease-in-out infinite;
}

.hero-meta {
  @apply flex items-center gap-1.5 text-xs text-slate-500;
}

.hero-meta i {
  @apply text-slate-400;
}

.hero-health {
  @apply flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 backdrop-blur-sm;
}

.hero-actions :deep(.p-button) {
  @apply rounded-xl border border-indigo-200/80 bg-white/80 px-4 py-2.5 text-xs font-semibold text-indigo-600 shadow-sm transition-all;
}

.hero-actions :deep(.p-button:hover) {
  @apply border-indigo-300 bg-white;
  box-shadow: 0 4px 14px rgb(99 102 241 / 12%);
}

.hero-actions :deep(.p-button:focus-visible) {
  outline: 2px solid var(--tone-fg, #6366f1);
  outline-offset: 3px;
}

/* ═══════════════════════════════════════════════
   SHARED PRIMITIVES
═══════════════════════════════════════════════ */

.dashboard-card {
  @apply overflow-hidden rounded-2xl border border-slate-200/70 bg-white;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.dashboard-card:hover {
  border-color: rgb(203 213 225 / 0.9);
  box-shadow: 0 4px 18px rgb(15 23 42 / 5%);
}

.icon-box {
  @apply flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg;
  background: var(--tone-bg);
  color: var(--tone-fg);
  border-color: var(--tone-border);
}

.soft-badge {
  @apply inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500;
}

.badge-danger {
  @apply border-rose-100 bg-rose-50 text-rose-600;
}

.badge-success {
  @apply border-emerald-100 bg-emerald-50 text-emerald-600;
}

.badge-muted {
  @apply border-slate-200 bg-slate-50 text-slate-500;
}

.pill {
  @apply inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium;
}

.pill-danger {
  @apply bg-rose-50 text-rose-600;
}

.pill-warning {
  @apply bg-amber-50 text-amber-600;
}

.pill-success {
  @apply bg-emerald-50 text-emerald-600;
}

.pill-info {
  @apply bg-indigo-50 text-indigo-600;
}

/* ═══════════════════════════════════════════════
   ERROR
═══════════════════════════════════════════════ */

.error-banner {
  @apply flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4;
  animation: dashboard-enter 0.3s ease-out;
}

.error-banner-icon {
  @apply flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-lg text-rose-600;
}

.icon-button {
  @apply flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors;
}

.icon-button:hover {
  @apply bg-white text-slate-600;
}

/* ═══════════════════════════════════════════════
   SECTION NAV
═══════════════════════════════════════════════ */

.section-nav {
  @apply sticky top-2 z-20 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/70 bg-white/90 p-1.5 backdrop-blur-md;
  box-shadow: 0 4px 20px rgb(15 23 42 / 5%);
}

.nav-chip {
  @apply flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-500 transition-all;
}

.nav-chip i {
  @apply text-xs;
}

.nav-chip:hover {
  @apply bg-slate-50 text-slate-700;
}

.nav-chip.is-active {
  @apply bg-indigo-50 text-indigo-600;
}

.nav-count {
  @apply flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-100 px-1 text-[9px] font-bold text-rose-600;
}

/* ═══════════════════════════════════════════════
   SECTION HEAD
═══════════════════════════════════════════════ */

.section-head {
  @apply mb-4 flex flex-wrap items-center justify-between gap-3;
}

.section-number {
  @apply flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/70 text-xs font-bold text-indigo-500;
}

.section-title {
  @apply text-[15px] font-bold text-slate-800;
}

.section-caption {
  @apply mt-0.5 text-[11px] text-slate-400;
}

/* ═══════════════════════════════════════════════
   KPI
═══════════════════════════════════════════════ */

.kpi-card {
  @apply relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
  transition: transform 0.25s ease, box-shadow 0.25s ease,
  border-color 0.25s ease;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 1.25rem;
  bottom: 1.25rem;
  width: 3px;
  border-radius: 99px;
  background: var(--tone-fg);
  opacity: 0.55;
  transition: opacity 0.25s ease;
}

.kpi-card:hover {
  transform: translateY(-3px);
  border-color: var(--tone-border);
  box-shadow: 0 10px 28px rgb(15 23 42 / 7%);
}

.kpi-card:hover::before {
  opacity: 1;
}

.kpi-card.is-alert {
  border-color: var(--tone-border);
  background: linear-gradient(
      180deg,
      #ffffff 0%,
      var(--tone-bg) 180%
  );
}

.kpi-watermark {
  @apply text-xl text-slate-200;
}

.kpi-label {
  @apply text-xs font-medium text-slate-500;
}

.kpi-value {
  @apply text-[28px] font-extrabold leading-tight tracking-tight text-slate-800;
}

.kpi-unit {
  @apply text-xs font-medium text-slate-400;
}

.kpi-progress {
  @apply mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100;
}

.kpi-progress-bar {
  @apply block h-full rounded-full;
  background: var(--tone-fg);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-foot {
  @apply mt-3 flex items-center gap-1.5 text-[11px] leading-5 text-slate-400;
}

.kpi-foot i {
  @apply shrink-0 text-[10px];
}

/* ═══════════════════════════════════════════════
   PANELS & CHARTS
═══════════════════════════════════════════════ */

.panel-head {
  @apply flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4;
}

.panel-title {
  @apply text-sm font-bold text-slate-800;
}

.panel-subtitle {
  @apply mt-0.5 text-[11px] text-slate-400;
}

.panel-body {
  @apply p-5;
}

.chart-box {
  @apply relative w-full;
  height: 220px;
}

.chart-tall {
  height: 280px;
}

.chart-empty {
  @apply absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50/80 text-xs text-slate-400;
}

.chart-empty i {
  @apply text-3xl text-slate-300;
}

/* ═══════════════════════════════════════════════
   STRUCTURE STATS
═══════════════════════════════════════════════ */

.stat-row {
  @apply flex items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50/70 px-3 py-2.5 transition-colors;
}

.stat-row:hover {
  @apply border-slate-100 bg-slate-50;
}

/* ═══════════════════════════════════════════════
   TRAINING SUMMARY
═══════════════════════════════════════════════ */

.training-summary {
  @apply mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-4;
}

.training-summary-item {
  @apply rounded-xl bg-white/80 px-3 py-2.5;
}

/* ═══════════════════════════════════════════════
   GAP & ACTIONS
═══════════════════════════════════════════════ */

.gap-chip {
  @apply flex flex-col items-center rounded-xl border py-3 transition-transform;
  background: var(--tone-bg);
  border-color: var(--tone-border);
}

.gap-chip:hover {
  transform: translateY(-2px);
}

.action-summary {
  @apply mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3;
}

.action-row {
  @apply flex items-center justify-between gap-2 py-1.5;
}

/* ═══════════════════════════════════════════════
   ALERT LISTS
═══════════════════════════════════════════════ */

.panel-danger {
  border-color: #fecdd3;
  background: linear-gradient(180deg, #ffffff 0%, #fff5f6 100%);
}

.panel-warning {
  border-color: #fde68a;
  background: linear-gradient(180deg, #ffffff 0%, #fffbeb 100%);
}

.alert-list {
  @apply max-h-[300px] space-y-2 overflow-y-auto p-4;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.alert-item {
  @apply flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-all;
}

.alert-item:hover {
  @apply border-slate-200 bg-white;
  box-shadow: 0 2px 10px rgb(15 23 42 / 4%);
}

.item-avatar {
  @apply flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold;
  background: var(--tone-bg);
  color: var(--tone-fg);
  border: 1px solid var(--tone-border);
}

.item-title {
  @apply block truncate text-[13px] font-semibold text-slate-700;
}

.item-sub {
  @apply mt-0.5 block truncate text-[11px] text-slate-400;
}

.item-date {
  @apply flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] text-slate-400;
}

.empty-state {
  @apply flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center;
}

.empty-state > i {
  @apply mb-1 text-3xl text-slate-300;
}

.empty-state p {
  @apply text-xs font-semibold text-slate-500;
}

.empty-state span {
  @apply text-[11px] leading-5 text-slate-400;
}

/* ═══════════════════════════════════════════════
   SYNC
═══════════════════════════════════════════════ */

.sync-card {
  @apply flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 transition-all;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
}

.sync-card:hover {
  transform: translateY(-2px);
  border-color: var(--tone-border);
  box-shadow: 0 6px 20px rgb(15 23 42 / 6%);
}

.table-scroll {
  @apply max-h-[340px] overflow-auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.sync-table {
  @apply w-full border-collapse text-right text-xs;
}

.sync-table thead th {
  @apply sticky top-0 z-10 whitespace-nowrap bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-500;
  box-shadow: 0 1px 0 rgb(226 232 240 / 80%);
}

.sync-table tbody td {
  @apply whitespace-nowrap px-4 py-3 text-slate-600;
}

.sync-table tbody tr {
  @apply border-b border-slate-100/80 transition-colors;
}

.sync-table tbody tr:last-child {
  @apply border-b-0;
}

.sync-table tbody tr:hover {
  @apply bg-indigo-50/30;
}

.duration-chip {
  @apply inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500;
}

/* ═══════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════ */

.dashboard-footer {
  @apply flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/60 bg-slate-50/60 px-4 py-3 text-[11px] text-slate-400;
}

.dashboard-footer > i {
  @apply text-emerald-500;
}

/* ═══════════════════════════════════════════════
   ACCESSIBILITY
═══════════════════════════════════════════════ */

:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 3px;
  border-radius: 8px;
}

.alert-list:focus-visible,
.table-scroll:focus-visible {
  outline-offset: -3px;
}

/* ═══════════════════════════════════════════════
   ANIMATION
═══════════════════════════════════════════════ */

@keyframes dashboard-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px var(--tone-ring, rgb(16 185 129 / 10%));
  }
  50% {
    box-shadow: 0 0 0 7px transparent;
  }
}

/* ═══════════════════════════════════════════════
   REDUCED MOTION
═══════════════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .hr-dashboard,
  .hero-status,
  .skeleton::after {
    animation: none !important;
  }

  .kpi-card,
  .sync-card,
  .gap-chip,
  .alert-item,
  .dashboard-card,
  .kpi-progress-bar {
    transition: none !important;
  }

  .kpi-card:hover,
  .sync-card:hover,
  .gap-chip:hover {
    transform: none !important;
  }
}

/* ═══════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════ */

@media (max-width: 640px) {
  .dashboard-hero {
    @apply p-5;
  }

  .hero-icon {
    @apply h-11 w-11 text-xl;
  }

  .hero-title {
    @apply text-xl;
  }

  .hero-subtitle {
    @apply text-xs leading-6;
  }

  .hero-health {
    @apply w-full justify-center;
  }

  .section-nav {
    @apply top-1 gap-0.5 p-1;
  }

  .nav-chip {
    @apply px-2.5 py-1.5 text-[10px];
  }

  .panel-head,
  .panel-body {
    @apply p-4;
  }

  .chart-tall {
    height: 240px;
  }

  .kpi-value {
    @apply text-2xl;
  }

  .sync-card {
    @apply flex-col items-start gap-2 p-3;
  }

  .section-caption {
    @apply leading-5;
  }
}

/* ═══════════════════════════════════════════════
   PRINT
═══════════════════════════════════════════════ */

@media print {
  .section-nav,
  .hero-actions,
  .error-banner {
    display: none !important;
  }

  .hr-dashboard {
    @apply space-y-4;
  }

  .dashboard-card,
  .kpi-card {
    break-inside: avoid;
    box-shadow: none !important;
  }

  .alert-list,
  .table-scroll {
    max-height: none !important;
    overflow: visible !important;
  }

  .dash-section {
    break-inside: avoid-page;
  }
}
</style>