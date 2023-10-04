<template>
  <div class="clickable">
    <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel) * indent) }}</span>
    <span v-if="defaultConstant">
      {{ defaultConstant.title || defaultConstant.id }}
    </span>
    <span v-else-if="value">
      {{ isStringValue ? '"' + value.value + '"' : value.value }}
    </span>
    <span v-else>
      {{ '[' + t('constant') + ']' }}
    </span>
  </div>
  <q-popup-edit
    v-if="!readonly"
    ref="popup"
    v-slot="scope"
    :model-value="value?.value"
    :cover="false"
    class="q-pa-none"
    auto-save
    @update:model-value="setValue($event)"
  >
    <div v-show="!isValueSet">
      <q-input v-model="scope.value" :type="toInputType(dataType)" dense autofocus @keyup.enter="scope.set">
        <template #before>
          <q-btn flat dense :icon="dataTypeIcon" :title="dataType" @click="toggleDataType" />
        </template>
        <template #after>
          <q-icon v-close-popup clickable name="check" class="cursor-pointer" />
        </template>
      </q-input>
      <q-list v-if="constants" dense>
        <q-item
          v-for="constant in constants"
          :key="constant.id"
          v-close-popup
          clickable
          class="items-center justify-between"
          @click="$emit('update:constantId', constant.id)"
        >
          {{ constant.title || constant.id }}
          <q-btn
            v-if="baseDocUrl"
            dense
            flat
            size="xs"
            icon="question_mark"
            target="_blank"
            :href="baseDocUrl + constant.id + '.html'"
            :title="t('showThing', { thing: t('documentation') })"
            @click.stop=""
          />
        </q-item>
      </q-list>
      <q-separator />
    </div>
    <q-list dense>
      <q-item
        v-if="baseDocUrl && defaultConstant"
        clickable
        target="_blank"
        :href="baseDocUrl + defaultConstant.id + '.html'"
      >
        <q-item-section>
          {{ t('showThing', { thing: t('documentation') }) }}
        </q-item-section>
      </q-item>
      <q-item v-show="isValueSet" clickable @click="$emit('update:value', undefined)">
        <q-item-section v-t="'change'" />
      </q-item>
      <q-item clickable @click="$emit('enclose')">
        <q-item-section v-t="'encloseWithExpression'" />
      </q-item>
      <q-item v-close-popup clickable @click="$emit('remove')">
        <q-item-section v-t="'remove'" />
      </q-item>
    </q-list>
  </q-popup-edit>
</template>

<script lang="ts">
import { BooleanValue, Constant, DataType, DateTimeValue, NumberValue, StringValue, Value } from '@onto-med/top-api'
import { QPopupEdit } from 'quasar'
import { useEntity } from 'src/pinia/entity'
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { env } from 'src/config'

export default defineComponent({
  name: 'ConstantInput',
  props: {
    value: Object as () => Value|undefined,
    constantId: String,
    readonly: Boolean,
    expand: Boolean,
    indentLevel: {
      type: Number,
      default: 0
    },
    indent: {
      type: Number,
      default: 2
    }
  },
  emits: ['update:value', 'update:constantId', 'enclose', 'remove'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const popup = ref(null as unknown as QPopupEdit)
    const entityStore = useEntity()
    const constants = ref(undefined as Constant[]|undefined)
    const dataType = ref(DataType.Number)
    const isValueSet = computed(() => props.value || defaultConstant.value)

    void entityStore.getConstants()
      .then(o => constants.value = o)

    onMounted(() => {
      if (!props.value && !props.constantId)
        popup.value.show()
    })

    const defaultConstant = computed(() => constants.value?.find(c => c.id === props.constantId))

    const toValue = (value: string|number|Date|boolean|undefined, dataType: DataType): Value|undefined => {
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
      isValueSet,
      popup,
      constants,
      defaultConstant,
      dataType,
      baseDocUrl: computed(() => {
        const baseUrl = env.TOP_PHENOTYPIC_QUERY_DOC_BASE_URL
        return !baseUrl ? undefined : `${baseUrl}/constants/`
      }),

      setValue (value: string|number|Date|boolean|undefined) {
        emit('update:value', toValue(value, dataType.value))
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

      isStringValue: computed(() => props.value?.dataType === DataType.String),

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
