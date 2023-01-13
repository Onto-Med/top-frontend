<template>
  <q-dialog :model-value="show" @update:model-value="result = undefined; $emit('update:show', $event)">
    <q-card class="export-dialog">
      <q-card-section class="text-h6">
        {{ t('exportThing', { thing: t('repository') }) }}: {{ repository.name }}
      </q-card-section>

      <q-separator />

      <q-card-section v-t="'exportDescription'" />

      <q-separator />

      <q-card-section>
        <q-select
          v-model="format"
          :options="formats"
          :label="t('format')"
          :placeholder="t('selectThing', { thing: t('format') })"
          :error="!format"
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
              size="sm"
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
        <q-btn v-show="result" flat :label="t('saveAsFile')" @click="copyToFile()" />
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RepositoryApiKey } from 'src/boot/axios'
import { Purpose, Repository } from '@onto-med/top-api'
import useAlert from 'src/mixins/useAlert'
import { copyToClipboard, exportFile } from 'quasar'
import { useEntity } from 'src/pinia/entity'

export default defineComponent({
  props: {
    show: {
      type: Boolean,
      required: true
    },
    repository: {
      type: Object as () => Repository,
      required: true
    }
  },
  emits: ['update:show'],
  setup (props) {
    const { t, d }      = useI18n()
    const repositoryApi = inject(RepositoryApiKey)
    const entityStore   = useEntity()
    const { alert }     = useAlert()
    const format        = ref(undefined as string|undefined)
    const loading       = ref(false)
    const result        = ref(undefined as string|undefined)
    const formats       = ref<string[]>([])

    onMounted(() =>
      entityStore.getFormats(Purpose.Export)
        .then(f => formats.value = f.map(f => f.id)))

    return {
      t,
      d,
      format,
      loading,
      result,
      formats,

      doExport: async () => {
        if (loading.value || !format.value || !repositoryApi || !props.repository.organisation) return
        loading.value = true

        await repositoryApi.exportRepository(props.repository.organisation.id, props.repository.id, format.value)
          .then(r => result.value = r.data as string)
          .catch((e: Error) => alert(e.message))
          .finally(() => loading.value = false)
      },

      copyResult: () => {
        if (result.value)
          copyToClipboard(result.value)
            .then(() => alert(t('copiedToClipboard'), 'positive'))
            .catch(() => alert(t('copyFailed')))
      },

      copyToFile: () => {
        if (result.value)
          exportFile(props.repository.id + '.txt', result.value)
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
.result-field
  .q-field__inner
    .q-field__control
      padding-right: 0
  .q-field__append
    position: absolute
    right: 20px
</style>
