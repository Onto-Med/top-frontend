<template>
  <expandable-card
    :error="!modelValue || !modelValue.function"
    :help-text="helpText"
    :expanded="expanded"
    :show-help="showHelp"
  >
    <template #title>
      <q-toolbar-title class="row items-center">
        {{ label }}
        <span class="text-subtitle1 q-ml-md">
          <q-toggle
            :model-value="scores"
            :label="scores ? t('score', 2) : t('expression')"
            color="primary"
            size="sm"
            @update:model-value="$emit('update:modelValue', { function: $event ? 'switch' : undefined })"
          />
        </span>
      </q-toolbar-title>
    </template>

    <template #default>
      <switch-input
        v-if="scores"
        :model-value="modelValue"
        :readonly="readonly"
        @entity-clicked="$emit('entityClicked', $event)"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <expression-argument-input
        v-else-if="functions"
        class="text-subtitle1"
        :functions="functions"
        :readonly="readonly"
        :class="{ monospace: monospace }"
        :model-value="modelValue"
        :expand="expandExpression"
        :indent="indent || 2"
        :organisation-id="organisationId"
        :repository-id="repositoryId"
        :entity-types="entityTypes"
        root
        @update:model-value="$emit('update:modelValue', $event)"
        @entity-clicked="$emit('entityClicked', $event)"
      />
    </template>

    <template #toolbar>
      <q-btn
        flat
        round
        dense
        icon="clear"
        :disable="readonly"
        :title="t('clearAll')"
        @click.stop="showClearDialog = true"
      />
      <q-btn
        flat
        round
        dense
        icon="settings"
        :title="t('setting', 2)"
        @click.stop
      >
        <q-menu class="q-pa-sm">
          <div class="text-h6 q-mb-sm">
            {{ t('setting', 2) }}
          </div>
          <q-toggle v-model="expandExpression" :label="t('expand')" />
          <q-input v-model.number="indent" type="number" :label="t('indentWithSpaces')" />
        </q-menu>
      </q-btn>
    </template>

    <template #append>
      <q-dialog v-model="showClearDialog">
        <q-card>
          <q-card-section class="row items-center">
            <q-avatar icon="warning_amber" color="warning" text-color="white" />
            <span v-t="'confirmClearExpression'" class="q-ml-sm" />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn v-close-popup flat :label="t('cancel')" color="primary" />
            <q-btn
              v-close-popup
              flat
              :label="t('ok')"
              :disable="readonly"
              color="primary"
              @click="$emit('update:modelValue', {})"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import ExpressionArgumentInput from 'src/components/EntityEditor/Expression/ExpressionArgumentInput.vue'
import SwitchInput from 'src/components/EntityEditor/Expression/SwitchInput.vue'
import { EntityType, Expression, ExpressionFunction } from '@onto-med/top-api'
import { useEntity } from 'src/pinia/entity'

export default defineComponent({
  components: {
    ExpressionArgumentInput,
    ExpandableCard,
    SwitchInput
  },
  props: {
    modelValue: {
      type: Object as () => Expression,
      default: () => { return {} }
    },
    label: String,
    monospace: {
      type: Boolean,
      default: true
    },
    expanded: Boolean,
    helpText: String,
    showHelp: Boolean,
    organisationId: String,
    repositoryId: String,
    readonly: Boolean,
    entityTypes: {
      type: Array as () => EntityType[],
      default: () => []
    },
    functionType: {
      type: String,
      required: true,
      validator: (value: string) => ['math', 'boolean'].includes(value)
    }
  },
  emits: ['update:modelValue', 'entityClicked'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const entityStore = useEntity()
    const functions = ref(undefined as ExpressionFunction[]|undefined)

    void entityStore.getFunctions(props.functionType)
      .then(o => functions.value = o)

    return {
      t,
      expandExpression: ref(false),
      indent: ref(2),
      showClearDialog: ref(false),
      functions,
      scores: computed(() => props.modelValue && props.modelValue.function === 'switch')
    }
  }
})
</script>

<style lang="sass" scoped>
.monospace
  font-family: monospace, monospace
</style>
