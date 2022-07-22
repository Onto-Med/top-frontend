<template>
  <div class="expression-input" :class="{ 'row items-center': !expand, 'text-primary': flash }">
    <slot name="prepend" />
    <div v-if="fun && fun.id === 'entity'">
      {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<!--
   --><entity-chip
        :entity-id="modelValue.id"
        :entity-types="entityTypes"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :label="t('selectThing', { thing: t(fun.title) }) + '...'"
        :disable="readonly"
        show-change
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
      <slot name="append" />
    </div>
    <div v-else-if="fun && fun.id === 'constant'">
      <constant-input
        class="inline"
        :model-value="modelValue.constant"
        :readonly="readonly"
        :indent-level="indentLevel"
        :indent="indent"
        :expand="expand"
        @update:modelValue="setConstant($event)"
        @enclose="enclose()"
        @remove="$emit('update:modelValue', undefined)"
      />
      <slot name="append" />
    </div>
    <template v-else-if="fun">
      <div
        v-if="prefix"
        :class="{ hover: hover }"
        class="clickable"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<b>{{ functionTitle }}</b> (
        <expression-context-menu
          v-if="!readonly"
          :functions="functions"
          @enclose="enclose()"
          @remove="$emit('update:modelValue', undefined)"
          @select="setFunction($event)"
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

      <template v-for="(n, index) in argumentCount" :key="index">
        <div
          v-if="index != 0 && infix"
          :class="{ hover: hover }"
          class="clickable"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          <span>{{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;' }}<b>{{ functionTitle }}</b>{{ !expand ? '&nbsp;' : '' }}</span>
          <expression-context-menu
            v-if="!readonly"
            :functions="functions"
            @enclose="enclose()"
            @remove="$emit('update:modelValue', undefined)"
            @select="setFunction($event)"
          />
        </div>
        <expression-argument-input
          :model-value="modelValue.arguments[index]"
          :readonly="readonly"
          :functions="functions"
          :expand="expand"
          :indent="indent"
          :indent-level="indentLevel + 1"
          :organisation-id="organisationId"
          :repository-id="repositoryId"
          :entity-types="entityTypes"
          @update:model-value="handleArgumentUpdate(index, $event)"
          @entity-clicked="$emit('entityClicked', $event)"
        >
          <template
            v-if="!infix && (index + 1 < argumentCount || showMoreBtn)"
            #append
            :class="{ hover: hover }"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            <span>,{{ !expand ? '&nbsp;' : '' }}</span>
          </template>
        </expression-argument-input>
      </template>

      <template v-if="!readonly && fun && showMoreBtn">
        <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel + 1) * indent) }}</span>
        <q-chip
          icon="add"
          clickable
          :label="t('more')"
          :title="t('addMoreArguments')"
        >
          <expression-context-menu
            v-if="!readonly"
            :enclosable="false"
            :functions="functions"
            :removable="false"
            @select="handleArgumentUpdate(argumentCount, { function: $event, arguments: [] })"
          />
        </q-chip>
      </template>

      <div
        v-if="postfix"
        :class="{ hover: hover }"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})
        <b>{{ functionTitle }}</b>
        <slot name="append" />
        <expression-context-menu
          v-if="!readonly"
          :functions="functions"
          @enclose="enclose()"
          @remove="$emit('update:modelValue', undefined)"
          @select="setFunction($event)"
        />
      </div>
      <div
        v-else
        :class="{ hover: hover }"
        @mouseover="hover = true"
        @mouseleave="hover = false"
      >
        <span>{{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})</span>
        <slot name="append" />
      </div>
    </template>
    <div v-else class="clickable">
      <span>{{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}[{{ modelValue?.arguments ? '...' : t('selectThing', { thing: t('function') }) }}]</span>
      <expression-context-menu
        v-if="!readonly"
        :enclosable="false"
        :functions="functions"
        @select="setFunction($event)"
        @remove="$emit('update:modelValue', null)"
      />
      <slot name="append" />
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
  ExpressionFunction,
  NotationEnum
} from '@onto-med/top-api';
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import ExpressionContextMenu from 'src/components/EntityEditor/Expression/ExpressionContextMenu.vue'
import ConstantInput from 'src/components/EntityEditor/Expression/ConstantInput.vue'

export default defineComponent({
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
    functions: Array as () => ExpressionFunction[],
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

    const getFunction = (functionId: string|undefined) => {
      if (!functionId) return undefined
      const fun = props.functions?.find((o) => o.id === functionId)
      if (fun) return fun
      return { id: functionId, title: t('invalid').toUpperCase(), notation: NotationEnum.Prefix } as ExpressionFunction
    }
    const fun = computed(() => getFunction(props.modelValue?.function))

    const blink = () => {
      flash.value = true
      setTimeout(() => flash.value = false, 500)
    }

    const countArguments = (expression: Expression, fun: ExpressionFunction|undefined) => {
      if (!fun) return 0;
      const count = Math.max(expression.arguments?.length || 0, fun.minArgumentNumber || 0)
      if (fun.maxArgumentNumber && fun.maxArgumentNumber < count) return fun.maxArgumentNumber
      return count
    }

    const argumentCount = computed(() => countArguments(props.modelValue, fun.value))

    return {
      t,
      fun,
      hover: ref(false),
      flash,
      argumentCount,

      showMoreBtn: computed(() =>
        fun.value && (!fun.value.maxArgumentNumber || argumentCount.value < fun.value.maxArgumentNumber)
      ),

      functionTitle: computed(() => {
        if (!fun.value || !fun.value.title) return ''
        return te(fun.value.title) ? t(fun.value.title) : fun.value.title
      }),

      prefix: computed(
        () =>
          fun.value &&
          fun.value.notation === NotationEnum.Prefix
      ),

      infix: computed(
        () =>
          !fun.value ||
          fun.value.notation === NotationEnum.Infix
      ),

      postfix: computed(
        () =>
          fun.value &&
          fun.value.notation === NotationEnum.Postfix
      ),

      handleArgumentUpdate(index: number, argument: Expression | undefined | null): void {
        const newModelValue = JSON.parse(
          JSON.stringify(props.modelValue)
        ) as Expression
        if (!newModelValue.arguments) newModelValue.arguments = []
        if (argument) newModelValue.arguments[index] = argument
        else newModelValue.arguments.splice(index, 1)
        emit('update:modelValue', newModelValue)
      },

      setFunction(functionId: string) {
        const newModelValue = (JSON.parse(
          JSON.stringify(props.modelValue)
        ) || {}) as Expression
        newModelValue.function = functionId
        if (!newModelValue.arguments) newModelValue.arguments = []
        const count = countArguments(newModelValue, getFunction(newModelValue.function))
        newModelValue.arguments.splice(count, newModelValue.arguments.length - count)
        emit('update:modelValue', newModelValue)
        blink()
      },

      setEntity (entity: Entity|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.id = entity?.id
        emit('update:modelValue', newModelValue)
      },

      setConstant (constant: string|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.constant = constant
        emit('update:modelValue', newModelValue)
      },

      enclose (): void {
        const newModelValue = {
          arguments: [ JSON.parse(JSON.stringify(props.modelValue)) ]
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