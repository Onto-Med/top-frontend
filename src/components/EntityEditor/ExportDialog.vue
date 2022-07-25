<template>
  <q-dialog :model-value="show" @update:model-value="$emit('update:show', $event)">
    <q-card class="export-dialog">
      <q-card-section class="text-h6">
        {{ t('exportThing', { thing: getTitle(entity) }) }}
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p v-t="'exportDescription'" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-select
          v-model="format"
          :options="options"
          :label="t('format')"
          :placeholder="t('selectThing', { thing: t('format') })"
          :error="!format"
          emit-value
          map-options
          class="q-mb-md"
        >
          <template #after>
            <q-btn
              no-caps
              color="primary"
              icon="download"
              :label="t('export')"
              :disable="!format"
              @click="doExport"
            />
          </template>
        </q-select>

        <q-input v-model="result" filled type="textarea" class="result-field">
          <template #append>
            <q-btn
              dense
              flat
              icon="content_copy"
              :title="t('copyToClipboard')"
              :disable="!result"
              @click="copyResult"
            />
          </template>
        </q-input>

        <q-inner-loading
          :showing="loading"
          :label="t('pleaseWait') + '...'"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, inject, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EntityApiKey } from 'src/boot/axios'
import { Entity } from '@onto-med/top-api'
import useAlert from 'src/mixins/useAlert'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { copyToClipboard } from 'quasar'

export default defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true
    },
    entity: {
      type: Object as () => Entity,
    }
  },
  emits: ['update:show'],
  setup (props) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { t, d }     = useI18n()
    const entityApi    = inject(EntityApiKey)
    const { alert }    = useAlert()
    const format       = ref(undefined as string|undefined)
    const loading      = ref(false)
    const result       = ref(undefined as string|undefined)
    const { getTitle } = useEntityFormatter()

    watch(
      () => props.entity,
      (newVal: Entity|undefined, oldVal: Entity|undefined) => {
        if (newVal !== oldVal) result.value = undefined
      }
    )

    return {
      t,
      d,
      format,
      loading,
      result,
      getTitle,

      options: computed(() => [ { label: t('rScript'), value: 'vnd.r-project.r' } ]),

      doExport: async () => {
        if (loading.value || !format.value || !entityApi || !props.entity || !props.entity.id || !props.entity.repository || !props.entity.repository.organisation) return
        loading.value = true

        await entityApi.exportEntity(props.entity.repository.organisation.id, props.entity.repository.id, props.entity.id, format.value)
          .then(r => result.value = r.data)
          .catch((e: Error) => alert(e.message))
          .finally(() => loading.value = false)
      },

      copyResult: () => {
        if (result.value)
          copyToClipboard(result.value)
            .then(() => alert(t('copiedToClipboard'), 'positive'))
            .catch(() => alert(t('copyFailed')))
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.export-dialog
  min-width: 400px
</style>

<style lang="sass">
.result-field .q-field__append
  position: absolute
  right: 10px
</style>
