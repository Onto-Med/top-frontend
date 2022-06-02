<template>
  <div class="expression-input" :class="{ 'row items-center': !expand, 'text-primary': flash }">
    <div v-if="operator && operator.id === 'entity'">
      {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<!--
   --><entity-chip
        :entity-id="modelValue.id"
        :entity-types="entityTypes"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :label="t('selectThing', { thing: t(operator.title) }) + '...'"
        :disable="readonly"
        @entity-clicked="$emit('entityClicked', $event)"
        @entity-set="setEntity($event)"
        @remove-clicked="$emit('update:modelValue', undefined)"
      >
        <template v-if="!readonly" #additionalOptions>
          <q-item v-close-popup clickable @click="enclose()">
            <q-item-section v-t="'encloseWithExpression'" />
          </q-item>
        </template>
      </entity-chip>
    </div>
    <constant-input
      v-else-if="operator && operator.id === 'constant'"
      :model-value="modelValue.constant"
      :readonly="readonly"
      :indent-level="indentLevel"
      :indent="indent"
      :expand="expand"
      @update:modelValue="setConstant($event)"
      @enclose="enclose()"
      @remove="$emit('update:modelValue', undefined)"
    />
    <template v-else-if="operator">
      <div
        v-if="prefix"
        :class="{ hover: hover }"
        class="clickable"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<b>{{ operatorTitle }}</b> (
        <expression-context-menu
          v-if="!readonly"
          :operators="operators"
          @enclose="enclose()"
          @remove="$emit('update:modelValue', undefined)"
          @select="setOperator($event)"
        />
      </div>
      <div
        v-else
        :class="{ hover: hover }"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}(
      </div>

      <template v-for="(n, index) in operandCount" :key="index">
        <div
          v-if="index != 0 && infix"
          :class="{ hover: hover }"
          class="clickable"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;' }}<b>{{ operatorTitle }}</b>{{ !expand ? '&nbsp;' : '' }}
          <expression-context-menu
            v-if="!readonly"
            :operators="operators"
            @enclose="enclose()"
            @remove="$emit('update:modelValue', undefined)"
            @select="setOperator($event)"
          />
        </div>
        <div
          v-else-if="index != 0"
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '' }},{{ !expand ? '&nbsp;' : '' }}
        </div>
        <expression-operand-input
          :model-value="modelValue.operands[index]"
          :readonly="readonly"
          :operators="operators"
          :expand="expand"
          :indent="indent"
          :indent-level="indentLevel + 1"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :entity-types="entityTypes"
          @update:model-value="handleOperandUpdate(index, $event)"
          @entity-clicked="$emit('entityClicked', $event)"
        />
      </template>

      <template v-if="!readonly && operator && operator.type === TypeEnum.Multary">
        <div
          v-if="operandCount != 0 && !infix"
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '' }},
        </div>
        {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;' }}<q-chip icon="add" clickable :label="t('more')" :title="t('addMoreOperands')" @click="handleOperandUpdate(operandCount, {})" />
      </template>

      <div
        v-if="postfix"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})
        <b>{{ operatorTitle }}</b>
        <expression-context-menu
          v-if="!readonly"
          :operators="operators"
          @enclose="enclose()"
          @remove="$emit('update:modelValue', undefined)"
          @select="setOperator($event)"
        />
      </div>
      <div
        v-else
        :class="{ hover: hover }"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})
      </div>
    </template>
    <div v-else class="clickable">
      {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}[{{ modelValue?.operands ? '...' : t('selectThing', { thing: t('operator') }) }}]
      <expression-context-menu
        v-if="!readonly"
        :enclosable="false"
        :operators="operators"
        @select="setOperator($event)"
        @remove="$emit('update:modelValue', null)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Entity,
  EntityType,
  Expression,
  ExpressionMultaryOperator,
  ExpressionOperator,
  RepresentationEnum,
  TypeEnum,
} from '@onto-med/top-api';
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import ExpressionContextMenu from 'src/components/EntityEditor/Expression/ExpressionContextMenu.vue'
import ConstantInput from 'src/components/EntityEditor/Expression/ConstantInput.vue'

export default defineComponent({
  name: 'FormulaOperandInput',
  components: {
    EntityChip,
    ExpressionContextMenu,
    ConstantInput
  },
  props: {
    modelValue: {
      type: Object as () => Expression,
      default: () => {
        return {};
      },
    },
    readonly: Boolean,
    root: Boolean,
    expand: Boolean,
    operators: Array as () => ExpressionOperator[],
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
    entityTypes: Array as () => EntityType[]
  },
  emits: ['update:modelValue', 'entityClicked'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()
    const flash = ref(false)

    const getOperator = (operator: string|undefined) => props.operators?.find((o) => o.id === operator)
    const operator = computed(() => getOperator(props.modelValue?.operator))

    const blink = () => {
      flash.value = true
      setTimeout(() => flash.value = false, 500)
    }

    const countOperands = (expression: Expression, operator: ExpressionOperator|undefined) => {
      if (!operator) return 0;
      switch (operator.type) {
        case TypeEnum.Nullary:
          return 0
        case TypeEnum.Unary:
          return 1
        case TypeEnum.Binary:
          return 2
        default:
          return Math.max(expression.operands?.length || 0, (operator as ExpressionMultaryOperator).required)
      }
    }

    return {
      t,
      TypeEnum,
      operator,
      hover: ref(false),
      flash,

      operatorTitle: computed(() => {
        if (!operator.value || !operator.value.title) return ''
        return te(operator.value.title) ? t(operator.value.title) : operator.value.title
      }),

      prefix: computed(
        () =>
          operator.value &&
          operator.value.representation === RepresentationEnum.Prefix
      ),

      infix: computed(
        () =>
          !operator.value ||
          operator.value.representation === RepresentationEnum.Infix
      ),

      postfix: computed(
        () =>
          operator.value &&
          operator.value.representation === RepresentationEnum.Postfix
      ),

      operandCount: computed(() => countOperands(props.modelValue, operator.value)),

      handleOperandUpdate(index: number, operand: Expression | undefined | null): void {
        const newModelValue = JSON.parse(
          JSON.stringify(props.modelValue)
        ) as Expression
        if (!newModelValue.operands) newModelValue.operands = []
        if (operand) newModelValue.operands[index] = operand
        else if (operand === undefined) delete newModelValue.operands[index]
        else newModelValue.operands.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },

      setOperator(operatorId: string) {
        const newModelValue = (JSON.parse(
          JSON.stringify(props.modelValue)
        ) || {}) as Expression
        newModelValue.operator = operatorId
        if (!newModelValue.operands) newModelValue.operands = []
        const count = countOperands(newModelValue, getOperator(newModelValue.operator))
        newModelValue.operands.splice(count, newModelValue.operands.length - count)
        emit('update:modelValue', newModelValue)
        blink()
      },

      setEntity (entity: Entity): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.id = entity.id
        emit('update:modelValue', newModelValue)
      },

      setConstant (constant: number|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.constant = constant
        emit('update:modelValue', newModelValue)
      },

      enclose (): void {
        const newModelValue = {
          operands: [ JSON.parse(JSON.stringify(props.modelValue)) ]
        } as Expression
        emit('update:modelValue', newModelValue)
      }
    };
  },
});
</script>

<style lang="sass" scoped>
.hover
  color: var(--q-primary)
  font-weight: 900

.clickable:hover
  cursor: pointer
  @extend .hover

.expression-input .entity-search-input-field
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