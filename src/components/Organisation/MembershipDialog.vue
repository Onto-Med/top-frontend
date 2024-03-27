<template v-slot="append">
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ t('manageThing', { thing: t('permission', 2) }) }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section v-if="isAuthenticated">
        <user-select v-model="user" required />
        <enum-select v-model:selected="permission" :enum="Permission" i18n-prefix="permission" required />
        <div>
          <q-btn
            type="submit"
            icon="add"
            color="primary"
            :disabled="loading"
            :label="t('add')"
            @click="addMembership()"
          />
          <q-btn flat type="reset" color="primary" :disabled="loading" :label="t('reset')" @click="resetMembership()" />
        </div>
      </q-card-section>

      <q-separator size="3px" />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :loading="loading"
          :rows="memberships"
          :columns="columns"
          :no-data-label="t('noDataPresent')"
          :pagination="initialPagination"
          :filter="filter"
          :rows-per-page-label="t('recordsPerPage')"
          :pagination-label="paginationLabel"
        >
          <template #top>
            <q-input v-model="filter" dense debounce="300" color="primary">
              <template #append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-space />
            <q-btn
              color="secondary"
              :disabled="loading"
              :label="t('reload')"
              icon="refresh"
              @click="reloadMemberships()"
            />
          </template>
          <template #body="bodyProps">
            <q-tr :props="bodyProps">
              <q-td>{{ bodyProps.row.user.username }}</q-td>
              <q-td
                :title="
                  te('permissionDescriptions.' + bodyProps.row.permission)
                    ? t('permissionDescriptions.' + bodyProps.row.permission)
                    : ''
                "
              >
                {{ permissionTitle(bodyProps.row.permission) }}
              </q-td>
              <q-td auto-width>
                <q-btn
                  v-if="isAuthenticated"
                  dense
                  icon="remove"
                  color="red"
                  :title="t('revokePermission')"
                  @click="deleteMembership(bodyProps.row)"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat :label="t('close')" color="primary" @click="onCancelClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { Organisation, OrganisationMembership, Permission, User } from '@onto-med/top-api'
import { storeToRefs } from 'pinia'
import { QDialog, QTableColumn, useQuasar } from 'quasar'
import { OrganisationApiKey } from 'src/boot/axios'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import EnumSelect from 'src/components/EnumSelect.vue'
import UserSelect from 'src/components/Organisation/UserSelect.vue'
import Dialog from 'src/components/Dialog.vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'

const props = defineProps<{
  organisation: Organisation
}>()

const emit = defineEmits(['hide', 'ok'])

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const { notify, renderError } = useNotify()
const { paginationLabel, permissionTitle } = useEntityFormatter()
const $q = useQuasar()
const dialog = ref<QDialog | undefined>(undefined)
const memberships = ref<OrganisationMembership[]>([])
const loading = ref(false)
const organisationApi = inject(OrganisationApiKey)
const user = ref<User | undefined>(undefined)
const permission = ref<Permission>(Permission.Read)
const { isAuthenticated } = storeToRefs(useEntity())
const filter = ref('')
const initialPagination = { sortBy: 'name', descenting: false, page: 1, rowsPerPage: 10 }

const columns = computed(() => {
  return [
    { name: 'user', label: t('user'), align: 'left', sortable: true, required: true },
    { name: 'permission', label: t('permission'), align: 'left', sortable: true, required: true },
    { name: 'actions', align: 'right', sortable: false }
  ] as QTableColumn[]
})

onMounted(async () => {
  await reloadMemberships()
})

function hide() {
  dialog.value?.hide()
}

async function reloadMemberships() {
  if (loading.value || !organisationApi) return
  loading.value = true

  await organisationApi
    .getOrganisationMemberships(props.organisation.id)
    .then((r) => {
      memberships.value = r.data
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function resetMembership() {
  user.value = undefined
  permission.value = Permission.Read
}

function onDialogHide() {
  emit('hide')
}

function onCancelClick() {
  hide()
}

async function addMembership() {
  if (!organisationApi || !isAuthenticated.value || !user.value) return
  loading.value = true

  const membership = {
    organisation: props.organisation,
    user: user.value,
    permission: permission.value
  } as OrganisationMembership

  await organisationApi
    .createOrganisationMembership(props.organisation.id, membership)
    .then(() => {
      const index = memberships.value.findIndex((m) => m.user.id === membership.user.id)
      if (index !== -1) {
        memberships.value[index] = membership
      } else {
        memberships.value.unshift(membership)
      }
      notify(t('thingCreated', { thing: t('permission') }), 'positive')
      resetMembership()
    })
    .catch((e: Error) => renderError(e))
    .finally(() => (loading.value = false))
}

function deleteMembership(membership: OrganisationMembership) {
  if (!organisationApi || !isAuthenticated.value) return
  $q.dialog({
    component: Dialog,
    componentProps: {
      message: t('confirmDeleteOrganisationMembership')
    }
  }).onOk(() => {
    loading.value = true
    organisationApi
      .deleteOrganisationMembership(props.organisation.id, membership)
      .then(() => {
        const index = memberships.value.findIndex((m) => m.user.id === membership.user.id)
        if (index !== -1) {
          memberships.value.splice(index, 1)
        }
        notify(t('thingDeleted', { thing: t('permission') }), 'positive')
      })
      .catch((e: Error) => renderError(e))
      .finally(() => (loading.value = false))
  })
}
</script>
