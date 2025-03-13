<template>
  <q-dialog ref="dialogRef">
    <q-card>
      <q-card-section>
        <q-chip
          v-for="phrase in selectedPhrases"
          :key="phrase.id"
          removable
          outline
          color="secondary"
          @remove="removePhrase(phrase)"
        >
          {{ phrase.label }}
          <q-tooltip :delay="500">
            #Documents: {{ phrase.documents?.length }}
          </q-tooltip>
        </q-chip>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ConceptGraphNodes } from '@onto-med/top-api'

const props = defineProps({
  phrases: Array<ConceptGraphNodes>
})
const selectedPhrases = ref<ConceptGraphNodes[] | undefined>(props.phrases?.toSorted((a, b) => {
  if (a.documents === undefined) return 1
  if (b.documents === undefined) return -1
  return b.documents.length - a.documents.length
}))

function removePhrase(phrase: ConceptGraphNodes): void {
  let idx = selectedPhrases.value?.indexOf(phrase)
  if (idx !== undefined && idx !== -1) {
    selectedPhrases.value?.splice(idx, 1)
  }
}
</script>

<style scoped lang="sass"></style>
