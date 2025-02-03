<template v-slot="append">
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-content">
      <q-card-section>
        <div v-t="'codeImport.title'" class="text-h6" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <p v-t="'codeImport.fileDescription'" class="q-mb-none" />
        <q-file
          v-model="csvFile"
          :label="t('codeImport.selectFile') + '...'"
          :loading="loading"
          accept=".csv"
          clearable
          @update:model-value="loadCodes"
        >
          <template #prepend>
            <q-icon name="attach_file" />
          </template>
          <template #after>
            <div class="text-caption">
              <q-checkbox
                v-model="hasHeader"
                :label="t('codeImport.hasHeader')"
                @update:model-value="onHasHeaderChanged($event)"
              />
            </div>
          </template>
        </q-file>
      </q-card-section>

      <q-separator v-show="codes.length > 0" />

      <q-card-section v-show="codes.length > 0" class="q-pa-none">
        <p v-t="'codeImport.selectCodesToImport'" class="q-px-md q-pt-sm q-mb-none" />
        <q-table
          v-model:selected="selection"
          flat
          dense
          hide-pagination
          virtual-scroll
          hide-selected-banner
          :title="t('code', 2)"
          :rows="tableRows"
          :columns="columns"
          :row-key="codeKey"
          :no-data-label="t('noDataPresent')"
          :rows-per-page-options="[0]"
          :virtual-scroll-sticky-size-start="48"
          selection="multiple"
          class="codes-table"
        >
          <template #body-cell-codeSystem="props">
            <q-td key="codeSystem" :props="props">
              {{ props.row.codeSystem.uri }}
              <q-popup-edit
                v-slot="scope"
                v-model="props.row.codeSystem.uri"
                buttons
                :label-cancel="t('cancel')"
                :label-set="t('set')"
              >
                <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" />
              </q-popup-edit>
            </q-td>
          </template>
          <template #body-cell-code="props">
            <q-td key="code" :props="props">
              {{ props.row.code }}
              <q-popup-edit
                v-slot="scope"
                v-model="props.row.code"
                buttons
                :label-cancel="t('cancel')"
                :label-set="t('set')"
              >
                <q-input v-model="scope.value" dense autofocus @keyup.enter="scope.set" />
              </q-popup-edit>
            </q-td>
          </template>
          <template #body-cell-scope="props">
            <q-td key="code" :props="props">
              {{ te('codeScopes.' + props.row.scope) ? t('codeScopes.' + props.row.scope) : props.row.scope }}
              <q-popup-edit
                v-slot="scope"
                v-model="props.row.scope"
                buttons
                :label-cancel="t('cancel')"
                :label-set="t('set')"
              >
                <enum-select
                  v-model:selected="scope.value"
                  i18n-prefix="codeScope"
                  :enum="CodeScope"
                  dense
                  autofocus
                  required
                />
              </q-popup-edit>
            </q-td>
          </template>
          <template #bottom>
            {{ t('recordSelected', selection.length) }}
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('cancel')" color="primary" @click="onCancelClick" />
        <q-btn flat :disable="!isValid" :label="t('import')" color="primary" @click="onOkClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Code, CodeScope } from '@onto-med/top-api'
import { useDialogPluginComponent } from 'quasar'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { parse } from 'papaparse'
import useNotify from 'src/mixins/useNotify'
import EnumSelect from 'src/components/EnumSelect.vue'

const emit = defineEmits(['hide', 'ok'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const { renderError } = useNotify()
const onCancelClick = onDialogCancel
const codes = ref<Code[]>([])
const selection = ref<Code[]>([])
const hasHeader = ref(false)
const loading = ref(false)
const csvFile = ref<File>()

const isValid = computed(() => selection.value.length > 0)

const columns = computed(() => [
  {
    name: 'codeSystem',
    required: true,
    label: t('codeSystem'),
    field: (row: Code) => row.codeSystem.uri,
    sortable: true
  },
  {
    name: 'code',
    required: true,
    label: t('code'),
    field: (row: Code) => row.code,
    sortable: true
  }
])

const tableRows = computed(() => codes.value.filter((_row, index) => !hasHeader.value || index !== 0))

function codeKey(code: Code) {
  return `${code.codeSystem.uri}#${code.code}`
}

function loadCodes() {
  if (loading.value) return
  if (!csvFile.value) {
    codes.value = []
    return
  }
  loading.value = true
  csvFile.value
    .text()
    .then((content) => {
      const data = parse(content, {
        skipEmptyLines: true
      }).data as Array<Array<string>>
      codes.value = data.map((row) => ({
        codeSystem: { uri: row[0] },
        code: row[1],
      }))
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function onHasHeaderChanged(value?: boolean) {
  if (!value || codes.value.length == 0) return
  const key = codeKey(codes.value[0])
  selection.value = selection.value.filter((s) => codeKey(s) !== key)
}

function onOkClick() {
  if (!isValid.value) return
  emit('ok', selection.value)
  onDialogHide()
}
</script>

<style lang="sass">
.dialog-content
  min-width: 30vw

.codes-table
  max-height: 65vh
  thead tr th
    position: sticky
    z-index: 1
    border-top-width: 1px !important
    background: #e0e0e0 !important
  thead tr:first-child th
    top: 0
  &.q-table--loading thead tr:last-child th
    top: 48px
</style>
