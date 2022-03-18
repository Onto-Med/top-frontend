<template>
  <span class="formula-input">
    <span v-if="operator">
      <span v-if="operator.id === 'entity'">
        <entity-search-input
          v-if="!readonly && !modelValue.id"
          :label="t('selectThing', { thing: t(operator.title) })"
          :entity-types="entityTypes"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          @btn-Clicked="$emit('update:modelValue', undefined)"
          @entity-selected="setEntity($event)"
        />
        <entity-chip
          v-if="modelValue.id"
          :entity-id="modelValue.id"
          :disable="readonly"
          @entity-clicked="$emit('entityClicked', $event)"
          @remove-clicked="$emit('update:modelValue', undefined)"
        >
          <template #additionalOptions>
            <q-item v-close-popup clickable @click="enclose()">
              <q-item-section v-t="'encloseWithExpression'" />
            </q-item>
          </template>
        </entity-chip>
      </span>
      <span v-else-if="operator.id === 'constant'">
        <span v-show="modelValue.constant" class="clickable">
          {{ modelValue.constant }}
        </span>
        <span v-show="!modelValue.constant" v-t="'enterValue'" class="clickable" />
        <q-popup-edit v-if="!readonly" v-model="modelValue.constant" auto-save v-slot="scope">
          <q-input v-model="scope.value" dense autofocus counter @keyup.enter="scope.set" />
          <q-list dense>
            <q-item clickable @click="enclose()">
              <q-item-section v-t="'encloseWithExpression'" />
            </q-item>
            <q-item clickable @click="$emit('update:modelValue', undefined)">
              <q-item-section v-t="'remove'" />
            </q-item>
          </q-list>
        </q-popup-edit>
      </span>
      <span v-else>
        <span
          v-show="prefix"
          :class="{ hover: hover }"
          class="clickable"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ operator.title }}
          <formula-context-menu
            v-if="!readonly"
            :operators="operators"
            @enclose="enclose()"
            @remove="$emit('update:modelValue', undefined)"
            @select="setOperator($event)"
          />
        </span>
        <span
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >(</span>

        <span v-for="(n, index) in operandCount" :key="index">
          <span
            v-if="index != 0 && infix"
            :class="{ hover: hover }"
            class="clickable"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            {{ operator.title }}
            <formula-context-menu
              v-if="!readonly"
              :operators="operators"
              @enclose="enclose()"
              @remove="$emit('update:modelValue', undefined)"
              @select="setOperator($event)"
            />
          </span>
          <span
            v-else-if="index != 0"
            :class="{ hover: hover }"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >,</span>
          <formula-operand-input
            :model-value="modelValue.operands[index]"
            @update:model-value="handleOperandUpdate(index, $event)"
          />
        </span>

        <span
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >)</span>
        <span
          v-show="postfix"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ operator.title }}
          <formula-context-menu
            v-if="!readonly"
            :operators="operators"
            @enclose="enclose()"
            @remove="$emit('update:modelValue', undefined)"
            @select="setOperator($event)"
          />
        </span>
      </span>
    </span>
    <span v-else class="clickable">
      [...]
      <formula-context-menu
        v-if="!readonly"
        :enclosable="false"
        :operators="operators"
        :removable="false"
        @select="setOperator($event)"
      />
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Entity,
  EntityType,
  Formula,
  FormulaMultaryOperator,
  FormulaOperator,
  RepresentationEnum,
  TypeEnum,
} from '@onto-med/top-api';
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import FormulaContextMenu from 'src/components/EntityEditor/Formula/FormulaContextMenu.vue'

export default defineComponent({
  name: 'FormulaOperandInput',
  components: {
    EntitySearchInput,
    EntityChip,
    FormulaContextMenu
  },
  props: {
    modelValue: {
      type: Object as () => Formula,
      default: () => {
        return {};
      },
    },
    expanded: Boolean,
    readonly: Boolean,
    root: Boolean,
    expand: Boolean,
    organisationId: String,
    repositoryId: String,
  },
  emits: ['update:modelValue', 'entityClicked'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const operators = [
      {
        id: 'addition',
        title: '+',
        representation: RepresentationEnum.Infix,
        type: TypeEnum.Binary,
      } as FormulaOperator,
      {
        id: 'substraction',
        title: '-',
        representation: RepresentationEnum.Infix,
        type: TypeEnum.Binary,
      } as FormulaOperator,
      {
        id: 'multiplication',
        title: '*',
        representation: RepresentationEnum.Infix,
        type: TypeEnum.Binary,
      } as FormulaOperator,
      {
        id: 'division',
        title: '/',
        representation: RepresentationEnum.Infix,
        type: TypeEnum.Binary,
      } as FormulaOperator,
      {
        id: 'exponentiation',
        title: '^',
        representation: RepresentationEnum.Infix,
        type: TypeEnum.Binary,
      } as FormulaOperator,
      {
        id: 'minimum',
        title: 'min',
        representation: RepresentationEnum.Prefix,
        type: TypeEnum.Multary,
        required: 0,
      } as FormulaMultaryOperator,
      {
        id: 'entity',
        title: 'entity',
        representation: RepresentationEnum.Prefix,
        type: TypeEnum.Unary,
      } as FormulaOperator,
      {
        id: 'constant',
        title: 'constant',
        representation: RepresentationEnum.Prefix,
        type: TypeEnum.Unary,
      } as FormulaOperator,
    ];
    const operator = computed(() =>
      operators.find((o) => o.id === props.modelValue.operator)
    );

    return {
      t,
      operator,
      operators,
      hover: ref(false),

      entityTypes: [EntityType.SinglePhenotype, EntityType.DerivedPhenotype],

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

      operandCount: computed(() => {
        if (!operator.value) return 0;
        switch (operator.value.type) {
          case TypeEnum.Nullary:
            return 0;
          case TypeEnum.Unary:
            return 1;
          case TypeEnum.Binary:
            return 2;
          default:
            return 3;
        }
      }),

      handleOperandUpdate(index: number, operand: Formula | null): void {
        const newModelValue = JSON.parse(
          JSON.stringify(props.modelValue)
        ) as Formula;
        if (!newModelValue.operands) newModelValue.operands = [];
        if (operand) newModelValue.operands[index] = operand;
        else newModelValue.operands.splice(index, 1);
        emit('update:modelValue', newModelValue);
      },

      setOperator(operatorId: string) {
        const newModelValue = JSON.parse(
          JSON.stringify(props.modelValue)
        ) as Formula;
        newModelValue.operator = operatorId;
        if (!newModelValue.operands) newModelValue.operands = [];
        emit('update:modelValue', newModelValue);
      },

      setEntity (entity: Entity): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Formula
        newModelValue.id = entity.id
        emit('update:modelValue', newModelValue)
      },

      enclose (): void {
        const newModelValue = {
          operands: [ JSON.parse(JSON.stringify(props.modelValue)) ]
        } as Formula
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

.formula-input .entity-search-input-field
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