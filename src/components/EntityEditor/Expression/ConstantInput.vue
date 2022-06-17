<template>
  <div>
    <div class="clickable">
      <span v-show="expand">{{ '&nbsp;'.repeat((indentLevel) * indent) }}</span>
      <span>{{ defaultConstant ? defaultConstant.title || defaultConstant.id : modelValue ? modelValue : '[' + t('constant') + ']' }}</span>
    </div>
    <q-popup-edit
      v-if="!readonly"
      ref="popup"
      v-slot="scope"
      :model-value="modelValue"
      :cover="false"
      auto-save
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <q-input v-model="scope.value" :type="dataType" dense autofocus @keyup.enter="scope.set">
        <template #append>
          <q-icon v-close-popup clickable name="check" class="cursor-pointer" />
        </template>
      </q-input>
      <q-list v-if="constants" dense>
        <q-item v-for="constant in constants" :key="constant.id" v-close-popup clickable @click="$emit('update:modelValue', constant.id)">
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
  </div>
</template>

<script lang="ts">
import { Constant } from '@onto-med/top-api';
import { QPopupEdit } from 'quasar';
import { useEntity } from 'src/pinia/entity';
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'ConstantInput',
  props: {
    modelValue: [Number, Date, String],
    dataType: {
      type: String,
      default: 'text'
    },
    readonly: Boolean,
    expand: Boolean,
    indentLevel: Number,
    indent: Number
  },
  emits: ['update:modelValue', 'enclose', 'remove'],
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const popup = ref(null as unknown as QPopupEdit)
    const entityStore = useEntity()
    const constants = ref(undefined as Constant[]|undefined)

    void entityStore.getConstants()
      .then(o => constants.value = o)

    onMounted(() => {
      if (!props.modelValue) popup.value.show()
    })

    const defaultConstant = computed(() => constants.value?.find(c => c.id === props.modelValue))

    return {
      t,
      popup,
      constants,
      defaultConstant
    }
  },
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