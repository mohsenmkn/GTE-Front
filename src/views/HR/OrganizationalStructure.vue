<template>
  <div class="org-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-info">
        <div class="header-icon">
          <i class="pi pi-sitemap"></i>
        </div>
        <div>
          <h1>مدیریت ساختار سازمانی</h1>
          <p>مدیریت سلسله‌مراتب واحدها، سمت‌ها و پرسنل سازمان</p>
        </div>
      </div>

      <div class="header-actions">
        <Button label="سمت جدید" icon="pi pi-plus" @click="openCreate()" />
        <Button
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            rounded
            :loading="loading"
            @click="loadTree"
            v-tooltip.bottom="'تازه‌سازی ساختار'"
        />
      </div>
    </div>

    <!-- Messages -->
    <Transition name="fade">
      <Message v-if="errorMessage" severity="error" closable class="mb-4" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
    </Transition>
    <Transition name="fade">
      <Message v-if="successMessage" severity="success" closable class="mb-4" @close="successMessage = ''">
        {{ successMessage }}
      </Message>
    </Transition>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon unit"><i class="pi pi-building"></i></div>
        <div>
          <span>واحدهای سازمانی</span>
          <strong>{{ statistics.units }}</strong>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon position"><i class="pi pi-briefcase"></i></div>
        <div>
          <span>سمت‌های سازمانی</span>
          <strong>{{ statistics.positions }}</strong>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon employee"><i class="pi pi-users"></i></div>
        <div>
          <span>پرسنل</span>
          <strong>{{ statistics.employees }}</strong>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon sync"><i class="pi pi-sync"></i></div>
        <div>
          <span>وضعیت ساختار</span>
          <strong class="status-text">همگام</strong>
        </div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="tree-card">
      <!-- Toolbar -->
      <div class="tree-toolbar">
        <div class="toolbar-title">
          <i class="pi pi-sitemap"></i>
          <div>
            <strong>چارت سازمانی</strong>
            <small>برای جابه‌جایی، آیتم را بکشید و روی مقصد رها کنید.</small>
          </div>
        </div>

        <div class="toolbar-actions">
          <span class="p-input-icon-left search-box">
            <i class="pi pi-search"></i>
            <InputText v-model="searchText" placeholder="جستجو در ساختار..." />
          </span>
          <Button icon="pi pi-chevron-down" severity="secondary" text rounded v-tooltip.bottom="'باز کردن همه'" @click="expandAll" />
          <Button icon="pi pi-chevron-up" severity="secondary" text rounded v-tooltip.bottom="'بستن همه'" @click="collapseAll" />
        </div>
      </div>

      <!-- Tree Container -->
      <div class="tree-container">
        <div v-if="!loading && filteredNodes.length === 0" class="empty-state">
          <div class="empty-icon"><i class="pi pi-sitemap"></i></div>
          <h3>ساختاری پیدا نشد</h3>
          <p>موردی مطابق جستجوی شما وجود ندارد.</p>
        </div>

        <Tree
            v-model:selectionKeys="selectedNode"
            v-model:expandedKeys="expandedKeys"
            :value="filteredNodes"
            :loading="loading"
            selectionMode="single"
            draggableNodes
            droppableNodes
            class="org-tree"
            @node-drop="onNodeDrop"
        >
          <template #default="{ node }">

            <!-- ================= UNIT ================= -->
            <div v-if="node.data.type === 'unit'" class="unit-card">
              <div class="unit-accent"></div>
              <div class="unit-body">
                <div class="unit-drag" v-tooltip.top="'جابه‌جایی'">
                  <i class="pi pi-grip-vertical"></i>
                </div>
                <div class="unit-avatar">
                  <i class="pi pi-building"></i>
                </div>
                <div class="unit-info">
                  <span class="unit-name">{{ node.data.title }}</span>
                  <div class="unit-details">
                    <span v-if="node.data.code">
                      <i class="pi pi-hashtag"></i> {{ node.data.code }}
                    </span>
                    <span>
                      <i class="pi pi-layer-group"></i> سطح {{ node.data.level }}
                    </span>
                  </div>
                </div>
                <div class="unit-btns">
                  <Button
                      icon="pi pi-plus"
                      text
                      rounded
                      size="small"
                      severity="primary"
                      v-tooltip.bottom="'افزودن سمت'"
                      @click.stop="openCreate(node)"
                  />
                </div>
              </div>
            </div>

            <!-- ================= POSITION ================= -->
            <div v-else-if="node.data.type === 'position'"
                 class="position-card"
                 :class="`pos-level-${getPositionLevelClass(node.data.positionLevel)}`">
              <div class="pos-drag" v-tooltip.top="'جابه‌جایی'">
                <i class="pi pi-grip-vertical"></i>
              </div>
              <div class="pos-dot"></div>
              <div class="pos-info">
                <span class="pos-name">{{ node.data.post_title || 'بدون عنوان' }}</span>
                <div class="pos-details">
                  <span v-if="node.data.post_code">
                    <i class="pi pi-hashtag"></i> {{ node.data.post_code }}
                  </span>
                  <span v-if="node.data.job_title">
                    <i class="pi pi-id-card"></i> {{ node.data.job_title }}
                  </span>
                  <span class="pos-level-badge">
                    سطح {{ node.data.positionLevel }}
                  </span>
                </div>
                <!-- بخش پرسنل - اصلاح شده -->
                <div v-if="node.data.employees?.length" class="pos-people">
                  <router-link
                      v-for="emp in node.data.employees"
                      :key="emp.id"
                      :to="`/hr/employees/${emp.user_id}`"
                      class="person-tag"
                      @click.stop
                  >
                    <span class="person-avatar">{{ getInitials(emp.name) }}</span>
                    <span class="person-name">{{ emp.name }}</span>
                    <i class="pi pi-external-link person-link-icon"></i>
                  </router-link>
                </div>
                <div v-else class="pos-empty">
                  <i class="pi pi-user-minus"></i> بدون پرسنل
                </div>
              </div>
              <div class="pos-btns">
                <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    v-tooltip.bottom="'ویرایش'"
                    @click.stop="openEdit(node)"
                />
                <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    v-tooltip.bottom="'حذف'"
                    @click.stop="deletePosition(node)"
                />
              </div>
            </div>

          </template>
        </Tree>
      </div>

      <!-- Footer -->
      <div class="tree-footer">
        <div><i class="pi pi-info-circle"></i> برای جابه‌جایی، آیتم را بکشید و رها کنید.</div>
        <div>
          <span>{{ statistics.positions }} سمت</span>
          <span class="sep">•</span>
          <span>{{ statistics.employees }} پرسنل</span>
        </div>
      </div>
    </div>

    <!-- ================= DIALOG ================= -->
    <Dialog
        v-model:visible="dialogVisible"
        modal
        :header="dialogMode === 'create' ? 'ایجاد سمت جدید' : 'ویرایش سمت'"
        :style="{ width: '620px' }"
        class="position-dialog"
    >
      <div class="dialog-intro">
        <div class="dialog-icon"><i class="pi pi-briefcase"></i></div>
        <div>
          <strong>{{ dialogMode === 'create' ? 'تعریف سمت سازمانی' : 'ویرایش اطلاعات سمت' }}</strong>
          <small>اطلاعات سمت را وارد یا اصلاح کنید.</small>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field full">
          <label>عنوان سمت <span>*</span></label>
          <InputText v-model="form.post_title" class="w-full" placeholder="مثلاً سرپرست توسعه نرم‌افزار" />
        </div>
        <div class="form-field">
          <label>کد سمت</label>
          <InputText v-model="form.post_code" class="w-full" placeholder="کد سمت" />
        </div>
        <div class="form-field">
          <label>کد شغل</label>
          <InputText v-model="form.job_code" class="w-full" placeholder="کد شغل" />
        </div>
        <div class="form-field full">
          <label>عنوان شغل</label>
          <InputText v-model="form.job_title" class="w-full" placeholder="عنوان شغل" />
        </div>
        <div class="form-field">
          <label>ترتیب نمایش</label>
          <InputNumber v-model="form.sort_order" :min="0" class="w-full" />
        </div>
        <div class="form-field status-field">
          <label>وضعیت</label>
          <div class="status-control">
            <ToggleSwitch v-model="form.is_active" />
            <span>{{ form.is_active ? 'فعال' : 'غیرفعال' }}</span>
          </div>
        </div>
        <div class="form-field full">
          <label>توضیحات</label>
          <Textarea v-model="form.description" rows="4" class="w-full" placeholder="توضیحات مربوط به این سمت..." />
        </div>
      </div>

      <template #footer>
        <Button label="انصراف" severity="secondary" text @click="dialogVisible = false" />
        <Button :label="dialogMode === 'create' ? 'ایجاد سمت' : 'ذخیره تغییرات'" icon="pi pi-check" :loading="saving" @click="savePosition" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from '@/api/axios'

