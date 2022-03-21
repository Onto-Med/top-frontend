<template>
  <div class="formula-input" :class="{ row: !expand, 'text-primary': flash }">
    <div v-if="operator && operator.id === 'entity'">
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
    </div>
    <div v-else-if="operator && operator.id === 'constant'">
      <div v-show="modelValue.constant" class="clickable">
        {{ modelValue.constant }}
      </div>
      <div v-show="!modelValue.constant" v-t="'constant'" class="clickable" />
      <q-popup-edit v-if="!readonly" v-slot="scope" :model-value="modelValue.constant" auto-save @update:model-value="setConstant($event)">
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
    </div>
    <template v-else-if="operator">
      <div
        v-if="prefix"
        :class="{ hover: hover }"
        class="clickable"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<b>{{ operator.title }}</b> (
        <formula-context-menu
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
          {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;' }}<b>{{ operator.title }}</b>{{ !expand ? '&nbsp;' : '' }}
          <formula-context-menu
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
        <formula-operand-input
          :model-value="modelValue.operands[index]"
          :readonly="readonly"
          :operators="operators"
          :expand="expand"
          :indent="indent"
          :indent-level="indentLevel + 1"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          @update:model-value="handleOperandUpdate(index, $event)"
        />
      </template>

      <div
        v-if="postfix"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})
        <b>{{ operator.title }}</b>
        <formula-context-menu
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
      <formula-context-menu
        v-if="!readonly"
        :enclosable="false"
        :operators="operators"
        :removable="false"
        @select="setOperator($event)"
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
  Formula,
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
    readonly: Boolean,
    root: Boolean,
    expand: Boolean,
    operators: Array as () => FormulaOperator[],
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
  },
  emits: ['update:modelValue', 'entityClicked'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n();
    const flash = ref(false)
    const operator = computed(() =>
      props.operators?.find((o) => o.id === props.modelValue?.operator)
    );

    const blink = () => {
      flash.value = true
      setTimeout(() => flash.value = false, 500)
    }

    return {
      t,
      operator,
      hover: ref(false),
      flash,

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
        const newModelValue = (JSON.parse(
          JSON.stringify(props.modelValue)
        ) || {}) as Formula;
        newModelValue.operator = operatorId;
        if (!newModelValue.operands) newModelValue.operands = []
        emit('update:modelValue', newModelValue)
        blink()
      },

      setEntity (entity: Entity): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Formula
        newModelValue.id = entity.id
        emit('update:modelValue', newModelValue)
      },

      setConstant (constant: number|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Formula
        newModelValue.constant = constant
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