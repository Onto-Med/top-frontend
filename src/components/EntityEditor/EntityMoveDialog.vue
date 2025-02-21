<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-content">
      <q-card-section>
        <div class="text-h6">
          {{ t('moveThing', { thing: getTitle(entity) }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="isRestricted(entity)">
        {{ t('movingNotPossible') }}
      </q-card-section>
      <q-card-section v-else>
        <div class="text-bold q-mb-sm">{{ superEntitiesLabel }}:</div>
        <q-list dense>
          <q-item v-for="(superEntity, index) in superEntities" :key="index">
            <entity-chip
              :organisation-id="organisationId"
              :repository-id="repositoryId"
              :entity-types="allowedEntityTypes"
              :entity-id="superEntity ? superEntity.id : undefined"
              :label="t('selectThing', { thing: label }) + '...'"
              removeable
              @remove-clicked="removeSuperEntity(index)"
              @entity-set="setSuperEntity(index, $event)"
              @entity-clicked="routeToSuperEntity(superEntity)"
            />
          </q-item>
          <q-item>
            <q-chip
              icon="add"
              round
              clickable
              :label="t('more')"
              :title="superEntitiesLabel"
              @click="addSuperEntity(undefined)"
            />
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn flat :label="t('move')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Category, Concept, Entity, EntityType } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
import { useI18n } from 'vue-i18n'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { useEntityStore } from 'src/stores/entity-store'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import EntityChip from './EntityChip.vue'
import useNotify from 'src/mixins/useNotify'

const props = defineProps({
  entity: {
    type: Object as () => Entity,
    required: true,
  },
})

const { t } = useI18n()
const { notify, renderError } = useNotify()
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const { getTitle, isCategory, isConcept, isPhenotype, isRestricted, routeToEntity } =
  useEntityFormatter()
const onCancelClick = onDialogCancel
const entityStore = useEntityStore()
const { organisationId, repositoryId } = storeToRefs(entityStore)
const superEntities = ref<(Category | Concept | undefined)[]>([])

const allowedEntityTypes = computed(() =>
  isConcept(props.entity) ? [EntityType.SingleConcept] : [EntityType.Category],
)
const label = computed(() => (isConcept(props.entity) ? t('concept', 2) : t('category', 2)))
const superEntitiesLabel = computed(() =>
  isConcept(props.entity) ? t('superConcept', 2) : t('superCategory', 2),
)

onMounted(() => {
  if ((isCategory(props.entity) || isPhenotype(props.entity)) && props.entity.superCategories)
    superEntities.value = JSON.parse(JSON.stringify(props.entity.superCategories)) as Category[]
  if (isConcept(props.entity) && props.entity.superConcepts)
    superEntities.value = JSON.parse(JSON.stringify(props.entity.superConcepts)) as Concept[]
})

function onOkClick() {
  entityStore
    .moveEntity(props.entity, superEntities.value.filter((e) => !!e) as Entity[])
    .then(() => {
      notify(t('thingMoved', { thing: t('entity') }), 'positive')
      onDialogOK()
    })
    .catch((e: Error) => renderError(e))
}

function addSuperEntity(superEntity: Category | Concept | undefined) {
  if (!superEntity || superEntities.value.findIndex((c) => c && c.id === superEntity.id) === -1)
    if (props.entity.id !== superEntity?.id) superEntities.value.push(superEntity)
}

function setSuperEntity(index: number, superEntity: Category | Concept) {
  if (superEntities.value.findIndex((c) => c && c.id === superEntity.id) === -1)
    if (props.entity.id !== superEntity.id) superEntities.value[index] = superEntity
}

function removeSuperEntity(index: number) {
  superEntities.value.splice(index, 1)
}

function routeToSuperEntity(superEntity?: Entity) {
  if (!superEntity) return
  routeToEntity({ repository: props.entity.repository, ...superEntity })
    .then(() => onDialogHide())
    .catch(() => {})
}
</script>

<style lang="scss">
.dialog-content {
  min-width: 30vw;
}
</style>
