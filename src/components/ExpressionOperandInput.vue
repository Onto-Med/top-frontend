<template>
  <span>
    <span v-show="!inline">{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>
    <span
      v-if="![ExpressionType.Class, ExpressionType.Restriction].includes(modelValue.type)"
      :class="{ 'text-weight-bolder text-primary': hover }"
      :title="t(modelValue.type)"
      @mouseover="hover = true"
      @mouseleave="hover = false"
    >
      {{ operatorSymbol }} (<br v-show="!inline">
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
          <q-item v-close-popup clickable>
            <q-item-section v-t="'remove'" />
          </q-item>
        </q-list>
      </q-menu>
    </span>

    <q-chip
      v-if="modelValue.id"
      removable
      clickable
      icon="calculate"
      class="truncate"
      :label="modelValue.id"
      :title="t(modelValue.type) + ': ' + modelValue.id"
      @click="$emit('entityClicked', modelValue.id)"
      @remove="$emit('removeClicked', modelValue.id)"
    />

    <span v-for="(operand, index) in modelValue.operands || []" :key="index">
      <span
        v-if="index != 0"
        :class="{ 'text-weight-bolder text-primary': hover }"
      >,<span v-show="inline">&nbsp;</span><br v-show="!inline"></span>

      <expression-operand-input
        :model-value="operand"
        :inline="inline"
        :indent="indent"
        :indent-level="indentLevel + 1"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="handleOperandUpdate(index, $event)"
      />
    </span>

    <span
      v-if="![ExpressionType.Class, ExpressionType.Restriction].includes(modelValue.type)"
      :class="{ 'text-weight-bolder text-primary': hover }"
    ><br v-show="!inline"><span v-show="!inline">{{ '&nbsp;'.repeat(indentLevel * indent) }}</span>)</span>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IExpression, ExpressionType } from 'src/components/models'

export default defineComponent({
  name: 'ExpressionOperandInput',
  props: {
    modelValue: {
      type: Object as () => IExpression,
      required: true
    },
    inline: {
      type: Boolean,
      default: true
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
    const operatorSymbol = computed(() => {
      switch (props.modelValue.type) {
        case ExpressionType.Union:
          return t('or').toUpperCase()
        case ExpressionType.Intersection:
          return t('and').toUpperCase()
        case ExpressionType.Complement:
          return t('not').toUpperCase()
        default:
          return ''
      }
    })
    
    return { t, hover, operatorSymbol, ExpressionType }
  },
  methods: {
    setType (type: ExpressionType) {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as IExpression
      newModelValue.type = type
      this.$emit('update:modelValue', newModelValue)
    },
    handleOperandUpdate (index: number, operand: IExpression) {
      let newModelValue = JSON.parse(JSON.stringify(this.modelValue)) as IExpression
      if (newModelValue.operands) newModelValue.operands[index] = operand
      this.$emit('update:modelValue', newModelValue)
    }
  }
})
</script>

<style lang="sass" scoped>
.truncate
  max-width: 200px
</style>
