<template>
  <div class="expression-input" :class="{ 'row': !expand, 'text-primary': flash }">
    <slot name="prepend" />
    <div v-if="modelValue?.entityId || isEntity">
      {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<!--
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
    <div v-else-if="modelValue?.values && modelValue?.values.length || modelValue?.constantId || isConstant">
      <expression-value-input
        :value="modelValue.values && modelValue?.values.length ? modelValue.values[0] : undefined"
        :constant-id="modelValue.constantId"
        :readonly="readonly"
        :indent-level="indentLevel"
        :indent="indent"
        :expand="expand"
        @update:value="setValue($event)"
        @update:constant-id="setConstantId($event)"
        @enclose="enclose()"
        @remove="clear()"
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
        {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}<b :title="functionTooltip">{{ functionTitle }}</b> (
        <expression-context-menu
          v-if="!readonly"
          @enclose="enclose()"
          @remove="clear()"
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

      <div :class="expand ? '' : 'col row items-center'">
        <template v-for="(n, index) in argumentCount" :key="index">
          <div
            v-if="index != 0 && infix"
            :class="{ hover: hover }"
            class="clickable"
            @mouseover="hover = true"
            @mouseleave="hover = false"
          >
            <span>
              {{ expand ? '&nbsp;'.repeat((indentLevel + 1) * indent) : '&nbsp;' }}
              <b :title="functionTooltip">{{ functionTitle }}</b>
              {{ !expand ? '&nbsp;' : '' }}
            </span>
            <expression-context-menu
              v-if="!readonly"
              @enclose="enclose()"
              @remove="clear()"
              @select="setFunction($event)"
            />
          </div>
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

        <template v-if="fun && showMoreBtn">
          <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel + 1) * indent) }}</span>
          <q-icon
            name="add"
            class="clickable"
            :title="t('addMoreArguments')"
            @mouseover="hover = true"
            @mouseleave="hover = false"
            @click="handleArgumentUpdate(argumentCount, { })"
          />
        </template>

        <div
          v-if="postfix"
          :class="{ hover: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false"
        >
          {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }})
          <b :title="functionTooltip">{{ functionTitle }}</b>
          <slot name="append" />
          <expression-context-menu
            v-if="!readonly"
            @enclose="enclose()"
            @remove="clear()"
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
      </div>
    </template>
    <div v-else class="clickable">
      <span>{{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}[{{ modelValue?.arguments ? '...' : t('selectThing', { thing: t('function') }) }}]</span>
      <expression-context-menu
        v-if="!readonly"
        :enclosable="false"
        @select="setFunction($event)"
        @remove="clear()"
      />
      <slot name="append" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Entity,
  EntityType,
  Expression,
  ExpressionFunction,
  NotationEnum,
  Value
} from '@onto-med/top-api';
import EntityChip from 'src/components/EntityEditor/EntityChip.vue'
import ExpressionContextMenu from 'src/components/EntityEditor/Expression/ExpressionContextMenu.vue'
import ExpressionValueInput from 'src/components/EntityEditor/Expression/ExpressionValueInput.vue'
import { useEntity } from 'src/pinia/entity';
import { storeToRefs } from 'pinia';
import useNotify from 'src/mixins/useNotify';

export default defineComponent({
  components: {
    EntityChip,
    ExpressionContextMenu,
    ExpressionValueInput
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
    const isEntity = ref(false)
    const isConstant = ref(false)
    const entityStore = useEntity()
    const { renderError } = useNotify()
    const { functions } = storeToRefs(entityStore)

    const fun = computed(() => {
      if (!props.modelValue || !props.modelValue.functionId || !functions.value) return undefined

      const fun = functions.value
        .find(f => f.id === props.modelValue?.functionId)

      if (fun) return fun
      return {
        id: props.modelValue.functionId,
        title: t('invalid').toUpperCase(),
        notation: NotationEnum.Prefix
      } as ExpressionFunction
    })

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

    onMounted(() => {
      if (!functions.value)
        entityStore.reloadFunctions()
          .catch((e: Error) => renderError(e))
    })

    return {
      t,
      fun,
      hover: ref(false),
      flash,
      argumentCount,
      isEntity,
      isConstant,

      showMoreBtn: computed(() =>
        !props.readonly && fun.value && (!fun.value.maxArgumentNumber || argumentCount.value < fun.value.maxArgumentNumber)
      ),

      functionTitle: computed(() => {
        if (!fun.value) return ''
        return te('functions.' + fun.value.id) ? t('functions.' + fun.value.id) : fun.value.title
      }),

      functionTooltip: computed(() => {
         if (!fun.value || !fun.value.id || !te('functionDescriptions.' + fun.value.id))
          return undefined
         return t('functionDescriptions.' + fun.value.id)
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

      setFunction(fun: ExpressionFunction|undefined) {
        const newModelValue = (JSON.parse(
          JSON.stringify(props.modelValue)
        ) || {}) as Expression

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
      },

      setEntity (entity: Entity|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.entityId = entity?.id
        isEntity.value = true
        isConstant.value = false
        emit('update:modelValue', newModelValue)
      },

      setValue (value: Value|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.values = []
        if (value)
          newModelValue.values.push(value)
        newModelValue.constantId = undefined
        isEntity.value = false
        isConstant.value = true
        emit('update:modelValue', newModelValue)
      },

      setConstantId (constantId: string|undefined): void {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as Expression
        newModelValue.values = undefined
        newModelValue.constantId = constantId
        isEntity.value = false
        isConstant.value = true
        emit('update:modelValue', newModelValue)
      },

      enclose (): void {
        const newModelValue = {
          arguments: [ JSON.parse(JSON.stringify(props.modelValue)) ]
        } as Expression
        isEntity.value = false
        isConstant.value = false
        emit('update:modelValue', newModelValue)
      },

      clear (): void {
        isEntity.value = false
        isConstant.value = false
        emit('update:modelValue', undefined)
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