import Tree from 'primevue/tree'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'

const nodes = ref([])
const loading = ref(false)
const selectedNode = ref(null)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const errorMessage = ref('')
const successMessage = ref('')
const searchText = ref('')
const saving = ref(false)
const expandedKeys = ref({})

const statistics = ref({ units: 0, positions: 0, employees: 0 })

function getInitials(name) {
  if (!name) return '؟'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 1)
  return parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
}

function calculateStatistics(tree) {
  let units = 0, positions = 0, employees = 0
  function walk(nodes) {
    for (const node of nodes || []) {
      if (node.data.type === 'unit') units++
      if (node.data.type === 'position') {
        positions++
        employees += node.data.employees?.length ?? 0
      }
      walk(node.children)
    }
  }
  walk(tree)
  statistics.value = { units, positions, employees }
}

// محاسبه سطح هر سمت در سلسله‌مراتب
function assignPositionLevels(tree) {
  function walk(nodes, parentUnitLevel = 0, positionDepth = 0) {
    for (const node of nodes || []) {
      if (node.data.type === 'unit') {
        node.data.positionLevel = 0 // واحد، سمت نیست
        walk(node.children, node.data.level || 0, 0)
      } else if (node.data.type === 'position') {
        node.data.positionLevel = parentUnitLevel + positionDepth + 1
        walk(node.children, parentUnitLevel, positionDepth + 1)
      }
    }
  }
  walk(tree)
}

