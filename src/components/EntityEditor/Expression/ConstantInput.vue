<template>
  <div class="clickable">
    {{ expand ? '&nbsp;'.repeat((indentLevel) * indent) : '' }}{{ modelValue ? modelValue : '[' + t('constant') + ']' }}
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
import { QPopupEdit } from 'quasar';
import { defineComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'ConstantInput',
  props: {
    modelValue: [Number, Date, String],
    dataType: {
      type: String,
      default: 'number'
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

    onMounted(() => {
      if (!props.modelValue) popup.value.show()
    })

    return {
      t,
      popup
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