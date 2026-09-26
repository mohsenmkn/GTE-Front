<template>
  <Select
      v-model="model"
      :options="options"
      :loading="loading"
      optionLabel="label"
      optionValue="id"
      :placeholder="placeholder"
      filter
      class="w-full"
      @filter="onSearch"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import assessmentService from '@/services/assessmentService'

const props = defineProps({
  modelValue: { type: Number, default: null },
  placeholder: { type: String, default: 'انتخاب کاربر...' },
})
const emit = defineEmits(['update:modelValue'])

const model = ref(props.modelValue)
const options = ref([])
const loading = ref(false)

const fetchUsers = async (search = '') => {
  loading.value = true
  try {
    const data = await assessmentService.searchUsers(search)
    options.value = (data.users || []).map(u => ({
      id: u.id,
      label: `${u.name} (${u.personnel_code || '—'})`,
    }))
  } finally {
    loading.value = false
  }
}

const onSearch = (e) => fetchUsers(e.value)

import { watch } from 'vue'
watch(model, (v) => emit('update:modelValue', v))

onMounted(() => fetchUsers())
</script>