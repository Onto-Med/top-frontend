<template>
  <div class="clickable">
    <span v-show="expand">{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>
    <span
      v-if="defaultConstant"
      :title="t('rightClickShowDoc')"
      @click.right="showConstantDoc(defaultConstant)"
    >
      {{ defaultConstant.title || defaultConstant.id }}
    </span>
    <span v-else-if="value">
      {{ isStringValue ? '"' + value.value + '"' : value.value }}
    </span>
    <span v-else>
      {{ '[' + t('constant') + ']' }}
    </span>
  </div>
  <q-popup-edit
    v-if="!readonly"
    ref="popup"
    v-slot="scope"
    :model-value="value?.value"
    :cover="false"
    class="q-pa-none"
    auto-save
    @update:model-value="setValue($event)"
  >
    <div v-show="!isValueSet">
      <!-- @vue-expect-error TS2322 -->
      <q-input
        v-model="scope.value"
        :type="toInputType(dataType)"
        dense
        autofocus
        @keyup.enter="scope.set"
      >
        <template #before>
          <q-btn flat dense :icon="dataTypeIcon" :title="dataType" @click="toggleDataType" />
        </template>
        <template #after>
          <q-icon v-close-popup clickable name="check" class="cursor-pointer" />
        </template>
      </q-input>
      <q-list v-if="constants" dense>
        <q-item
          v-for="constant in constants"
          :key="constant.id"
          v-close-popup
          clickable
          class="items-center justify-between text-no-wrap"
          @click="$emit('update:constantId', constant.id)"
        >
          <q-item-section :title="t('rightClickShowDoc')" @click.right="showConstantDoc(constant)">
            {{ constant.title || constant.id }}
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator />
    </div>
    <q-list dense>
      <q-item
        v-if="baseDocUrl && defaultConstant"
        clickable
        target="_blank"
        :href="baseDocUrl + defaultConstant.id + '.html'"
      >
        <q-item-section>
          {{ t('showThing', { thing: t('documentation') }) }}
        </q-item-section>
      </q-item>
      <q-separator v-if="baseDocUrl && defaultConstant" />
      <q-item clickable @click="$emit('enclose')">
        <q-item-section>{{ t('encloseWithExpression') }}</q-item-section>
      </q-item>
      <q-item v-show="isValueSet" clickable @click="$emit('update:value', undefined)">
        <q-item-section>{{ t('change') }}</q-item-section>
      </q-item>
      <q-item v-close-popup clickable @click="$emit('remove')">
        <q-item-section>{{ t('remove') }}</q-item-section>
      </q-item>
    </q-list>
  </q-popup-edit>
</template>

<script setup lang="ts">
import {
  BooleanValue,
  Constant,
  DataType,
  DateTimeValue,
  NumberValue,
  StringValue,
  Value,
} from '@onto-med/top-api'
import { QPopupEdit } from 'quasar'
import { useEntityStore } from 'src/stores/entity-store'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { env } from 'src/config'

const props = defineProps({
  value: Object as () => BooleanValue | DateTimeValue | NumberValue | StringValue | undefined,
  constantId: String,
  readonly: Boolean,
  expand: Boolean,
  indentLevel: {
    type: Number,
    default: 0,
  },
  indent: {
    type: Number,
    default: 2,
  },
  simpleConstant: Boolean,
})

const emit = defineEmits(['update:value', 'update:constantId', 'enclose', 'remove'])

const { t } = useI18n()
const popup = ref(null as unknown as QPopupEdit)
const entityStore = useEntityStore()
const constants = ref(undefined as Constant[] | undefined)
const dataType = ref(DataType.Number)
const isValueSet = computed(() => props.value || defaultConstant.value)

if (!props.simpleConstant) {
  void entityStore.getConstants().then((o) => (constants.value = o))
}

onMounted(() => {
  if (!props.value && !props.constantId) popup.value.show()
})

const defaultConstant = computed(() => constants.value?.find((c) => c.id === props.constantId))
const isStringValue = computed(() => props.value?.dataType === DataType.String)

const baseDocUrl = computed(() => {
  const baseUrl = env.TOP_PHENOTYPIC_QUERY_DOC_BASE_URL
  return !baseUrl ? undefined : `${baseUrl}/constants`
})

const dataTypeIcon = computed(() => {
  if (dataType.value === DataType.Number) return 'pin'
  else if (dataType.value === DataType.DateTime) return 'today'
  else if (dataType.value === DataType.String) return 'article'
  return 'question_mark'
})

function toValue(
  value: string | number | Date | boolean | undefined,
  dataType: DataType,
): Value | undefined {
  if (dataType === DataType.String) return { value: value, dataType: dataType } as StringValue
  if (dataType === DataType.Number) return { value: value, dataType: dataType } as NumberValue
  if (dataType === DataType.DateTime) return { value: value, dataType: dataType } as DateTimeValue
  if (dataType === DataType.Boolean) return { value: value, dataType: dataType } as BooleanValue
  return undefined
}

function setValue(value: string | number | Date | boolean | undefined) {
  emit('update:value', toValue(value, dataType.value))
}

function toggleDataType() {
  if (dataType.value === DataType.Number) dataType.value = DataType.DateTime
  else if (dataType.value === DataType.DateTime) dataType.value = DataType.String
  else dataType.value = DataType.Number
}

function toInputType(dataType: DataType): string {
  if (dataType === DataType.DateTime) return 'datetime-local'
  return dataType
}

function showConstantDoc(constant: Constant) {
  if (baseDocUrl.value) window.open(`${baseDocUrl.value}/${constant.id}.html`, '_blank')
}
</script>

<style lang="scss" scoped>
.hover {
  color: var(--q-primary);
  font-weight: 900;
}

.clickable {
  display: inline;
  &:hover {
    cursor: pointer;
    @extend .hover;
  }
}
</style>
