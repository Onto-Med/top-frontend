<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        {{ label || t('restriction') }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section class="q-pa-md">
      <div v-for="(component, index) in modelValue" :key="index" class="row">
        <q-input v-model="component.value" outlined :type="dataType">
          <template #before>
            <q-select
              v-model="component.operator"
              :options="operators || defaultOperators"
              emit-value
              map-options
            />
          </template>
          <template #after>
            <q-btn
              color="red"
              icon="remove"
              class="remove-localized-text-btn"
              :title="t('remove')"
              @click="removeComponentByIndex(index)"
            />
          </template>
        </q-input>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions>
      <q-btn
        color="primary"
        icon="add"
        class="add-restriction-component-btn"
        :label="t('addThing', { thing: name || t('component') })"
        @click="addComponent()"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataType, IRestrictionComponent, RestrictionOperator } from 'src/components/models'

export default defineComponent({
  name: 'RestrictionInput',
  props: {
    modelValue: {
      type: Array as () => IRestrictionComponent[],
      required: true
    },
    name: String,
    label: String,
    operators: Array,
    dataType: String as () => DataType
  },
  emits: ['update:modelValue'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const defaultOperators = computed(() => Object.values(RestrictionOperator))
    return { t, defaultOperators }
  },
  methods: {
    removeComponentByIndex (index: number) {
      let newModelValue = this.modelValue.slice()
      newModelValue.splice(index, 1)
      this.$emit('update:modelValue', newModelValue)
    },
    addComponent () {
      let newModelValue = this.modelValue.slice()
      newModelValue.push({} as IRestrictionComponent)
      this.$emit('update:modelValue', newModelValue)
    }
  }
})
</script>
