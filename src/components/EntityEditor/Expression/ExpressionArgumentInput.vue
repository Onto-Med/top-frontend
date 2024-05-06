<template>
  <div class="expression-input" :class="{ row: !expand, 'text-primary': flash }">
    <slot name="prepend" />
    <div v-if="modelValue?.entityId || isEntity">
      {{ expand ? '&nbsp;'.repeat(indentLevel * indent) : ''
      }}<!--
   --><entity-chip
        :entity-id="modelValue.entityId"
        :entity-types="entityTypes"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :label="t('selectThing', { thing: t('entity') })"
        :disable="readonly"
        include-primary
        :changeable="!readonly"
        removeable
        dense
        @entity-clicked="$emit('entityClicked', $event)"
        @entity-set="setEntity($event)"
        @remove-clicked="clear()"
      >
        <template v-if="!readonly" #additionalOptions>
          <q-item v-close-popup clickable @click="enclose()">
            <q-item-section v-t="'encloseWithExpression'" />
          </q-item>
        </template>
      </entity-chip>
      <slot name="append" />
    </div>
    <div v-else-if="(modelValue?.values && modelValue?.values.length) || modelValue?.constantId || isConstant">
      <expression-value-input
        :value="modelValue.values && modelValue?.values.length ? modelValue.values[0] : undefined"
        :constant-id="modelValue.constantId"
        :readonly="readonly"
        :indent-level="indentLevel"
        :indent="indent"
        :expand="expand"
        :simple-constant="simpleConstants"
        @update:value="setValue($event)"
        @update:constant-id="setConstantId($event)"
        @enclose="enclose()"
        @remove="clear()"
      />
      <slot name="append" />
    </div>
    <template v-else>
      <div v-if="prefix">
        <span :class="{ hover: hover }" class="clickable" @mouseover="hover = true" @mouseleave="hover = false">
          {{ expand ? '&nbsp;'.repeat(indentLevel * indent) : ''
          }}<!--
          --><b v-if="fun" :title="t('rightClickShowDoc')" @click.right="showFunctionDoc()">{{ functionTitle }}</b>
          <span v-else>[{{ t('selectThing', { thing: t('function') }) }}]</span>
          <span v-show="argumentCount">(</span>
        </span>
        <slot v-if="!argumentCount" name="append" />
      </div>
      <div v-else class="clickable" :class="{ hover: hover }" @mouseover="hover = true" @mouseleave="hover = false">
        {{ expand ? '&nbsp;'.repeat(indentLevel * indent) : '' }}(
      </div>

      <div :class="expand ? '' : 'col row items-center'">
        <template v-for="(n, index) in argumentCount" :key="index">
          <span
            v-if="index != 0 && infix"
            :class="{ hover: hover }"
            class="clickable"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            <span>
              {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;'
              }}<!--
              --><b :title="t('rightClickShowDoc')" @click.right="showFunctionDoc()">{{ functionTitle }}</b
              ><!--
              -->{{ !expand ? '&nbsp;' : '' }}
            </span>
          </span>
          <expression-argument-input
            v-if="modelValue.arguments"
            :model-value="modelValue.arguments[index]"
            :readonly="readonly"
            :expand="expand"
            :indent="indent"
            :indent-level="indentLevel + 1"
            :organisation-id="organisationId"
            :repository-id="repositoryId"
            :entity-types="entityTypes"
            :include-function-types="includeFunctionTypes"
            :exclude-function-types="excludeFunctionTypes"
            :exclude-functions="excludeFunctions"
            :simple-constants="simpleConstants"
            @update:model-value="handleArgumentUpdate(index, $event)"
            @entity-clicked="$emit('entityClicked', $event)"
          >
            <template v-if="!infix && (index + 1 < argumentCount || showMoreBtn)" #append>
              <span
                :class="{ hover: hover }"
                @mouseover="hover = true"
                @mouseleave="hover = false"
                @click.stop
              >,{{ !expand ? '&nbsp;' : '' }}</span>
            </template>
          </expression-argument-input>
        </template>

        <template v-if="fun && showMoreBtn">
          <div>
            <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel + 1) * indent) }}</span>
            <q-icon
              name="add"
              class="clickable"
              :title="t('addMoreArguments')"
              @mouseover="hover = true"
              @mouseleave="hover = false"
              @click.stop="handleArgumentUpdate(argumentCount, {})"
            />
          </div>
        </template>

        <div
          v-if="postfix || argumentCount"
          class="clickable"
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          <span>{{ expand ? '&nbsp;'.repeat(indentLevel * indent) : '' }})</span>
          <template v-if="postfix">
            <b :title="t('rightClickShowDoc')" @click.right="showFunctionDoc()">{{ functionTitle }}</b>
          </template>
        </div>
        <slot v-if="postfix || argumentCount" name="append" />
      </div>
      <expression-context-menu
        v-if="!readonly"
        :value="fun"
        :enclosable="!!fun"
        :include-function-types="includeFunctionTypes"
        :exclude-function-types="excludeFunctionTypes"
        :exclude-functions="excludeFunctions"
        @enclose="enclose()"
        @remove="clear()"
        @select="setFunction($event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Entity, EntityType, Expression, ExpressionFunction, NotationEnum, Value } from '@onto-med/top-api'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import ExpressionContextMenu from 'src/components/EntityEditor/Expression/ExpressionContextMenu.vue'
