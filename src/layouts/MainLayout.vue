<template>
  <q-layout view="hHh Lpr fFf" :class="{ 'bg-grey-1': !isDarkModeActive }">
    <q-header elevated :class="{ 'bg-white text-grey-8': !isDarkModeActive, 'bg-dark text-grey-2': isDarkModeActive }" class="q-py-xs" height-hint="58">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-avatar>
          <img src="images/logo.svg">
        </q-avatar>
        <q-toolbar-title to="/" shrink class="text-weight-bold">
          <router-link class="brand-link" to="/">
            {{ productName }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <div class="toolbar-input-container row no-wrap gt-sm">
          <entity-search-input
            :label="t('searchThing', { thing: t('entity') }) + '...'"
            outlined
            dense
            clear-on-select
            show-details
            fork
            class="q-mr-sm fit"
            @entity-selected="routeToEntity"
            @fork-clicked="forkOrigin = $event; showForkCreateDialog = true"
          >
            <template #append>
              <q-btn dense flat icon="search" :title="t('search')" />
            </template>
          </entity-search-input>
        </div>

        <q-space />

        <q-btn
          flat
          dense
          rounded
          no-caps
          no-wrap
          :icon="isDarkModeActive ? 'light_mode' : 'dark_mode'"
          :title="isDarkModeActive ? t('lightMode') : t('darkMode')"
          class="q-mr-sm"
          @click="toggleDarkMode()"
        />

        <language-switch />

        <div v-if="keycloak">
          <q-btn
            v-if="keycloak.authenticated"
            flat
            dense
            rounded
            no-caps
            :title="t('account')"
            icon="account_circle"
            class="q-ml-sm"
          >
            <q-menu>
              <div class="row no-wrap q-pa-md">
                <div class="column items-center">
                  <div class="text-h6 q-mb-md">
                    {{ t('setting', 2) }}
                  </div>
                  <q-btn
                    flat
                    no-caps
                    :label="t('editAccount')"
                    :href="editAccountUrl"
                    target="_blank"
                  />
                </div>
                <q-separator vertical inset class="q-mx-lg" />
                <div class="column items-center">
                  <q-avatar icon="person" size="72px" />
                  <div class="text-subtitle1 q-mb-xs">
                    {{ keycloak.tokenParsed?.preferred_username }}
                  </div>
                  <q-btn
                    v-close-popup
                    color="primary"
                    :label="t('logOut')"
                    push
                    size="sm"
                    @click="keycloak?.logout()"
                  />
                </div>
              </div>
            </q-menu>
          </q-btn>
          <q-btn
            v-else
            flat
            dense
            round
            icon="login"
            :title="t('logIn')"
            class="q-ml-sm"
            @click="keycloak?.login()"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      ref="drawer"
      :mini="!leftDrawerOpen"
      show-if-above
      bordered
      :class="{ 'bg-grey-2': !isDarkModeActive }"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <NavbarLink
            v-for="link in links.filter(l => !l.isHidden)"
            :key="link.title"
            v-bind="link"
          />

          <q-separator v-show="leftDrawerOpen" class="q-mt-md q-mb-lg" />

          <div v-show="leftDrawerOpen" class="q-px-md text-grey">
            <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
              <q-btn
                v-if="repositoryUrl"
                flat
                dense
                no-caps
                size="sm"
                :icon="fabGithub"
                :href="repositoryUrl"
                target="_blank"
                :label="t('sourceCode')"
              />
              <q-btn
                v-if="documentationUrl"
                flat
                dense
                no-caps
                size="sm"
                :icon="fasBook"
                :href="documentationUrl"
                target="_blank"
                :label="t('documentation')"
              />
            </div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <fork-create-dialog
      v-model:show="showForkCreateDialog"
      :origin="forkOrigin"
      @create-fork="forkEntity(forkOrigin, $event)"
    />

    <q-page-container>
      <router-view :key="repositoryId" />
    </q-page-container>

    <q-ajax-bar
      position="top"
      color="primary"
    />
  </q-layout>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import NavbarLink from 'src/components/NavbarLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import EntitySearchInput from 'src/components/EntityEditor/EntitySearchInput.vue'
import ForkCreateDialog from 'src/components/EntityEditor/Forking/ForkCreateDialog.vue'
import packageInfo from '../../package.json'
import { defineComponent, ref, computed } from 'vue'
import { Entity, ForkingInstruction } from '@onto-med/top-api'
import { QMenu, useQuasar } from 'quasar'
import { fasBook, fabGithub } from '@quasar/extras/fontawesome-v5'
import useNotify from 'src/mixins/useNotify'

export default defineComponent({
  components: {
    NavbarLink,
    LanguageSwitch,
    EntitySearchInput,
    ForkCreateDialog
  },

  setup () {
    const { t } = useI18n()
    const router = useRouter()
    const entityStore = useEntity()
    const leftDrawerOpen = ref(true)
    const $q = useQuasar()
    const { notify, renderError } = useNotify()
    const keycloak = entityStore.keycloak
    const forkOrigin = ref(undefined as Entity|undefined)
    const drawer = ref(undefined as QMenu|undefined)

    const linksList = computed(() => [
      {
        title: t('home'),
        icon: 'house',
        routeName: 'home'
      },
      {
        title: t('organisation', 2),
        icon: 'groups',
        caption: t('collaborativeWork'),
        routeName: 'organisations',
      },
      {
        title: t('document', 2),
        icon: 'article',
        caption: t('documentSearch', 2),
        routeName: 'documentSearch',
        isHidden: keycloak && !keycloak.authenticated
      }
    ])

    return {
      t,
      drawer,
      productName: packageInfo.productName,
      documentationUrl: packageInfo.homepage,
      repositoryUrl: packageInfo.repository ? (packageInfo.repository as Record<string, unknown>).url as string : undefined,
      links: linksList,
      leftDrawerOpen,
      fabGithub,
      fasBook,
      keycloak,
      forkOrigin,
      showForkCreateDialog: ref(false),

      editAccountUrl: keycloak?.createAccountUrl(),

      repositoryId: computed(() => {
        const route = router.currentRoute.value
        if (!route || route.name !== 'editor') return undefined
        return route.params.repositoryId as string|undefined
      }),

      toggleLeftDrawer () {
        if (($q.platform.is.mobile || $q.screen.lt.md) && drawer.value)
          drawer.value.show()
        else
          leftDrawerOpen.value = !leftDrawerOpen.value
      },

      routeToEntity (entity: Entity) {
        if (!entity.repository || !entity.repository.organisation) return
        void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
      },

      forkEntity (entity: Entity|undefined, forkingInstruction: ForkingInstruction) {
        if (!entity) return
        entityStore.forkEntity(entity, forkingInstruction)
          .then((count) => {
            forkOrigin.value = undefined
            notify(t('thingCreatedOrUpdated', { thing: `${count} ` + t('fork', count) }), 'positive')
          })
          .catch((e: Error) => renderError(e))
      },

      toggleDarkMode: $q.dark.toggle,

      isDarkModeActive: computed(() => $q.dark.isActive)
    }
  }
})
</script>

<style lang="sass" scoped>
.toolbar-input-container
  min-width: 100px
  width: 55%
.brand-link
  text-decoration: none
  color: inherit
</style>
