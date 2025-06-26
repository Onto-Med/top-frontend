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
          <q-tooltip :delay="500"> #Documents: {{ phrase.documents?.length }} </q-tooltip>
        </q-chip>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ConceptGraphNodes } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
const { dialogRef, onDialogOK } = useDialogPluginComponent()

const props = defineProps({
  phrases: Array<ConceptGraphNodes>,
  storedPhrases: Array<ConceptGraphNodes>,
})

const selectedPhrases = ref<ConceptGraphNodes[]>(Array.of())

onMounted(() => {
  if (props.storedPhrases === undefined || props.storedPhrases.length === 0) {
    props.phrases
      ?.toSorted((a, b) => {
        if (a.documents === undefined) return 1
        if (b.documents === undefined) return -1
        return b.documents.length - a.documents.length
      })
      .forEach((phrase) => {
        selectedPhrases.value.push(phrase)
      })
  } else {
    props.storedPhrases.forEach((phrase) => selectedPhrases.value.push(phrase))
  }
})

onBeforeUnmount(() => {
  onDialogOK(
    {
      // excluded: props.phrases?.filter((phrase) => selectedPhrases.value.includes(phrase)).map((phrase) => phrase.id),
      excluded: new Set<string|undefined>(props.phrases?.map((p) => p.id)).difference(
        new Set<string|undefined>(selectedPhrases.value.map((p) => p.id))
      ),
      committed: selectedPhrases.value
    }
  )
})

function removePhrase(phrase: ConceptGraphNodes): void {
  const idx = selectedPhrases.value?.indexOf(phrase)
  if (idx !== undefined && idx !== -1) {
    selectedPhrases.value?.splice(idx, 1)
  }
}
</script>

<style scoped lang="sass"></style>