import ExpressionValueInput from 'src/components/EntityEditor/Expression/ExpressionValueInput.vue'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'
import useNotify from 'src/mixins/useNotify'
import { env, noDocFunctionTypes } from 'src/config'

const props = defineProps({
  modelValue: {
    type: Object as () => Expression,
    default: () => ({})
  },
  readonly: Boolean,
  root: Boolean,
  expand: Boolean,
  indent: {
    type: Number,
    default: 2
  },
  indentLevel: {
    type: Number,
    default: 0
  },
  organisationId: String,
  repositoryId: String,
  entityTypes: Array as () => EntityType[],
  includeFunctionTypes: Array as () => string[],
  excludeFunctionTypes: Array as () => string[],
  excludeFunctions: Array as () => string[],
  simpleConstants: Boolean
})

const emit = defineEmits(['update:modelValue', 'entityClicked'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const flash = ref(false)
const isEntity = ref(false)
const isConstant = ref(false)
const entityStore = useEntity()
const { renderError } = useNotify()
const { functions } = storeToRefs(entityStore)
const hover = ref(false)

const fun = computed(() => {
  if (!props.modelValue || !props.modelValue.functionId || !functions.value) return undefined

  const fun = functions.value.find((f) => f.id === props.modelValue?.functionId)

  if (fun) return fun
  return {
    id: props.modelValue.functionId,
    title: t('invalid').toUpperCase(),
    notation: NotationEnum.Prefix
  } as ExpressionFunction
})

const argumentCount = computed(() => countArguments(props.modelValue, fun.value))

const showMoreBtn = computed(
  () =>
    !props.readonly && fun.value && (!fun.value.maxArgumentNumber || argumentCount.value < fun.value.maxArgumentNumber)
)

const baseDocUrl = computed(() => {
  const baseUrl = env.TOP_PHENOTYPIC_QUERY_DOC_BASE_URL
  return !baseUrl ? undefined : `${baseUrl}/functions`
})

const functionTitle = computed(() => {
  if (!fun.value) return ''
  return te('functions.' + fun.value.id) ? t('functions.' + fun.value.id) : fun.value.title
})

const functionDocUrl = computed(() => {
  if (!baseDocUrl.value || !fun.value?.type || noDocFunctionTypes.includes(fun.value.type)) return undefined
  return `${baseDocUrl.value}/${fun.value.type || ''}/${fun.value.id}.html`
})

const prefix = computed(() => !fun.value || fun.value.notation === NotationEnum.Prefix)

const infix = computed(() => fun.value && fun.value.notation === NotationEnum.Infix)

const postfix = computed(() => fun.value && fun.value.notation === NotationEnum.Postfix)

onMounted(() => {
  if (!functions.value) entityStore.reloadFunctions().catch((e: Error) => renderError(e))
})

function blink() {
  flash.value = true
  setTimeout(() => (flash.value = false), 500)
}

function countArguments(expression?: Expression, fun?: ExpressionFunction) {
  const count = Math.max(expression?.arguments?.length || 0, fun?.minArgumentNumber || 0)
  if (fun?.maxArgumentNumber && fun?.maxArgumentNumber < count) return fun?.maxArgumentNumber
  return count
}

function handleArgumentUpdate(index: number, argument: Expression | undefined | null): void {
  const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
  if (!newModelValue.arguments) newModelValue.arguments = []
  if (argument) newModelValue.arguments[index] = argument
  else newModelValue.arguments.splice(index, 1)
  emit('update:modelValue', newModelValue)
}

function setFunction(fun: ExpressionFunction | undefined) {
  const newModelValue = (JSON.parse(JSON.stringify(props.modelValue)) || {}) as Expression

  if (!fun) {
    isEntity.value = false
    isConstant.value = false
    newModelValue.functionId = undefined
  } else if (fun.id === 'Entity') {
    isEntity.value = true
    isConstant.value = false
    newModelValue.functionId = undefined
  } else if (fun.id === 'Constant') {
    isEntity.value = false
    isConstant.value = true
    newModelValue.functionId = undefined
  } else {
    isEntity.value = false
    isConstant.value = false
    newModelValue.functionId = fun.id
  }
  if (!newModelValue.arguments) newModelValue.arguments = []
  const count = countArguments(newModelValue, fun)
  newModelValue.arguments.splice(count, newModelValue.arguments.length - count)
  emit('update:modelValue', newModelValue)
  blink()
}

function setEntity(entity: Entity | undefined): void {
  const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
  newModelValue.entityId = entity?.id
  isEntity.value = true
  isConstant.value = false
  emit('update:modelValue', newModelValue)
}

function setValue(value: Value | undefined): void {
  const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
  newModelValue.values = []
  if (value) newModelValue.values.push(value)
  newModelValue.constantId = undefined
  newModelValue.arguments = undefined
  isEntity.value = false
  isConstant.value = true
  emit('update:modelValue', newModelValue)
}

function setConstantId(constantId: string | undefined): void {
  const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
  newModelValue.values = undefined
  newModelValue.constantId = constantId
  newModelValue.arguments = undefined
  isEntity.value = false
  isConstant.value = true
  emit('update:modelValue', newModelValue)
}

function enclose(): void {
  const newModelValue = {
    arguments: [JSON.parse(JSON.stringify(props.modelValue))]
  } as Expression
  isEntity.value = false
  isConstant.value = false
  emit('update:modelValue', newModelValue)
}

function clear(): void {
  isEntity.value = false
  isConstant.value = false
  emit('update:modelValue', undefined)
}

function showFunctionDoc() {
  if (functionDocUrl.value) window.open(functionDocUrl.value, '_blank')
}
</script>

<style lang="sass" scoped>
.hover
  color: var(--q-primary)
  font-weight: 900

.clickable
  display: inline
  &:hover
    cursor: pointer
    @extend .hover

.d-inline
  display: inline

.expression-input .entity-search-input-field
  width: 200px
  margin: 4px
  display: inline
  vertical-align: middle
  .q-field__inner, .q-field__control
    min-height: 2em !important
    height: 2em !important
  .q-field__native
    padding: 0 0 !important
    min-height: 2em !important
    height: 2em !important
  .q-field__append
    height: 1em
  .q-btn
    min-height: 1em !important
    min-width: 1em !important
</style>
