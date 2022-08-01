<template>
  <div class="clickable">
    <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel) * indent) }}</span>
    <span v-if="defaultConstant">
      {{ defaultConstant.title || defaultConstant.id }}
    </span>
    <span v-else-if="modelValue.value">
      {{ modelValue.value.value }}
    </span>
    <span v-else>
      {{ '[' + t('constant') + ']' }}
    </span>
  </div>
  <q-popup-edit
    v-if="!readonly"
    ref="popup"
    v-slot="scope"
    :model-value="modelValue.value?.value"
    :cover="false"
    auto-save
    @update:model-value="setValue($event)"
  >
    <q-input v-model="scope.value" :type="toInputType(dataType)" dense autofocus @keyup.enter="scope.set">
      <template #before>
        <q-btn flat dense :icon="dataTypeIcon" :title="dataType" @click="toggleDataType" />
      </template>
      <template #append>
        <q-icon v-close-popup clickable name="check" class="cursor-pointer" />
      </template>
    </q-input>
    <q-list v-if="constants" dense>
      <q-item v-for="constant in constants" :key="constant.id" v-close-popup clickable @click="setConstant(constant)">
        {{ constant.title || constant.id }}
      </q-item>
    </q-list>
    <q-separator />
    <q-list dense>
      <q-item clickable @click="$emit('enclose')">
        <q-item-section v-t="'encloseWithExpression'" />
      </q-item>
      <q-item clickable @click="$emit('remove')">
        <q-item-section v-t="'remove'" />
      </q-item>
    </q-list>
  </q-popup-edit>
</template>

<script lang="ts">
import { BooleanValue, Constant, DataType, DateTimeValue, ExpressionValue, NumberValue, StringValue, Value } from '@onto-med/top-api';
import { QPopupEdit } from 'quasar';
import { useEntity } from 'src/pinia/entity';
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'ConstantInput',
  props: {
    modelValue: {
      type: Object as () => ExpressionValue,
      require: true
    },
    readonly: Boolean,
    expand: Boolean,
    indentLevel: Number,
    indent: Number
  },
  emits: ['update:modelValue', 'enclose', 'remove'],
  setup(props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const popup = ref(null as unknown as QPopupEdit)
    const entityStore = useEntity()
    const constants = ref(undefined as Constant[]|undefined)
    const dataType = ref(DataType.Number)

    void entityStore.getConstants()
      .then(o => constants.value = o)

    onMounted(() => {
      if (!props.modelValue) popup.value.show()
    })

    const defaultConstant = computed(() => props.modelValue?.constant)

    const toValue = (value: string|number|Date|boolean, dataType: DataType): Value|undefined => {
      if (dataType === DataType.String)
        return { value: value, dataType: dataType } as StringValue
      if (dataType === DataType.Number)
        return { value: value, dataType: dataType } as NumberValue
      if (dataType === DataType.DateTime)
        return { value: value, dataType: dataType } as DateTimeValue
      if (dataType === DataType.Boolean)
        return { value: value, dataType: dataType } as BooleanValue
      return undefined
    }

    return {
      t,
      popup,
      constants,
      defaultConstant,
      dataType,

      setConstant (constant: Constant) {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as ExpressionValue
        newModelValue.constant = constant
        newModelValue.value = undefined
        emit('update:modelValue', newModelValue)
      },

      setValue (value: string|number|Date|boolean) {
        const newModelValue = JSON.parse(JSON.stringify(props.modelValue)) as ExpressionValue
        newModelValue.value = toValue(value, dataType.value)
        newModelValue.constant = undefined
        emit('update:modelValue', newModelValue)
      },

      toggleDataType () {
        if (dataType.value === DataType.Number) dataType.value = DataType.DateTime
        else if (dataType.value === DataType.DateTime) dataType.value = DataType.String
        else dataType.value = DataType.Number
      },

      dataTypeIcon: computed(() => {
        if (dataType.value === DataType.Number) return 'pin'
        else if (dataType.value === DataType.DateTime) return 'today'
        else if (dataType.value === DataType.String) return 'article'
        return 'question_mark'
      }),

      toInputType (dataType: DataType): string {
        if (dataType === DataType.DateTime) return 'datetime-local'
        return dataType
      }
    }
  }
})
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
</style>