<template>
  <span class="expression-operand">
    <span v-show="expand">{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>
    <span
      v-if="![ExpressionType.Restriction].includes(local.type)"
      :class="{ 'text-weight-bolder text-primary': hover }"
      class="cursor-pointer"
      :title="local.type ? t(local.type) : ''"
      @mouseover="hover = true"
      @mouseleave="hover = false"
    >
      {{ operatorSymbol }} (<br v-show="expand">
      <q-menu>
        <q-list dense>
          <q-item
            v-for="type in [ExpressionType.Union, ExpressionType.Intersection, ExpressionType.Complement]"
            :key="type"
            v-close-popup
            clickable
            @click="setType(type)"
          >
            <q-item-section v-t="type" />
          </q-item>
          <q-separator />
          <q-item v-close-popup clickable @click="enclose">
            <q-item-section v-t="'encloseWithExpression'" />
          </q-item>
          <q-item v-if="!root" v-close-popup clickable @click="$emit('removeClicked')">
            <q-item-section v-t="'remove'" />
          </q-item>
        </q-list>
      </q-menu>
    </span>

    <entity-chip
      v-else-if="local.id"
      :entity-id="local.id"
      @entity-clicked="$emit('entityClicked', $event)"
      @remove-clicked="$emit('removeClicked')"
    />

    <entity-search-input
      v-else
      :label="t('selectThing', { thing: t(local.type) })"
      :entity-types="entityTypes"
      :organisation-id="organisationId"
      :repository-id="repositoryId"
      @btn-Clicked="$emit('removeClicked')"
      @entity-selected="setEntity($event)"
    />

    <span v-for="(operand, index) in operands" :key="index">
      <span
        v-if="index != 0"
        :class="{ 'text-weight-bolder text-primary': hover }"
      >,<span v-show="!expand">&nbsp;</span><br v-show="expand"></span>

      <expression-operand-input
        :model-value="operand"
        :expand="expand"
        :indent="indent"
        :indent-level="indentLevel + 1"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        @entity-clicked="$emit('entityClicked', $event)"
        @remove-clicked="handleOperandUpdate(index, null)"
        @update:model-value="handleOperandUpdate(index, $event)"
      />
    </span>

    <span v-show="showAddButton" :class="{ 'text-weight-bolder text-primary': hover }">
      <span v-show="operands.length > 0">, <span v-show="expand"><br></span></span>
      <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel + 1) * indent) }}</span>
      <span
        class="cursor-pointer"
        :title="t('addThing', { thing: t('operand') })"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      ><span class="add-btn">+</span><q-menu>
        <q-list dense>
          <q-item
            v-for="type in selectableExpressionTypes"
            :key="type"
            v-close-popup
            clickable
            @click="addOperand(type)"
          >
            <q-item-section v-t="type" />
          </q-item>
        </q-list>
      </q-menu>
      </span>
    </span>

    <span
      v-if="ExpressionType.Restriction != local.type"
      :class="{ 'text-weight-bolder text-primary': hover }"
    >
      <span v-show="expand"><br>{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>
      <span @mouseover="hover = true" @mouseleave="hover = false">)</span>
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import { Expression, ExpressionType, Entity } from '@onto-med/top-api'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

export default defineComponent({
  name: 'ExpressionOperandInput',
  components: {
    EntitySearchInput,
    EntityChip
  },
  props: {
    modelValue: {
      type: Object as () => Expression,
      default: () => { return {} }
    },
    expand: {
      type: Boolean,
      default: false
    },
    indent: {
      type: Number,
      default: 2
    },
    indentLevel: {
      type: Number,
      default: 0
    },
    root: {
      type: Boolean,
      default: false
    },
    organisationId: String,
    repositoryId: String
  },
  emits: ['update:modelValue', 'entityClicked', 'removeClicked'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const { restrictionEntityTypes } = useEntityFormatter()
    const hover = ref(false)
    const entity = ref(undefined as unknown as Entity)
    const local = computed(() => props.modelValue || {})
    const operatorSymbol = computed(() => {
      switch (local.value.type) {
        case ExpressionType.Union:
          return t('or').toUpperCase()
        case ExpressionType.Intersection:
          return t('and').toUpperCase()
        case ExpressionType.Complement:
          return t('not').toUpperCase()
        default:
          return t('selectThing', { thing: t('operator') })
      }
    })
    const showAddButton = computed((): boolean => {
      if (local.value.type == undefined) return false
      if (ExpressionType.Restriction == local.value.type)
        return false
      return [ExpressionType.Intersection, ExpressionType.Union].includes(local.value.type)
        || local.value.operands === undefined || local.value.operands.length === 0
    })
    const entityTypes = computed(() => restrictionEntityTypes())
    const selectableExpressionTypes = computed(() => [
      ExpressionType.Union, ExpressionType.Intersection, ExpressionType.Complement, ExpressionType.Restriction
    ])
    const operands = computed(() => {
      if ([ExpressionType.Complement, ExpressionType.Restriction].includes(local.value.type))
        return local.value.operands?.slice(0, 1) || []
      return local.value.operands || []
    })

    return {
      t, local, entity, hover, operatorSymbol, ExpressionType, showAddButton, entityTypes, selectableExpressionTypes, operands,

      setType (type: ExpressionType): void {
        const newModelValue = JSON.parse(JSON.stringify(local.value)) as Expression
        newModelValue.type = type
        emit('update:modelValue', newModelValue)
      },
      setEntity (newEntity: Entity): void {
        const newModelValue = JSON.parse(JSON.stringify(local.value)) as Expression
        newModelValue.id = newEntity.id
        newModelValue.type = ExpressionType.Restriction
        entity.value = newEntity
        emit('update:modelValue', newModelValue)
      },
      addOperand (type: ExpressionType): void {
        const newModelValue = JSON.parse(JSON.stringify(local.value)) as Expression
        if (!newModelValue.operands) newModelValue.operands = []
        newModelValue.operands.push({ type: type })
        emit('update:modelValue', newModelValue)
      },
      handleOperandUpdate (index: number, operand: Expression|null): void {
        const newModelValue = JSON.parse(JSON.stringify(local.value)) as Expression
        if (newModelValue.operands) {
          if (operand) newModelValue.operands[index] = operand
          else newModelValue.operands.splice(index, 1)
        }
        emit('update:modelValue', newModelValue)
      },
      enclose (): void {
        const newModelValue = {
          operands: [ JSON.parse(JSON.stringify(local.value)) ]
        } as Expression
        emit('update:modelValue', newModelValue)
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.truncate
  max-width: 200px
</style>

<style lang="sass">
.expression-operand .entity-search-input-field
  width: 200px
  margin: 4px
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
