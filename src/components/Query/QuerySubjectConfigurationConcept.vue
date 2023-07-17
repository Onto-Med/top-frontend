<template>
  <div>
    <q-btn dense flat icon="settings" :title="t('setting', 2)" @click="showDialog = true" />
    <q-dialog v-model="showDialog">
      <q-card class="criterion-config">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ t('setting', 2) }}
          </div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'dateTimeRestrictionDescription'" />
          <div class="row q-mt-sm">
            <range-input
              v-model:minimum="minimum"
              v-model:maximum="maximum"
              v-model:min-operator="state.minOperator"
              v-model:max-operator="state.maxOperator"
              :type="DataType.DateTime"
              class="col"
            />
            <q-btn
              flat
              icon="clear"
              :title="t('clearThing', { thing: t('dateTimeRestriction') })"
              class="col-auto"
              @click="clearDateTimeRestriction()"
            />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div v-t="'dateTimeRestrictionDescription'" />
          <div class="row q-mt-sm">
            <q-btn-dropdown label="{ t('language') }">
              <q-list>
                <q-item-section>
                  <q-item-label>Deutsch</q-item-label>
                </q-item-section>
                <q-item-section>
                  <q-item-label>English</q-item-label>
                </q-item-section>
              </q-list>
            </q-btn-dropdown>
            <q-btn
              flat
              icon="clear"
              :title="t('clearThing', { thing: t('dateTimeRestriction') })"
              class="col-auto"
              @click="clearDateTimeRestriction()"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTimeRestriction, DataType } from '@onto-med/top-api'
import RangeInput from 'components/EntityEditor/RangeInput.vue';

export default defineComponent({
  components: {RangeInput},
  props: {
    dateTimeRestriction: {
      type: Object as () => DateTimeRestriction,
      default: () => {
        return { type: DataType.DateTime, values: [] }
      }
    },
    conceptLanguage : {
      type: String,
      default: () => {
        return 'de'
      }
    }
  },
  emits: ['update:dateTimeRestriction'],
  setup (props, { emit }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, te } = useI18n()
    const state = reactive(JSON.parse(JSON.stringify(props.dateTimeRestriction)) as DateTimeRestriction)

    watch(
      () => state,
      () => emit('update:dateTimeRestriction', state),
      { deep: true }
    )

    return {
      t,
      te,
      state,
      DataType,
      showDialog: ref(false),

      clearDateTimeRestriction () {
        state.minOperator = undefined
        state.maxOperator = undefined
        state.values = []
      },

      minimum: computed({
        get: () => state.values ? state.values[0] : undefined,
        set: (val) => {
          if (!state.values) state.values = []
          state.values[0] = val as Date
          state.values[1] = state.values[1]
        }
      }),

      maximum: computed({
        get: () => state.values ? state.values[1] : undefined,
        set: (val) => {
          if (!state.values) state.values = []
          state.values[1] = val as Date
          state.values[0] = state.values[0]
        }
      })
    }
  }
})
</script>

<style lang="sass" scoped>
.criterion-config
  max-width: 800px
</style>