// تبدیل سطح به کلاس رنگ (چرخشی برای سطوح > 4)
function getPositionLevelClass(level) {
  if (!level || level < 1) return 1
  return ((level - 1) % 4) + 1
}

const filteredNodes = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  if (!query) return nodes.value

  function filterTree(items) {
    return items
        .map(node => {
          const title = node.data.title ?? node.data.post_title ?? ''
          const employees = node.data.employees ?? []
          const employeeMatch = employees.some(emp => emp.name?.toLowerCase().includes(query))
          const selfMatch = title.toLowerCase().includes(query)
          const children = filterTree(node.children ?? [])
          if (selfMatch || employeeMatch || children.length) {
            return { ...node, children }
          }
          return null
        })
        .filter(Boolean)
  }
  return filterTree(nodes.value)
})

function expandAll() {
  const keys = {}
  function walk(items) {
    for (const node of items || []) {
      keys[node.key] = true
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes.value)
  expandedKeys.value = keys
}

function collapseAll() {
  expandedKeys.value = {}
}

const form = ref({
  id: null, organizational_unit_id: null, parent_id: null,
  post_title: '', post_code: '', job_title: '', job_code: '',
  is_custom: true, is_active: true, sort_order: 0, description: '',
})

async function loadTree() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await axios.get('hr/organizational-positions/tree')
    nodes.value = response.data.data ?? []
    assignPositionLevels(nodes.value) // محاسبه سطوح
    calculateStatistics(nodes.value)
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در دریافت ساختار سازمانی.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = {
    id: null, organizational_unit_id: null, parent_id: null,
    post_title: '', post_code: '', job_title: '', job_code: '',
    is_custom: true, is_active: true, sort_order: 0, description: '',
  }
}

