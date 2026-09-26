<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <Button
            icon="pi pi-arrow-right"
            text
            rounded
            @click="$router.push({ name: 'projects.index' })"
        />
        <h2 class="text-2xl font-semibold">{{ project?.name ?? 'جزئیات پروژه' }}</h2>
        <Tag v-if="project" :value="getStatusLabel(project.status)" :severity="getStatusSeverity(project.status)" />
      </div>
      <Button
          icon="pi pi-pencil"
          label="ویرایش"
          @click="editProject"
      />
    </div>

    <!-- Loading State -->
    <Card v-if="loading">
      <template #content>
        <div class="flex justify-center p-4">
          <ProgressSpinner />
        </div>
      </template>
    </Card>

    <!-- Content -->
    <Card v-else-if="project">
      <template  #content>


        <TabView>
          <!-- اطلاعات کلی -->
          <TabPanel  header="اطلاعات کلی">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">کد پروژه</span>
                <span class="font-semibold">{{ project.code }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">شرکت</span>
                <span class="font-semibold">{{ project.company?.name }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">نوع پروژه</span>
                <span class="font-semibold">{{ getTypeLabel(project.type) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">مدیر پروژه</span>
                <span class="font-semibold">{{ project.manager?.name }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">تاریخ شروع</span>
                <span class="font-semibold">{{ formatDate(project.start_date) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">تاریخ پایان</span>
                <span class="font-semibold">{{ formatDate(project.end_date) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">بودجه کل</span>
                <span class="font-semibold text-green-600">{{ formatMoney(project.total_budget) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-muted-color text-sm">موقعیت</span>
                <span class="font-semibold">{{ project.location }}</span>
              </div>
              <div v-if="project.description" class="col-span-2 flex flex-col gap-1">
                <span class="text-muted-color text-sm">توضیحات</span>
                <p class="text-gray-700">{{ project.description }}</p>
              </div>
            </div>
          </TabPanel>

          <!-- بودجه -->
          <TabPanel v-if="canReadBudget" header="بودجه">
            <BudgetTab  :project-id="project.id" />
          </TabPanel>

          <!-- WBS -->
          <TabPanel v-if="canReadWbs" header="WBS">
              <WbsTree  :project-id="project.id" />
          </TabPanel>

          <!-- تنخواه -->
          <TabPanel v-if="canReadPettyCash" header="تنخواه">
            <PettyCashTab   :project-id="project.id" />
          </TabPanel>

          <!-- اسناد -->
          <TabPanel v-if="canReadDocument" header="اسناد">
            <DocumentTab
                :project-id="project.id"
                :company-id="project.company_id"
            />
          </TabPanel>
          <TabPanel v-if="canReadContracts" header="قراردادها">
            <ContractTab  :project-id="project.id" />
          </TabPanel>

          <TabPanel v-if="canReadWarehouse" header="انبار">
            <InventoryTab

                :project-id="project.id"
                :company-id="project.company_id"
            />
          </TabPanel>

        </TabView>
      </template>
    </Card>
  </div>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import {projectService} from '@/services/projectService'
import BudgetTab from '@/views/projects/BudgetTab.vue'
import WbsTree from "@/views/projects/WbsTree.vue";
import PettyCashTab from "@/views/projects/PettyCashTab.vue";
import DocumentTab from "@/views/Document/DocumentTab.vue";
import ContractTab from "@/views/Contract/ContractTab.vue";
import InventoryTab from "@/views/Warehouse/InventoryTab.vue";
import {useAuthStore} from "@/stores/auth.js";
const authStore = useAuthStore()


const route = useRoute()
const router = useRouter()
const toast = useToast()

const project = ref(null)
const loading = ref(false)

const can = (permission) => {
  return authStore.permissions?.includes(permission) ?? false
}

const canReadBudget = computed(() => can('budget.read'))
const canReadWbs = computed(() => can('wbs.read'))
const canReadPettyCash = computed(() => can('pettycash.read'))
const canReadDocument = computed(() => can('document.read'))
const canReadContracts = computed(() => can('contracts.read'))
const canReadWarehouse = computed(() => can('warehouse.read'))


const statusLabels = {
  planning: 'در حال برنامه‌ریزی',
  active: 'فعال',
  on_hold: 'متوقف شده',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده'
}

const typeLabels = {
  construction: 'ساخت و ساز',
  maintenance: 'نگهداری',
  development: 'توسعه',
  renovation: 'بازسازی'
}

function getStatusLabel(status) {
  return statusLabels[status] ?? status
}

function getStatusSeverity(status) {
  const map = {
    planning: 'info',
    active: 'success',
    on_hold: 'warning',
    completed: 'secondary',
    cancelled: 'danger'
  }
  return map[status] ?? 'secondary'
}

function getTypeLabel(type) {
  return typeLabels[type] ?? type
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fa-IR')
}

function formatMoney(value) {
  if (!value) return '۰ ریال'
  return new Intl.NumberFormat('fa-IR').format(value) + ' ریال'
}

function editProject() {

  toast.add({ severity: 'info', summary: 'توجه', detail: 'ویرایش از لیست پروژه‌ها امکان‌پذیر است', life: 3000 })
}

async function loadProject() {
  loading.value = true
  try {
    const { data } = await projectService.get(route.params.id)
    project.value = data
  } catch (err) {
    toast.add({ severity: 'error', summary: 'خطا', detail: 'بارگذاری پروژه با خطا مواجه شد', life: 3000 })
    await router.push({name: 'projects.index'})
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProject()
})
</script>
