<template>
  <q-page class="q-gutter-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('document', 2) }}
        </div>
      </q-card-section>
      <q-card-section>
        {{ t('documentPage.description') }}
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('concept', 2) }}
        </div>
      </q-card-section>

      <q-separator />

      <div class="q-pa-md row items-start q-gutter-md">
        <q-card
          v-for="(concept, index) in concepts"
          :key="concept"
          :style="{ background: distinctColors[index], color: distinctColorsFont[index]}">
          <q-card-section>
            {{ concept.text }}
          </q-card-section>
        </q-card>
      </div>
    </q-card>

    <table-with-actions
      :rows="documents"
      :columns="columns"
      :loading="loading"
      @reload-clicked="reload()"
    >
      <template #row-cells="{ row }">
        <q-td auto-width>
          {{ row.id }}
        </q-td>
        <q-td class="q-gutter-md">
          <q-chip v-for="phrase in row.phrases" :key="phrase" size="md">
            {{ phrase }}
          </q-chip>
        </q-td>
      </template>
    </table-with-actions>
  </q-page>
</template>

<script lang="ts">
import {computed, defineComponent, inject, onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey, PhraseApiKey, ConceptApiKey } from 'src/boot/axios'
import { Document, Phrase, Concept } from '@onto-med/top-api';
import TableWithActions from 'components/TableWithActions.vue';

export default defineComponent({
  name: 'DocumentSearch',
  components: {
    TableWithActions,
  },
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const documentApi = inject(DocumentApiKey)
    const phraseApi = inject(PhraseApiKey)
    const conceptApi = inject(ConceptApiKey)
    const documents = ref<Document[]>([])
    const concepts = ref<Concept[]>([])
    const loading = ref(false)
    const columns = computed(() => [
      { name: 'actions', sortable: false },
      { name: 'docId', label: t('document'), align: 'left', required: true, sortable: true },
      { name: 'docPhrases', label: t('phrase',2), align: 'left', sortable: false },
    ])
    const distinctColors = [
      '#696969', '#d3d3d3', '#556b2f', '#228b22',
      '#7f0000', '#483d8b', '#008b8b', '#cd853f',
      '#4682b4', '#000080', '#8fbc8f', '#800080',
      '#b03060', '#ff0000', '#ffa500', '#00ff00',
      '#dc143c', '#00ffff', '#0000ff', '#f08080',
      '#adff2f', '#ff00ff', '#1e90ff', '#f0e68c',
      '#ffff54', '#dda0dd', '#90ee90', '#7b68ee',
      '#00ff7f', '#ff1493']
    const distinctColorsFont = [
      '#ffffff', '#000000', '#ffffff', '#ffffff',
      '#ffffff', '#ffffff', '#000000', '#000000',
      '#000000', '#ffffff', '#000000', '#ffffff',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#ffffff', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000'
    ]

    const reload = async () => {
      if (!documentApi || !phraseApi || !conceptApi) return
      loading.value = true
      await conceptApi.getConcepts()
        .then(r => concepts.value = r.data)
        .catch((e: Error) => alert(e.message))
      await documentApi.getDocuments(undefined, undefined, 0, 10) // ToDo: Read these numbers from table values
        .then(r => documents.value = r.data)
        .catch((e: Error) => alert(e.message))
        .finally(() => loading.value = false)
    }

    onMounted(async () => {
      await reload()
    })

    return {
      t,
      documents,
      concepts,
      loading,
      columns,
      reload,
      alert,
      distinctColors,
      distinctColorsFont,
    }
  }
})
</script>
