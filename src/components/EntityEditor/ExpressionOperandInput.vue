<template>
  <span>
    <span v-show="expand">{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>
    <span
      v-if="![ExpressionType.Restriction, ExpressionType.Clazz].includes(modelValue.type)"
      :class="{ 'text-weight-bolder text-primary': hover }"
      class="cursor-pointer"
      :title="modelValue.type ? t(modelValue.type) : ''"
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
          <q-item v-close-popup clickable @click="$emit('removeClicked')">
            <q-item-section v-t="'remove'" />
          </q-item>
        </q-list>
      </q-menu>
    </span>

    <entity-chip
      v-else-if="modelValue.id"
      :entity-id="modelValue.id"
      :entity="entity"
      @entity-clicked="$emit('entityClicked', $event)"
      @remove-clicked="$emit('removeClicked')"
    />

    <entity-search-input
      v-else
      :label="t('selectThing', { thing: t(modelValue.type) })"
      :entity-types="entityTypes"
      @clear-Clicked="$emit('removeClicked')"
      @entity-selected="setEntity($event)"
    />

    <span v-for="(operand, index) in modelValue.operands || []" :key="index">
      <span
        v-if="index != 0"
        :class="{ 'text-weight-bolder text-primary': hover }"
      >,<span v-show="!expand">&nbsp;</span><br v-show="expand"></span>

      <expression-operand-input
        :model-value="operand"
        :expand="expand"
        :indent="indent"
        :indent-level="indentLevel + 1"
        @entity-clicked="$emit('entityClicked', $event)"
        @remove-clicked="handleOperandUpdate(index, null)"
        @update:model-value="handleOperandUpdate(index, $event)"
      />
    </span>

    <span v-show="showAddButton" :class="{ 'text-weight-bolder text-primary': hover }">
      <span v-show="(modelValue.operands || []).length > 0">, </span>
      <span v-show="expand"><br>{{ '&nbsp;'.repeat((indentLevel + 1) * indent) }}</span>
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
      v-if="![ExpressionType.Clazz, ExpressionType.Restriction].includes(modelValue.type)"
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
import { FullEntity } from 'src/models/Entity'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import { EntityType, Expression, ExpressionType } from '@onto-med/top-api'

export default defineComponent({
  name: 'ExpressionOperandInput',
  components: {
    EntitySearchInput,
    EntityChip
  },
  props: {
    modelValue: {
      type: Object as () => Expression,
      required: true
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
    }
  },
  emits: ['update:modelValue', 'entityClicked', 'removeClicked'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const hover = ref(false)
    const entity = ref(undefined as unknown as FullEntity)
    const operatorSymbol = computed(() => {
      switch (props.modelValue.type) {
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
      if ([ExpressionType.Restriction, ExpressionType.Class].includes(props.modelValue.type))
        return false
      return [ExpressionType.Intersection, ExpressionType.Union].includes(props.modelValue.type)
        || props.modelValue.operands === undefined || props.modelValue.operands.length === 0
    })
    const entityTypes = computed(() => FullEntity.restrictionEntityTypes())
    const selectableExpressionTypes = computed(() => [
      ExpressionType.Union, ExpressionType.Intersection, ExpressionType.Complement, ExpressionType.Restriction
    ])

    return { t, entity, hover, operatorSymbol, ExpressionType, showAddButton, entityTypes, selectableExpressionTypes }
  },
  methods: {
    setType (type: ExpressionType): void {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as Expression
      newModelValue.type = type
      this.$emit('update:modelValue', newModelValue)
    },
    setEntity (entity: FullEntity): void {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as Expression
      newModelValue.id = entity.id
      newModelValue.type = entity.entityType === EntityType.SingleRestriction ? ExpressionType.Restriction : ExpressionType.Class
      this.entity = entity
      this.$emit('update:modelValue', newModelValue)
    },
    addOperand (type: ExpressionType): void {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as Expression
      if (!newModelValue.operands) newModelValue.operands = []
      newModelValue.operands.push({ type: type })
      this.$emit('update:modelValue', newModelValue)
    },
    handleOperandUpdate (index: number, operand: Expression|null): void {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as Expression
      if (newModelValue.operands) {
        if (operand) newModelValue.operands[index] = operand
        else newModelValue.operands.splice(index, 1)
      }
      this.$emit('update:modelValue', newModelValue)
    }
  }
})
</script>

<style lang="sass" scoped>
.truncate
  max-width: 200px
</style>

<style lang="sass">
.entity-search-input-field
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
