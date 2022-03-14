<template>
  <expandable-card
    :title="label"
    :error="modelValue === undefined"
    :help-text="helpText"
    :expanded="expanded"
    :show-help="showHelp"
  >
    <template #default>
      <q-editor
        ref="editorRef"
        :model-value="modelValue"
        :definitions="definitions"
        :toolbar="toolbar"
        :readonly="readonly"
        debounce="200"
        type="textarea"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <template #class>
          <q-btn-dropdown
            v-model="showClassMenu"
            dense
            no-wrap
            unelevated
            :disable="readonly"
            :label="t('class')"
            size="sm"
            menu-anchor="bottom start"
            menu-self="top start"
          >
            <q-list dense>
              <q-item>
                <q-item-section>
                  <entity-search-input
                    :entity-types="[ EntityType.SinglePhenotype, EntityType.CombinedPhenotype, EntityType.DerivedPhenotype ]"
                    :organisation-id="organisationId"
                    :repository-id="repositoryId"
                    @entity-selected="insertEntity"
                    @btn-clicked="showClassMenu = false"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>
      </q-editor>
    </template>
  </expandable-card>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandableCard from 'src/components/ExpandableCard.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import { EntityType, Entity } from '@onto-med/top-api'
import { QEditor } from 'quasar'

export default defineComponent({
  name: 'ExpressionInput',
  components: {
    ExpandableCard,
    EntitySearchInput
  },
  props: {
    modelValue: {
      type: String,
      default: () => ''
    },
    label: String,
    helpText: String,
    expanded: Boolean,
    showHelp: Boolean,
    organisationId: String,
    repositoryId: String,
    readonly: Boolean
  },
  emits: ['update:modelValue'],
  setup () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t } = useI18n()
    const showClassMenu = ref(false)
    const editorRef = ref(null as unknown as QEditor)

    const insert = (operator: string): void => {
      const editor = editorRef.value
      editor.runCmd('insertText', operator)
      editor.focus()
    }

    const definitions = computed(() => {
      return {
        addition: {
          icon: 'add',
          tip: t('addition'),
          handler: () => insert('+')
        },
        substraction: {
          icon: 'remove',
          tip: t('subtraction'),
          handler: () => insert('-')
        },
        multiplication: {
          icon: 'close',
          tip: t('multiplication'),
          handler: () => insert('*')
        },
        division: {
          icon: 'percent',
          tip: t('division'),
          handler: () => insert('/')
        },
        base: {
          icon: 'subscript',
          tip: t('base'),
          handler: () => insert('_')
        },
        power: {
          icon: 'superscript',
          tip: t('exponent'),
          handler: () => insert('^')
        },
        sqrt: {
          label: 'sqrt()',
          tip: t('squareRoot'),
          handler: () => insert('sqrt')
        },
        if_else: {
          label: t('condition'),
          tip: 'if_else(expression, true, false)',
          handler: () => insert('if_else')
        }
      }
    })

    const toolbar = computed(() => [
      Object.keys(definitions.value),
      [ 'class' ],
      [ 'undo', 'redo' ]
    ])

    return {
      t, editorRef, showClassMenu, definitions, toolbar, EntityType,

      insertEntity (entity: Entity): void {
        const editor = editorRef.value
        if (entity.id) {
          editor.runCmd('insertHTML', '[' + entity.id + ']')
          showClassMenu.value = false
        }
      },
      insert
    }
  }
})
</script>
