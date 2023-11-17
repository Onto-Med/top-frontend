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
        <q-toolbar-title to="/" shrink class="text-weight-bold gt-xs">
          <router-link class="brand-link" to="/">
            {{ productName }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <div class="toolbar-input-container row no-wrap gt-sm">
          <fancy-entity-search fork @entity-selected="routeToEntity" />
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
          <q-btn v-if="keycloak.authenticated" flat dense round class="q-ml-sm">
            <q-avatar
              :title="t('account')"
              color="primary"
              text-color="white"
              size="md"
            >
              {{ username ? username.substring(0, 1) : '' }}
            </q-avatar>

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
                  <div class="text-subtitle1 text-center q-mb-xs">
                    {{ username }}
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
            no-caps
            dense
            rounded
            icon="login"
            :label="smallScreen ? '' : t('logIn')"
            :title="t('logIn')"
            color="primary"
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
          <NavbarLink v-bind="{ title: t('home'), icon: 'house', routeName: 'home', exact: true }" />

          <q-expansion-item
            clickable
            exact
            default-opened
            :to="{ name: 'organisations' }"
            :label="t('model', 2)"
            :title="t('model', 2)"
            :caption="t('navbar.model.caption')"
            :hide-expand-icon="!organisation"
            icon="build"
            tag="a"
          >
            <q-item
              v-if="organisation"
              clickable
              :to="{ name: 'showOrganisation', params: { organisationId: organisation.id } }"
              :title="t('goToThing', { thing: t('organisation') })"
              :active="!!organisation"
              tag="a"
            >
              <q-item-section avatar>
                <q-icon name="groups" />
              </q-item-section>
              <q-item-section>
                {{ organisation.name }}
              </q-item-section>
            </q-item>
          </q-expansion-item>

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

    <q-page-container>
      <q-scroll-area class="main-content">
        <router-view :key="repositoryId" />
      </q-scroll-area>
    </q-page-container>

    <q-ajax-bar
      position="top"
      color="primary"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEntity } from 'src/pinia/entity'
import NavbarLink from 'src/components/NavbarLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import FancyEntitySearch from 'src/components/EntityEditor/FancyEntitySearch.vue'
import packageInfo from '../../package.json'
import { ref, computed, watch } from 'vue'
import { Entity } from '@onto-med/top-api'
import { QMenu, useQuasar } from 'quasar'
import { fasBook, fabGithub } from '@quasar/extras/fontawesome-v5'
import { storeToRefs } from 'pinia'
import { env} from 'src/config'

const { t } = useI18n()
const router = useRouter()
const entityStore = useEntity()
const $q = useQuasar()
const leftDrawerOpen = ref<boolean>(!($q.localStorage.getItem('minimiseDrawer') as boolean))
const { keycloak, organisation } = storeToRefs(entityStore)
const drawer = ref(undefined as QMenu|undefined)

const links = computed(() => {
  const links = [
    {
      title: t('query', 2),
      icon: 'person_search',
      caption: t('navbar.query.caption'),
      routeName: 'queryBuilder',
      isHidden: keycloak.value && !keycloak.value.authenticated
    }
  ]
  if (env.DOCUMENTS_ENABLED) {
    links.push({
      title: t('document', 2),
      icon: 'article',
      caption: t('documentSearch.short'),
      routeName: 'documentSearch',
      isHidden: keycloak.value && !keycloak.value.authenticated
    })
  }
  return links
})

const toggleDarkMode = $q.dark.toggle
const isDarkModeActive = computed(() => $q.dark.isActive)

const productName = packageInfo.productName
const documentationUrl = packageInfo.homepage
const repositoryUrl = packageInfo.repository
  ? (packageInfo.repository as Record<string, unknown>).url as string
  : undefined
const editAccountUrl = computed(() => keycloak.value?.createAccountUrl())


const smallScreen = computed(() => $q.screen.lt.md)
const username = computed(() =>
  (keycloak.value?.tokenParsed?.name || keycloak.value?.tokenParsed?.preferred_username) as string | undefined
)

const repositoryId = computed(() => {
  const route = router.currentRoute.value
  if (!route || route.name !== 'editor') return undefined
  return route.params.repositoryId as string|undefined
})

watch(
  leftDrawerOpen,
  (newVal) => $q.localStorage.set('minimiseDrawer', !newVal)
)

function toggleLeftDrawer() {
  if (($q.platform.is.mobile || $q.screen.lt.md) && drawer.value)
    drawer.value.show()
  else
    leftDrawerOpen.value = !leftDrawerOpen.value
}

function routeToEntity(entity: Entity) {
  if (!entity.repository || !entity.repository.organisation) return
  void router.push({ name: 'editor', params: { organisationId: entity.repository.organisation.id, repositoryId: entity.repository.id, entityId: entity.id } })
}
</script>

<style lang="sass" scoped>
.toolbar-input-container
  min-width: 100px
  width: 40%
.brand-link
  text-decoration: none
  color: inherit
.main-content
  height: calc(100vh - 58px)
</style>

<style lang="sass">
.main-content > .q-scrollarea__container > .q-scrollarea__content
  width: 100%
</style>
