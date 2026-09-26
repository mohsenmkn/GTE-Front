<template>
  <div class="document-tab">
    <DocumentGrid
        :company-id="companyId"
        documentable-type="project"
        :documentable-id="projectId"
    />
  </div>
</template>

<script setup>
import DocumentGrid from './DocumentGrid.vue'

const props = defineProps({
  projectId: {
    type: [Number, String],
    required: true
  },
  companyId: {
    type: [Number, String],
    required: true
  }
})
</script>

<style scoped>
.document-tab {
  padding: 0.5rem;
}
</style>