function openCreate(parentNode = null) {
  resetForm()
  dialogMode.value = 'create'
  if (parentNode) {
    if (parentNode.data.type !== 'position') {
      form.value.organizational_unit_id = parentNode.data.id
    } else {
      form.value.organizational_unit_id = parentNode.data.unit_id
      form.value.parent_id = parentNode.data.id
    }
  }
  dialogVisible.value = true
}

function openEdit(node) {
  if (node.data.type !== 'position') return
  dialogMode.value = 'edit'
  form.value = {
    id: node.data.id, organizational_unit_id: node.data.unit_id, parent_id: node.data.parent_id,
    post_title: node.data.post_title ?? '', post_code: node.data.post_code ?? '',
    job_title: node.data.job_title ?? '', job_code: node.data.job_code ?? '',
    is_custom: node.data.is_custom ?? false, is_active: node.data.is_active ?? true,
    sort_order: node.data.sort_order ?? 0, description: '',
  }
  dialogVisible.value = true
}

async function savePosition() {
  if (saving.value) return
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await axios.post('organizational-positions', form.value)
      successMessage.value = 'سمت با موفقیت ایجاد شد.'
    } else {
      await axios.put(`hr/organizational-positions/${form.value.id}`, form.value)
      successMessage.value = 'سمت با موفقیت ویرایش شد.'
    }
    dialogVisible.value = false
    await loadTree()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'خطا در ذخیره اطلاعات سمت.'
  } finally {
    saving.value = false
  }
}

async function deletePosition(node) {
  if (node.data.type !== 'position') return
  const confirmed = window.confirm(`آیا از حذف سمت «${node.data.post_title}» اطمینان دارید؟`)
  if (!confirmed) return
  try {
    await axios.delete(`hr/organizational-positions/${node.data.id}`)
    successMessage.value = 'سمت با موفقیت حذف شد.'
    await loadTree()
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? 'امکان حذف سمت وجود ندارد.'
  }
}

