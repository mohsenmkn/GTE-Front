<!-- resources/js/views/projects/WbsTaskForm.vue -->
<template>
  <Dialog
      v-model:visible="localVisible"
      :header="taskId ? 'ویرایش تسک' : 'تسک جدید'"
      modal
      :style="{ width: '600px' }"
      class="wbs-task-form"
  >

    <Message v-if="serverError" severity="error" :closable="true" @close="serverError = ''">
      {{ serverError }}
    </Message>

    <form @submit.prevent="submit" class="task-form">
      <!-- عنوان و توضیحات -->
      <div class="form-field">
        <label for="title" class="required">عنوان تسک</label>
        <InputText
            id="title"
            v-model="form.title"
            placeholder="عنوان تسک"
            :invalid="!!errors.title"
            @input="clearFieldError('title')"
            class="w-full"
        />
        <small v-if="errors.title" class="error-text">{{ errors.title[0] }}</small>
      </div>

      <!-- اولویت و وضعیت -->
      <div class="form-row">
        <div class="form-field">
          <label for="priority" class="required">اولویت</label>
          <Select
              id="priority"
              v-model="form.priority"
              :options="priorityOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب اولویت"
              :invalid="!!errors.priority"
              @change="clearFieldError('priority')"
              class="w-full"
          />
          <small v-if="errors.priority" class="error-text">{{ errors.priority[0] }}</small>
        </div>

        <div class="form-field">
          <label for="status" class="required">وضعیت</label>
          <Select
              id="status"
              v-model="form.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="انتخاب وضعیت"
              :invalid="!!errors.status"
              @change="clearFieldError('status')"
              class="w-full"
          />
          <small v-if="errors.status" class="error-text">{{ errors.status[0] }}</small>
        </div>
      </div>

      <!-- مسئول و پیشرفت -->
      <div class="form-row">
        <div class="form-field">
          <label for="assigned_to">مسئول تسک</label>
          <Select
              id="assigned_to"
              v-model="form.assigned_to"
              :options="users"
              option-label="name"
              option-value="id"
              placeholder="انتخاب مسئول"
              :invalid="!!errors.assigned_to"
              @change="clearFieldError('assigned_to')"
              class="w-full"
              filter
              show-clear
          />
          <small v-if="errors.assigned_to" class="error-text">{{ errors.assigned_to[0] }}</small>
        </div>

        <div class="form-field">
          <label for="progress_percent">درصد پیشرفت</label>
          <div class="progress-input">
            <InputNumber
                id="progress_percent"
                v-model="form.progress_percent"
                placeholder="0"
                :min="0"
                :max="100"
                :invalid="!!errors.progress_percent"
                @input="clearFieldError('progress_percent')"
                class="w-full"
            />
            <span class="percent-sign">%</span>
          </div>
          <small v-if="errors.progress_percent" class="error-text">{{ errors.progress_percent[0] }}</small>
        </div>
      </div>

      <!-- تاریخ‌ها -->
      <div class="form-row">
        <div class="form-field">
          <label for="start_date">تاریخ شروع</label>
          <DatePicker
              id="start_date"
              v-model="form.start_date"
              format="YYYY-MM-DD"
              display-format="jYYYY/jMM/jDD"
              show-icon
              :invalid="!!errors.start_date"
              @date-select="clearFieldError('start_date')"
              class="w-full"
          />
          <small v-if="errors.start_date" class="error-text">{{ errors.start_date[0] }}</small>
        </div>

        <div class="form-field">
          <label for="due_date">تاریخ سررسید</label>
          <DatePicker
              id="due_date"
              v-model="form.due_date"
              format="YYYY-MM-DD"
              display-format="jYYYY/jMM/jDD"
              show-icon
              :invalid="!!errors.due_date"
              @date-select="clearFieldError('due_date')"
              class="w-full"
          />
          <small v-if="errors.due_date" class="error-text">{{ errors.due_date[0] }}</small>
        </div>
      </div>

      <!-- ساعت‌ها -->
      <div class="form-row">
        <div class="form-field">
          <label for="estimated_hours">ساعت تخمینی</label>
          <InputNumber
              id="estimated_hours"
              v-model="form.estimated_hours"
              placeholder="0"
              :min="0"
              :invalid="!!errors.estimated_hours"
              @input="clearFieldError('estimated_hours')"
              class="w-full"
          />
          <small v-if="errors.estimated_hours" class="error-text">{{ errors.estimated_hours[0] }}</small>
        </div>

        <div class="form-field">
          <label for="actual_hours">ساعت واقعی</label>
          <InputNumber
              id="actual_hours"
              v-model="form.actual_hours"
              placeholder="0"
              :min="0"
              :invalid="!!errors.actual_hours"
              @input="clearFieldError('actual_hours')"
              class="w-full"
          />
          <small v-if="errors.actual_hours" class="error-text">{{ errors.actual_hours[0] }}</small>
        </div>
      </div>

      <!-- توضیحات -->
      <div class="form-field">
        <label for="description">توضیحات</label>
        <Textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="توضیحات تکمیلی..."
            :invalid="!!errors.description"
            @input="clearFieldError('description')"
            class="w-full"
            auto-resize
        />
        <small v-if="errors.description" class="error-text">{{ errors.description[0] }}</small>
      </div>

      <!-- یادداشت‌ها -->
      <div class="form-field">
        <label for="notes">یادداشت‌ها</label>
        <Textarea
            id="notes"
            v-model="form.notes"
            rows="2"
            placeholder="یادداشت‌های اضافی..."
            :invalid="!!errors.notes"
            @input="clearFieldError('notes')"
            class="w-full"
            auto-resize
        />
        <small v-if="errors.notes" class="error-text">{{ errors.notes[0] }}</small>
      </div>

      <!-- دکمه‌ها -->
      <div class="form-actions">
        <Button
            label="انصراف"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="cancel"
            type="button"
            :disabled="loading"
        />
        <Button
            :label="taskId ? 'بروزرسانی' : 'ثبت تسک'"
            :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            type="submit"
            :loading="loading"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { wbsService } from '@/services/wbsService'
