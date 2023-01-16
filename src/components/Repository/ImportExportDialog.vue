<template>
  <q-dialog :model-value="show" @update:model-value="result = undefined; $emit('update:show', $event)">
    <q-card class="export-dialog">
      <q-card-section class="text-h6">
        {{ t('importOrExportThing', { thing: t('repository') }) }}
      </q-card-section>

      <q-separator />

      <div>
        <q-card-section>
          <p v-t="'importDescription'" />

          <q-file v-model="importFile" :label="t('repositoryImportFile')">
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <q-select
            v-model="importFormat"
            :options="importFormats"
            :label="t('importFormat')"
            :placeholder="t('selectThing', { thing: t('format') })"
            class="q-mb-md"
          >
            <template #after>
              <q-btn
                no-caps
                color="primary"
                icon="upload"
                :label="t('import')"
                :disable="!importFile || !importFormat"
                @click="doImport"
              />
            </template>
          </q-select>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <p v-t="'exportDescription'" />

          <q-select
            v-model="exportFormat"
            :options="exportFormats"
            :label="t('exportFormat')"
            :placeholder="t('selectThing', { thing: t('format') })"
            class="q-mb-md"
          >
            <template #after>
              <q-btn
                no-caps
                color="primary"
                icon="download"
                :label="t('export')"
                :disable="!exportFormat"
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
        </q-card-section>

        <q-inner-loading
          :showing="loading"
          :label="t('pleaseWait') + '...'"
        />
      </div>

      <q-separator />

      <q-card-actions align="right">
        <q-btn v-show="result" flat :label="t('saveAsFile')" @click="copyToFile()" />
        <q-btn v-close-popup flat :label="t('close')" color="primary" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, inject, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RepositoryApiKey } from 'src/boot/axios'
import { Format, Purpose, Repository } from '@onto-med/top-api'
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
  emits: ['update:show', 'import'],
  setup (props, { emit }) {
    const { t, d }      = useI18n()
    const repositoryApi = inject(RepositoryApiKey)
    const entityStore   = useEntity()
    const { alert }     = useAlert()
    const exportFormat  = ref(undefined as string|undefined)
    const importFormat  = ref(undefined as string|undefined)
    const loading       = ref(false)
    const result        = ref(undefined as string|undefined)
    const formats       = ref<Format[]>([])
    const importFile    = ref<File|undefined>(undefined)

    onMounted(() => entityStore.getFormats().then(f => formats.value = f))

    return {
      t,
      d,
      exportFormat,
      importFormat,
      loading,
      result,
      exportFormats: computed(() => formats.value.filter(f => f.purposes.includes(Purpose.Export)).map(f => f.id)),
      importFormats: computed(() => formats.value.filter(f => f.purposes.includes(Purpose.Import)).map(f => f.id)),
      importFile,

      doExport: async () => {
        if (loading.value || !exportFormat.value || !repositoryApi || !props.repository.organisation) return
        loading.value = true

        await repositoryApi.exportRepository(props.repository.organisation.id, props.repository.id, exportFormat.value)
          .then(r => result.value = r.data as string)
          .catch((e: Error) => alert(e.message))
          .finally(() => loading.value = false)
      },

      doImport: () => {
        if (!repositoryApi || !importFormat.value || !importFile.value || !props.repository.organisation) return
        loading.value = true

        repositoryApi.importRepository(props.repository.organisation.id, props.repository.id, importFormat.value, importFile.value)
          .then(() => {
            alert(t('importFinished'), 'positive')
            emit('import')
          })
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