async function onNodeDrop(event) {
  const dragNode = event.dragNode
  const dropNode = event.dropNode
  const dropPosition = event.dropPosition

  if (!dragNode || !dropNode) {
    await loadTree()
    return
  }

  /*
   * =========================================================
   * UNIT DRAG & DROP
   * =========================================================
   */

  if (dragNode.data.type === 'unit') {

    if (dropNode.data.type !== 'unit') {
      await loadTree()
      return
    }

    // جلوگیری از قرار دادن واحد زیر خودش
    if (dragNode.data.id === dropNode.data.id) {
      errorMessage.value =
          'یک واحد نمی‌تواند زیرمجموعه خودش قرار بگیرد.'

      await loadTree()
      return
    }

    let parentId = null

    if (dropPosition === 0) {
      // داخل واحد مقصد
      parentId = dropNode.data.id
    } else {
      // قبل / بعد از واحد مقصد
      parentId = dropNode.data.parent_id ?? null
    }

    try {
      await axios.post(
          `hr/organizational-units/${dragNode.data.id}/move`,
          {
            parent_id: parentId,
            sort_order: null,
          }
      )

      successMessage.value =
          'واحد سازمانی با موفقیت جابه‌جا شد.'

      await loadTree()

    } catch (error) {

      errorMessage.value =
          error.response?.data?.message ??
          'امکان جابه‌جایی واحد سازمانی وجود ندارد.'

      await loadTree()
    }

    return
  }


  /*
   * =========================================================
   * POSITION DRAG & DROP
   * =========================================================
   */

  if (dragNode.data.type === 'position') {

    if (
        dropNode.data.type !== 'position' &&
        dropNode.data.type !== 'unit'
    ) {
      await loadTree()
      return
    }

    let parentId = null
    let organizationalUnitId = null
    let sortOrder = null


    /*
     * =====================================================
     * 1. POSITION → POSITION
     * =====================================================
     */

    if (dropNode.data.type === 'position') {

      /*
       * واحد مقصد
       *
       * چون tree فقط سمت‌های یک واحد را
       * در یک درخت قرار می‌دهد.
       */
      organizationalUnitId = dropNode.data.unit_id


      /*
       * Drop داخل سمت
       */
      if (dropPosition === 0) {

        parentId = dropNode.data.id
        sortOrder = 0

      }

      /*
       * Drop قبل / بعد
       */
      else {

        parentId =
            dropNode.data.parent_id ?? null

        if (dropPosition < 0) {

          sortOrder = Math.max(
              0,
              (dropNode.data.sort_order ?? 0) - 1
          )

        } else {

          sortOrder =
              (dropNode.data.sort_order ?? 0) + 1
        }
      }
    }


    /*
     * =====================================================
     * 2. POSITION → UNIT
     * =====================================================
     */

    else if (dropNode.data.type === 'unit') {

      /*
       * انتقال مستقیم به واحد
       */
      organizationalUnitId = dropNode.data.id

      parentId = null

      sortOrder = 0
    }


    /*
     * =====================================================
     * جلوگیری از Drop روی خودش
     * =====================================================
     */

    if (
        parentId !== null &&
        parentId === dragNode.data.id
    ) {
      errorMessage.value =
          'یک سمت نمی‌تواند زیرمجموعه خودش قرار بگیرد.'

      await loadTree()
      return
    }


    /*
     * =====================================================
     * ارسال درخواست
     * =====================================================
     */

    try {

      await axios.post(
          `hr/organizational-positions/${dragNode.data.id}/move`,
          {
            parent_id: parentId,
            organizational_unit_id: organizationalUnitId,
            sort_order: sortOrder,
          }
      )

      successMessage.value =
          'سمت با موفقیت جابه‌جا شد.'

      await loadTree()

    } catch (error) {

      errorMessage.value =
          error.response?.data?.message ??
          'امکان جابه‌جایی سمت وجود ندارد.'

      await loadTree()
    }

    return
  }


  await loadTree()
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
/* ================= PAGE ================= */
.org-page {
  padding: 1.5rem;
  min-height: 100%;
  background: #f1f5f9;
  direction: rtl;
}

/* ================= HEADER ================= */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.header-info { display: flex; align-items: center; gap: 1rem; }
.header-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 1.4rem;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}
.header-info h1 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1e293b; }
.header-info p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.88rem; }
.header-actions { display: flex; align-items: center; gap: 0.5rem; }