import api from '@/api/axios'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  wbsItemId: {
    type: [Number, String],
    required: true
  },
  taskId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const toast = useToast()

// State
const loading = ref(false)
const errors = ref({})
const serverError = ref('')
const users = ref([])

const priorityOptions = [
  { label: 'کم', value: 'low' },
  { label: 'متوسط', value: 'medium' },
  { label: 'بالا', value: 'high' },
  { label: 'بحرانی', value: 'critical' }
]

const statusOptions = [
  { label: 'در انتظار', value: 'pending' },
  { label: 'در حال انجام', value: 'in_progress' },
  { label: 'تکمیل شده', value: 'completed' },
  { label: 'مسدود', value: 'blocked' }
]

const defaultForm = () => ({
  title: '',
  description: '',
  assigned_to: null,
  start_date: null,
  due_date: null,
  priority: 'medium',
  status: 'pending',
  progress_percent: 0,
  estimated_hours: null,
  actual_hours: null,
  notes: ''
})

const form = reactive(defaultForm())

// Computed
const localVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})


// Methods
const loadUsers = async () => {
  try {
    const response = await api.get('/users?all=1')
    users.value = response.data.data || []
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const loadTask = async () => {
  if (!props.taskId || !props.wbsItemId) return

  try {
    loading.value = true
    // اگر سرویس متد جداگانه برای getTask داره استفاده کن
    const response = await wbsService.getTasks(props.wbsItemId,props.taskId)
    // یا اگر getTasks همون کار رو میکنه
    const data = response.data.data || response.data

    // اگر data آرایه هست، اولین عنصر رو بگیر
    const taskData = Array.isArray(data) ? data[0] : data
    console.log("Task iiis:",taskData)
    Object.assign(form, {
      title: taskData.title || '',
      description: taskData.description || '',
      assigned_to: taskData.assigned_to || null,
      start_date: taskData.start_date ? new Date(taskData.start_date) : null,
      due_date: taskData.due_date ? new Date(taskData.due_date) : null,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      progress_percent: taskData.progress_percent || 0,
      estimated_hours: taskData.estimated_hours || null,
      actual_hours: taskData.actual_hours || null,
      notes: taskData.notes || ''
    })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  errors.value = {}
  serverError.value = ''
  loading.value = true
  try {

    const payload = {
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      start_date: form.start_date,
      due_date: form.due_date,
      priority: form.priority,
      status: form.status,
      progress_percent: form.progress_percent || 0,
      estimated_hours: form.estimated_hours || null,
      actual_hours: form.actual_hours || null,
      notes: form.notes || null

    }
    //console.log(payload)
    if (props.taskId) {
      // ✅ ویرایش تسک (نیاز به wbs_item_id نداره چون در URL هست)
      await wbsService.updateTask(props.wbsItemId, props.taskId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تسک با موفقیت بروزرسانی شد',
        life: 3000
      })
    } else {
      // ✅ ایجاد تسک جدید
      await wbsService.createTask(props.wbsItemId, payload)
      toast.add({
        severity: 'success',
        summary: 'موفق',
        detail: 'تسک با موفقیت ایجاد شد',
        life: 3000
      })
    }

    setTimeout(() => {
      emit('saved')
      localVisible.value = false
    }, 1000)

  } catch (error) {
    console.error('❌ Task submit error:', error)
    console.error('❌ Error response:', error.response?.data)

    if (error.response?.status === 422) {
      errors.value = error.response.data.errors || {}
      serverError.value = 'لطفاً خطاهای فرم را بررسی کنید'

      const errorMessages = Object.values(errors.value).flat().join('\n')
      toast.add({
        severity: 'error',
        summary: 'خطای اعتبارسنجی',
        detail: errorMessages || 'لطفاً فیلدهای فرم را بررسی کنید',
        life: 5000
      })
    } else {
      serverError.value = error.response?.data?.message || 'خطای سرور. لطفاً مجدداً تلاش کنید'
      toast.add({
        severity: 'error',
        summary: 'خطا',
        detail: serverError.value,
        life: 5000
      })
    }
  } finally {
    loading.value = false
  }
}


const cancel = () => {
  Object.assign(form, defaultForm())
  errors.value = {}
  serverError.value = ''
  localVisible.value = false
}

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
  if (serverError.value) {
    serverError.value = ''
  }
}

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal) {
    errors.value = {}
    serverError.value = ''
    loadUsers()

    if (props.taskId) {
      loadTask()
    } else {
      Object.assign(form, defaultForm())
    }
  }console.log(props.taskId)
})
</script>

<style scoped>
.wbs-task-form :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

label.required::after {
  content: ' *';
  color: var(--red-500);
}

.error-text {
  color: var(--red-500);
  font-size: 0.85rem;
  display: block;
  margin-top: 0.25rem;
}

.progress-input {
  position: relative;
}

.percent-sign {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>