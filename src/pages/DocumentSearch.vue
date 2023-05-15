<template>
  <q-page class="q-gutter-md">
    <q-splitter v-model="splitterModel" style="min-height: inherit; height: 100px">
      <template #before>
        <div class="column fit">
          <q-card class="col">
            <q-card-section>
              <div class="text-subtitle2">
                {{ t('concept', 2) }}
              </div>
            </q-card-section>
            <q-card-section class="row">
              <div class="col-10">
                <q-select
                  v-model="conceptMode"
                  :options="conceptModeOptions"
                  :label="t('selectionMode')"
                  emit-value
                  map-options
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <q-icon :name="scope.opt.icon" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>
                          {{ scope.opt.label }}
                        </q-item-label>
                        <q-item-label caption>
                          {{ scope.opt.description }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <div class="col-10">
                <q-select
                  v-model="mostImportantNodes"
                  :options="mostImportantNodesOptions"
                  :label="t('importantNodesOnly')"
                  emit-value
                  map-options
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section>
                        <q-item-label>
                          {{ scope.opt.label }}
                        </q-item-label>
                        <q-item-label caption>
                          {{ scope.opt.description }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </q-card-section>
            <q-card-section class="row">
              <q-chip
                v-for="(concept, index) in concepts"
                :key="concept.id"
                class="col-10 cursor-pointer relative-position"
                :style="selectedColors[index]"
                clickable
                @click="chooseConcept(index, false)"
              >
                <div class="ellipsis">
                  {{ concept.labels }}
                </div>
                <q-tooltip :delay="500" anchor="center right" self="center left" :offset="[10, 10]">
                  {{ concept.labels }}
                </q-tooltip>
              </q-chip>
            </q-card-section>
          </q-card>
        </div>
      </template>

      <template #after>
        <div class="column fit">
          <div class="row col no-wrap justify-between">
            <q-card class="col">
              <q-card-section>
                <div class="text-subtitle2">
                  {{ t('document', 2) }} <a v-if="documents.length > 0">
                    ({{ t('resultCount', documents.length) }})
                  </a>
                </div>
              </q-card-section>
              <!--  TODO: need to find a better solution for style height -->
              <q-virtual-scroll
                v-slot="{ item }"
                style="height: 94%"
                :items="documents"
                separator
              >
                <q-item
                  :key="item.id"
                  class="cursor-pointer relative-position"
                  clickable
                  @click="chooseDocument(item.id)"
                >
                  <q-item-section>
                    <q-item-label
                      :style="{'font-size': '18px', 'color': '#696969', 'font-weight': 'bold'}"
                    >
                      {{ item.name }}
                    </q-item-label>
                    <q-item-label
                      caption
                      lines="2"
                      :style="{'font-size': '14px'}"
                    >
                      First line of doc or some such thing
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-virtual-scroll>
            </q-card>

            <q-card class="col">
              <q-card-section>
                <div class="text-subtitle2">
                  {{ t('details', 2) }}
                </div>
              </q-card-section>
              <q-scroll-area v-if="document_" style="height: 94%">
                <q-card-section>
                  <div class="text-h6">
                    {{ document_.name }}
                  </div>
                </q-card-section>
                <q-card-section>
                  <div style="line-height: 1.6" v-html="document_.highlightedText" />
                </q-card-section>
              </q-scroll-area>
            </q-card>
          </div>
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DocumentApiKey, ConceptApiKey } from 'src/boot/axios'
import { Document, ConceptCluster } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const { renderError }  = useNotify()
    const documentApi      = inject(DocumentApiKey)
    const conceptApi       = inject(ConceptApiKey)
    const documents        = ref<Document[]>([])
    const document_        = ref<Document>()
    const concepts         = ref<ConceptCluster[]>([])
    const loading          = ref(false)
    const selectedConcepts = ref<number[]>([])
    const distinctColors   = [
      '#556b2f', '#228b22',
      '#7f0000', '#483d8b', '#008b8b', '#cd853f',
      '#4682b4', '#000080', '#8fbc8f', '#800080',
      '#b03060', '#ff0000', '#ffa500', '#00ff00',
      '#dc143c', '#00ffff', '#0000ff', '#f08080',
      '#adff2f', '#ff00ff', '#1e90ff', '#f0e68c',
      '#ffff54', '#dda0dd', '#90ee90', '#7b68ee',
      '#00ff7f', '#ff1493', '#696969', '#d3d3d3'
    ]
    const distinctColorsFont = [
      '#ffffff', '#ffffff',
      '#ffffff', '#ffffff', '#000000', '#000000',
      '#000000', '#ffffff', '#000000', '#ffffff',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#ffffff', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#000000', '#000000',
      '#000000', '#000000', '#ffffff', '#000000'
    ]
    const conceptColors: ConceptColor[] = [] //ToDo: const? or ref?
    const selectedColors                = ref<ConceptColor[]>([])
    const conceptMode                   = ref('exclusive')
    const mostImportantNodes            = ref(true)

    let lastSelectedConcept = -1

    const reload = async () => {
      if (!conceptApi || !documentApi) return
      loading.value = true
      await conceptApi.getConceptClusters()
        .then(r => {
          concepts.value = r.data
          concepts.value.forEach(function (concept, index) {
            conceptColors.push({
              'background-color': distinctColors[index],
              'color': distinctColorsFont[index]
            })
          });

          selectedColors.value = new Array(concepts.value.length)
            .fill({ 'background-color': '', 'color': '' }) as ConceptColor[]
        })
        .catch((e: Error) => renderError(e))
        .finally(() => loading.value = false)
    }

    const chooseConcept = async (idx: number | undefined, changedConceptMode: boolean | undefined) => {
      if (!documentApi) return
      console.log('Concept ID: ', idx)
      console.log(documents.value.length)
      if (idx !== undefined) {
        documents.value.length = 0;
        if (changedConceptMode !== true) {
          if (conceptMode.value === 'exclusive') {
            selectedConcepts.value.length = 0
            selectedConcepts.value.push(idx)
          } else if (selectedConcepts.value.includes(idx)) {
            selectedConcepts.value = selectedConcepts.value.filter(function (item) {
              return item !== idx
            })
          } else {
            selectedConcepts.value.push(idx)
          }
          lastSelectedConcept = idx
        }
      }

      if (selectedConcepts.value.length !== 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        await documentApi.getDocumentsByConceptIds(
          selectedConcepts.value.map(selConcept => {
            return concepts.value[selConcept].id
          }), conceptMode.value, undefined, mostImportantNodes.value
        )
          .then(r => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            documents.value = r.data//.map(doc => doc.id).filter(id => id !== undefined) as string[]
          })
          .catch((e: Error) => renderError(e))
      } else {document_.value = undefined}
      selectedColors.value.fill({'background-color': '', 'color': ''})
      selectedConcepts.value.forEach( function (_idx) {selectedColors.value[_idx] = conceptColors[_idx]})
    }

    onMounted(async () => {
      await reload()
    })

    watch(
      () => conceptMode.value,
      (value, oldValue) => {
        if (value === oldValue) return
        if (selectedConcepts.value.length <= 1) return

        if (conceptMode.value === 'exclusive') {
          chooseConcept(lastSelectedConcept, false)
            .catch((e: Error) => renderError(e))
        } else {
          chooseConcept(lastSelectedConcept, true)
            .catch((e: Error) => renderError(e))
        }
      }
    )

    watch(
      () => mostImportantNodes.value,
      () => {
        chooseConcept(undefined, undefined)
          .catch((e: Error) => renderError(e))
      }
    )

    return {
      t,
      splitterModel: ref(20),
      document_,
      documents,
      concepts,
      loading,
      reload,
      alert,
      selectedColors,
      conceptMode,
      mostImportantNodes,
      chooseConcept,
      async chooseDocument (documentId: string) {
        if (!documentApi) return
        console.log(documentId)
        await documentApi.getDocumentById(documentId,
          selectedConcepts.value.map(selConcept => {
            return concepts.value[selConcept].id
          })
        )
          .then(r => {
            document_.value = r.data
          })
          .catch((e: Error) => renderError(e))
      },

      conceptModeOptions: computed(() => [
        {
          label: t('exclusive'),
          value: 'exclusive',
          icon: 'mdi-circle'
        },
        {
          label: t('union'),
          value: 'union',
          icon: 'mdi-set-all'
        },
        {
          label: t('intersection'),
          value: 'intersection',
          icon: 'mdi-set-center'
        }
      ]),
      mostImportantNodesOptions: computed(() => [
        {
          label: t('yes'),
          value: true,
        },
        {
          label: t('no'),
          value: false,
        }
      ])
    }
  }
})

interface ConceptColor {
  'background-color': string,
  color: string
}
</script>