/* ================= STATS ================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.stat-icon.unit { background: #eff6ff; color: #2563eb; }
.stat-icon.position { background: #f5f3ff; color: #7c3aed; }
.stat-icon.employee { background: #ecfdf5; color: #059669; }
.stat-icon.sync { background: #fffbeb; color: #d97706; }
.stat-card span { display: block; color: #64748b; font-size: 0.78rem; }
.stat-card strong { display: block; margin-top: 0.15rem; font-size: 1.3rem; color: #1e293b; }
.status-text { color: #059669 !important; font-size: 0.95rem !important; }

/* ================= TREE CARD ================= */
.tree-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tree-toolbar {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.toolbar-title { display: flex; align-items: center; gap: 0.75rem; }
.toolbar-title > i { font-size: 1.2rem; color: #2563eb; }
.toolbar-title strong { display: block; font-size: 0.95rem; color: #1e293b; }
.toolbar-title small { display: block; margin-top: 0.2rem; color: #94a3b8; font-size: 0.75rem; }
.toolbar-actions { display: flex; align-items: center; gap: 0.5rem; }
.search-box input { width: 240px; border-radius: 10px; padding-right: 2.3rem; }

/* ================= TREE CONTAINER ================= */
.tree-container {
  min-height: 420px;
  max-height: 72vh;
  padding: 1.5rem 1.5rem 1.5rem 2rem;
  overflow: auto;
  background: #fafbfd;
}

.org-tree {
  border: none !important;
  background: transparent !important;
  min-width: max-content;
}

/* ---- PrimeVue overrides ---- */
:deep(.p-tree-node-content) {
  background: transparent !important;
  border: none !important;
  padding: 0.35rem 0 !important;
  border-radius: 0 !important;
}

:deep(.p-tree-node-toggle-button) {
  width: 28px !important;
  height: 28px !important;
  border-radius: 8px !important;
  color: #64748b !important;
  margin-left: 0.25rem !important;
}
:deep(.p-tree-node-toggle-button:hover) {
  background: #e2e8f0 !important;
  color: #1e293b !important;
}

:deep(.p-tree-node-children) {
  padding: 0 !important;
  margin: 0 !important;
  padding-right: 1.6rem !important;
  border-right: 2px dashed #cbd5e1 !important;
  margin-right: 0.85rem !important;
  margin-top: 0.25rem !important;
}

/* ================= UNIT CARD ================= */
.unit-card {
  position: relative;
  display: flex;
  min-width: 360px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f4ff 100%);
  border: 2px solid #bfdbfe;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
.unit-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.15);
  transform: translateY(-1px);
}

.unit-accent {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: linear-gradient(180deg, #2563eb, #3b82f6);
  border-radius: 0 14px 14px 0;
}

.unit-body {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 0.75rem;
  gap: 0.75rem;
}

.unit-drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  color: #93c5fd;
  cursor: grab;
  flex-shrink: 0;
  transition: color 0.2s;
}
.unit-drag:hover { color: #2563eb; }
.unit-drag:active { cursor: grabbing; }

.unit-avatar {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 1.25rem;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.3);
}

.unit-info {
  flex: 1;
  min-width: 0;
}

.unit-name {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e3a5f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.unit-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.75rem;
}
.unit-details span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.unit-details i { font-size: 0.68rem; }

.unit-btns {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.unit-card:hover .unit-btns { opacity: 1; }

/* ================= POSITION CARD - LEVEL COLORS ================= */
.position-card {
  display: flex;
  align-items: flex-start;
  min-width: 320px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  gap: 0.6rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
}

/* Level 1 - آبی (معاونت‌ها) */
.pos-level-1 {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff 0%, #fff 100%);
}
.pos-level-1:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
}
.pos-level-1 .pos-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.pos-level-1 .pos-level-badge {
  background: #dbeafe;
  color: #1e40af;
}

/* Level 2 - سبز */
.pos-level-2 {
  border-color: #a7f3d0;
  background: linear-gradient(135deg, #ecfdf5 0%, #fff 100%);
}
.pos-level-2:hover {
  border-color: #6ee7b7;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.12);
}
.pos-level-2 .pos-dot {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.pos-level-2 .pos-level-badge {
  background: #d1fae5;
  color: #065f46;
}

/* Level 3 - بنفش */
.pos-level-3 {
  border-color: #ddd6fe;
  background: linear-gradient(135deg, #f5f3ff 0%, #fff 100%);
}
.pos-level-3:hover {
  border-color: #c4b5fd;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.12);
}
.pos-level-3 .pos-dot {
  background: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}
.pos-level-3 .pos-level-badge {
  background: #ede9fe;
  color: #5b21b6;
}

/* Level 4 - نارنجی/آمبر (به جای زرد) */
.pos-level-4 {
  border-color: #fed7aa;
  background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
}
.pos-level-4:hover {
  border-color: #fdba74;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);
}
.pos-level-4 .pos-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}
.pos-level-4 .pos-level-badge {
  background: #fef3c7;
  color: #92400e;
}

.position-card:hover {
  transform: translateY(-1px);
}

.pos-drag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  padding-top: 0.35rem;
  color: #cbd5e1;
  cursor: grab;
  flex-shrink: 0;
  transition: color 0.2s;
}
.pos-drag:hover { color: #64748b; }
.pos-drag:active { cursor: grabbing; }

.pos-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 0.55rem;
  transition: all 0.2s;
}

.pos-info {
  flex: 1;
  min-width: 0;
}

.pos-name {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.pos-details {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.2rem;
  color: #94a3b8;
  font-size: 0.72rem;
}
.pos-details span {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}
.pos-details i { font-size: 0.65rem; }

.pos-level-badge {
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  transition: all 0.2s;
}

/* People */
.pos-people {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}
.person-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem 0.2rem 0.3rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.7rem;
  color: #475569;
  transition: background 0.2s;
}
.person-tag:hover { background: #f1f5f9; }
.person-avatar {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 0.55rem;
  font-weight: 700;
}

.pos-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.4rem;
  color: #cbd5e1;
  font-size: 0.72rem;
}

.pos-btns {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
  padding-top: 0.15rem;
}
.position-card:hover .pos-btns { opacity: 1; }

/* ================= FOOTER ================= */
.tree-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 0.75rem;
  background: #f8fafc;
}
.tree-footer > div:first-child { display: flex; align-items: center; gap: 0.4rem; }
.tree-footer i { color: #2563eb; }
.sep { margin: 0 0.4rem; }

/* ================= EMPTY STATE ================= */
.empty-state {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
.empty-icon {
  width: 70px; height: 70px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; font-size: 1.7rem; color: #cbd5e1;
}
.empty-state h3 { margin: 1rem 0 0.3rem; color: #475569; }
.empty-state p { margin: 0; font-size: 0.88rem; }

/* ================= DIALOG ================= */
.dialog-intro {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 1.2rem;
  margin-bottom: 1.2rem;
  border-bottom: 1px solid #e2e8f0;
}
.dialog-icon {
  width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: #eff6ff; color: #2563eb;
}
.dialog-intro strong { display: block; color: #1e293b; }
.dialog-intro small { display: block; margin-top: 0.2rem; color: #94a3b8; font-size: 0.75rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-field { display: flex; flex-direction: column; gap: 0.4rem; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 0.85rem; font-weight: 600; color: #334155; }
.form-field label span { color: #ef4444; }
.status-field { justify-content: center; }
.status-control { display: flex; align-items: center; gap: 0.6rem; min-height: 42px; }

/* ================= RESPONSIVE ================= */
@media (max-width: 1100px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .tree-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-actions { width: 100%; }
  .search-box, .search-box input { width: 100%; }
}
@media (max-width: 700px) {
  .org-page { padding: 0.75rem; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; }
  .header-actions .p-button:first-child { flex: 1; }
  .stats-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .form-field.full { grid-column: auto; }
  .tree-footer { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .unit-btns, .pos-btns { opacity: 1; }
  .unit-card, .position-card { min-width: 260px; }
}

/* ================= ANIMATION ================= */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }


/* ================= PERSON LINK STYLES ================= */
.person-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem 0.2rem 0.3rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.7rem;
  color: #475569;
  transition: all 0.2s ease;
  text-decoration: none;
  cursor: pointer;
}

.person-tag:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1e40af;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
}

.person-tag:hover .person-avatar {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.person-tag:hover .person-link-icon {
  opacity: 1;
  color: #2563eb;
}

.person-name {
  transition: color 0.2s;
}

.person-link-icon {
  font-size: 0.6rem;
  opacity: 0;
  transition: all 0.2s ease;
  margin-right: 0.1rem;
}

.person-avatar {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff;
  font-size: 0.55rem;
  font-weight: 700;
  transition: background 0.2s ease;
}


</style>