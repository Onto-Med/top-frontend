<template>
  <table>
    <tr>
      <td colspan="2" class="q-pb-md">
        <q-btn
          icon="add"
          color="primary"
          class="q-mr-md"
          :label="t('addThing', { thing: t('mapping') })"
          @click="addMapping()"
        />
      </td>

      <td class="q-pb-md">
        <q-input
          :model-value="defaultValue"
          :label="t('defaultValue')"
          :hint="t('defaultValueHint')"
          :readonly="readonly"
          type="number"
          debounce="500"
          @update:model-value="setDefaultValue($event as number | undefined)"
        />
      </td>
    </tr>

    <tr v-for="(mapping, index) in mappings" :key="index">
      <td>
        <entity-chip
          :entity-id="mapping.entityId"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :disable="readonly"
          :entity-types="entityTypes"
          :label="t('selectThing', { thing: t('phenotype') }) + '...'"
          changeable
          @entity-clicked="$emit('entityClicked', $event)"
          @entity-set="setMappingEntity(index, $event?.id)"
        />
      </td>
      <td>
        <q-icon
          v-if="!mapping.entityId || !mapping.value"
          :title="t('invalid', { thing: t('mapping') })"
          color="negative"
          name="dangerous"
          size="sm"
        />
        <q-icon v-else name="arrow_right_alt" size="md" />
      </td>
      <td>
        <q-input
          :model-value="mapping.value"
          :label="t('score')"
          :disable="readonly"
          dense
          type="number"
          debounce="500"
          @update:model-value="setMappingValue(index, $event as number | undefined)"
        />
      </td>
      <td>
        <q-btn
          dense
          color="red"
          icon="remove"
          :disable="readonly"
          :title="t('remove')"
          @click="removeMappingByIndex(index)"
        />
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataType, EntityType, Expression, NumberValue } from '@onto-med/top-api'
import { useI18n } from 'vue-i18n'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import { storeToRefs } from 'pinia'
import { useEntity } from 'src/pinia/entity'

const props = defineProps({
  modelValue: {
    type: Object as () => Expression,
    default: () => {
      return {
        function: 'switch',
        arguments: []
      }
    }
  },
  expanded: Boolean,
  readonly: Boolean,
  showHelp: Boolean
})

const emit = defineEmits(['update:modelValue', 'entityClicked'])

const { t } = useI18n()
const { organisationId, repositoryId } = storeToRefs(useEntity())
const entityTypes = [
  EntityType.SinglePhenotype,
  EntityType.SingleRestriction,
  EntityType.CompositePhenotype,
  EntityType.CompositeRestriction
]

const hasDefaultValue = computed(() => props.modelValue.arguments && props.modelValue.arguments.length % 2 !== 0)
const defaultValue = computed(() => {
  if (props.modelValue.arguments && hasDefaultValue.value) {
    const values = props.modelValue.arguments[props.modelValue.arguments.length - 1].values
    if (values && values.length) return (values[0] as NumberValue).value
  }
  return undefined
})
const mappings = computed(() => {
  if (!props.modelValue.arguments) return []
  return props.modelValue.arguments
    .slice(0, props.modelValue.arguments.length - (hasDefaultValue.value ? 1 : 0))
    .reduce((prev, val, i, array) => {
      if (i % 2 === 0) {
        const values = array[i + 1].values
        prev.push({
          entityId: val.entityId,
          value: values && values.length ? (values[0] as NumberValue).value : undefined
        })
      }
      return prev
    }, [] as Mapping[])
})

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

function buildValueConstant(value?: number) {
  return {
    functionId: 'value',
    values: [{ dataType: DataType.Number, value: value } as NumberValue]
  } as Expression
}

function addMapping() {
  const newModelValue = clone(props.modelValue)
  if (!newModelValue.arguments) newModelValue.arguments = []
  const defaultValue = hasDefaultValue.value
    ? newModelValue.arguments.splice(newModelValue.arguments.length - 1)
    : undefined
  newModelValue.arguments.push({ functionId: 'entity', entityId: undefined })
  newModelValue.arguments.push(buildValueConstant(undefined))
  if (defaultValue) newModelValue.arguments.push(...defaultValue)
  emit('update:modelValue', newModelValue)
}

function removeMappingByIndex(index: number) {
  const newModelValue = clone(props.modelValue)
  newModelValue.arguments?.splice(index * 2, 2)
  emit('update:modelValue', newModelValue)
}

function setDefaultValue(value?: number) {
  const newModelValue = clone(props.modelValue)
  if (!newModelValue.arguments) newModelValue.arguments = []
  if (hasDefaultValue.value) newModelValue.arguments.splice(newModelValue.arguments.length - 1)
  if (value) newModelValue.arguments.push(buildValueConstant(value))
  emit('update:modelValue', newModelValue)
}

function setMappingEntity(index: number, entityId?: string) {
  const newModelValue = clone(props.modelValue)
  if (!newModelValue.arguments || !newModelValue.arguments[index * 2]) return
  newModelValue.arguments[index * 2] = { functionId: 'entity', entityId: entityId }
  emit('update:modelValue', newModelValue)
}

function setMappingValue(index: number, value?: number) {
  const newModelValue = clone(props.modelValue)
  if (!newModelValue.arguments || !newModelValue.arguments[index * 2 + 1]) return
  newModelValue.arguments[index * 2 + 1] = buildValueConstant(value)
  emit('update:modelValue', newModelValue)
}

interface Mapping {
  entityId?: string
  value?: number
}
</script>
