<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-content">
      <q-card-section>
        <div v-t="'terminologyImport.title'" class="text-h6" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <code-input no-btn autofocus @select="selection = $event" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <div
          v-if="!entity"
          v-t="'terminologyImport.description'"
          class="text-italic q-pa-md"
        />
        <div v-else>
          <div class="row q-px-sm q-pb-sm">
            <entity-display
              :entity="entity"
              show-descriptions
              show-entity-type
              show-synonyms
              class="col"
            />
            <div v-if="isPhenotype(entity)" class="col-4">
              <enum-select v-model:selected="itemType" i18n-prefix="itemType" :enum="ItemType" dense required />
              <enum-select v-model:selected="dataType" i18n-prefix="dataType" :enum="DataType" dense required />
              <unit-input v-if="dataType === DataType.Number" v-model:model-value="unit" dense show-label />
            </div>
          </div>

          <q-expansion-item
            v-if="isPhenotype(entity)"
            v-model:model-value="withRestrictions"
            :label="t('withRestriction', 2)"
            expand-separator
            switch-toggle-side
          >
            <div class="q-pa-sm">
              <div v-for="(restriction, index) in restrictions" :key="index" class="row">
                <range-input
                  v-model:min-operator="restriction.minOperator"
                  v-model:minimum="(restriction.values as (number|Date|undefined)[])[0]"
                  v-model:max-operator="restriction.maxOperator"
                  v-model:maximum="(restriction.values as (number|Date|undefined)[])[1]"
                  :type="entity.dataType"
                  class="col no-wrap"
                />
                <q-btn flat class="col-auto" icon="clear" @click="restrictions.splice(index, 1)" />
              </div>
              <q-btn
                no-caps
                class="q-mt-sm"
                icon="add"
                color="primary"
                :label="t('addThing', { thing: t('restriction') })"
                @click="addRestriction"
              />
            </div>
          </q-expansion-item>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn flat :disable="!isValid" :label="t('import')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Code, DataType, Entity, EntityType, ItemType, NumberRestriction, Phenotype, RepositoryType, SingleConcept } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeInput from 'src/components/EntityEditor/Code/CodeInput.vue'
import EntityDisplay from './EntityDisplay.vue'
import RangeInput from './RangeInput.vue'
import UnitInput from '../UnitInput.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { v4 as uuidv4 } from 'uuid'
import { useEntity } from 'src/pinia/entity'
import useNotify from 'src/mixins/useNotify'
import EnumSelect from '../EnumSelect.vue'

const props = defineProps({
  repositoryType: {
    type: String as () => RepositoryType,
    default: RepositoryType.PhenotypeRepository
  },
  superEntity: Object as () => Entity
})

defineEmits(['hide', 'ok'])

const { locale, t } = useI18n()
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const { isPhenotype, isConcept, restrictionToString } = useEntityFormatter()
const entityStore = useEntity()
const { notify, renderError } = useNotify()
const onCancelClick = onDialogCancel
const selection = ref<Code>()
const withRestrictions = ref(false)
const restrictions = ref<NumberRestriction[]>([])
const itemType = ref<ItemType>()
const dataType = ref<DataType>()
const unit = ref<string>()

const entity = computed(() => {
  if (selection.value)
    return toEntity(selection.value)
  return undefined
})

const isValid = computed(() => {
  if (isPhenotype(entity.value)) {
    return entity.value.dataType !== undefined
  }
  if (isConcept(entity.value)) {
    return true
  }
  return false
})

function addRestriction () {
  if (!entity.value || props.repositoryType !== RepositoryType.PhenotypeRepository)
    return
  restrictions.value.push({
    type: (entity.value as Phenotype).dataType as DataType,
    values: []
  })
}

function toEntity (code: Code) {
  if (props.repositoryType === RepositoryType.ConceptRepository) {
    return {
      codes: [ code ],
      entityType: EntityType.SingleConcept,
      id: (uuidv4 as () => string)(),
      superConcepts: props.superEntity ? [ props.superEntity ]: [],
      synonyms: code.synonyms?.map(s => ({ lang: locale.value, text: s })),
      titles: [ {
        lang: locale.value,
        text: (code.name || t('unnamedConcept'))
      } ]
    } as SingleConcept
  }
  if (props.repositoryType === RepositoryType.PhenotypeRepository) {
    return {
      codes: [ code ],
      dataType: dataType.value,
      entityType: EntityType.SinglePhenotype,
      id: (uuidv4 as () => string)(),
      itemType: itemType.value,
      superCategories: props.superEntity ? [ props.superEntity ]: [],
      synonyms: code.synonyms?.map(s => ({ lang: locale.value, text: s })),
      titles: [ {
        lang: locale.value,
        text: (code.name || t('unnamedPhenotype'))
      } ],
      unit: dataType.value === DataType.Number ? unit.value : undefined
    } as Phenotype
  }
  return undefined
}

function onOkClick () {
  if (!entity.value) return
  entityStore.saveEntity(entity.value)
    .then(() => {
      if (props.repositoryType === RepositoryType.PhenotypeRepository) {
        return Promise.all(restrictions.value.map(async r => {
          await entityStore.saveEntity({
            id: (uuidv4 as () => string)(),
            dataType: DataType.Boolean,
            entityType: EntityType.SingleRestriction,
            superPhenotype: entity.value,
            titles: [ { lang: locale.value, text: restrictionToString(r) }],
            restriction: r
          } as Phenotype)
        }))
      }
    })
    .then((r) => {
      onDialogOK()
      notify(t('entityImported', { count: (r?.length || 0) + 1 }), 'positive')
    })
    .catch((e: Error) => renderError(e))
}
</script>

<style lang="sass">
.dialog-content
  min-width: 30vw
</style>
