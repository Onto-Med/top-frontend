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

          <q-select
            v-model="importConverter"
            :options="importConverters"
            :label="t('importFormat')"
            :placeholder="t('selectThing', { thing: t('format') })"
            class="q-mb-md"
            option-label="id"
          />

          <q-file v-model="importFile" :label="t('repositoryImportFile')" :accept="acceptedExtension" :disable="!importConverter">
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
            <template #after>
              <q-btn
                no-caps
                color="primary"
                icon="upload"
                :label="t('import')"
                :disable="!importFile || !importConverter"
                @click="doImport"
              />
            </template>
          </q-file>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <p v-t="'exportDescription'" />

          <q-select
            v-model="exportConverter"
            :options="exportConverters"
            :label="t('exportFormat')"
            :placeholder="t('selectThing', { thing: t('format') })"
            option-label="id"
            class="q-mb-md"
            @change="result = undefined"
          >
            <template #after>
              <q-btn
                no-caps
                color="primary"
                icon="download"
                :label="t('export')"
                :disable="!exportConverter"
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
import { Converter, Purpose, Repository } from '@onto-med/top-api'
import useNotify from 'src/mixins/useNotify'
import { copyToClipboard, exportFile } from 'quasar'
import { useEntity } from 'src/pinia/entity'
import { storeToRefs } from 'pinia'

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
    const { notify, renderError } = useNotify()
    const exportConverter = ref(undefined as Converter|undefined)
    const importConverter = ref(undefined as Converter|undefined)
    const loading        = ref(false)
    const result         = ref(undefined as string|undefined)
    const { converters } = storeToRefs(entityStore)
    const importFile     = ref<File|undefined>(undefined)

    onMounted(() => entityStore.loadConverters())

    return {
      t,
      d,
      exportConverter,
      importConverter,
      loading,
      result,
      exportConverters: computed(() => converters.value?.filter(c => c.purpose === Purpose.Export)),
      importConverters: computed(() => converters.value?.filter(c => c.purpose === Purpose.Import)),
      acceptedExtension: computed(() =>
        importConverter.value && importConverter.value.fileExtension
        ? '.' + importConverter.value.fileExtension
        : undefined
      ),
      importFile,

      doExport: async () => {
        if (loading.value || !exportConverter.value || !repositoryApi || !props.repository.organisation) return
        loading.value = true

        await repositoryApi.exportRepository(props.repository.organisation.id, props.repository.id, exportConverter.value.id)
          .then(r => result.value = r.data as string)
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      doImport: () => {
        if (!repositoryApi || !importConverter.value || !importFile.value || !props.repository.organisation) return
        loading.value = true

        repositoryApi.importRepository(props.repository.organisation.id, props.repository.id, importConverter.value.id, importFile.value)
          .then(() => {
            notify(t('importFinished'), 'positive')
            emit('import')
            importConverter.value = undefined
            importFile.value = undefined
          })
          .catch((e: Error) => renderError(e))
          .finally(() => loading.value = false)
      },

      copyResult: () => {
        if (result.value)
          copyToClipboard(result.value)
            .then(() => notify(t('copiedToClipboard'), 'positive'))
            .catch(() => notify(t('copyFailed')))
      },

      copyToFile: () => {
        if (result.value)
          exportFile(`${props.repository.id}.${exportConverter.value?.fileExtension || 'txt'}`, result.value)
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
