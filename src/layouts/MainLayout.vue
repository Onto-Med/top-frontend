<template>
  <q-layout view="hHh Lpr fFf" :class="{ 'bg-grey-1': !$q.dark.isActive }" aria-disabled="true">
    <q-header
      elevated
      :class="{
        'bg-white text-grey-8': !$q.dark.isActive,
        'bg-dark text-grey-2': $q.dark.isActive,
      }"
      class="q-py-xs"
      height-hint="58"
    >
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-avatar rounded color="white">
          <img src="/images/logo.svg" />
        </q-avatar>
        <q-toolbar-title to="/" shrink class="text-weight-bold gt-xs">
          <router-link class="brand-link" to="/">
            {{ productName }}
          </router-link>
        </q-toolbar-title>

        <q-space />

        <div v-if="backendDetails" class="toolbar-input-container row no-wrap gt-sm">
          <fancy-entity-search fork @entity-selected="routeToEntity" />
        </div>

        <q-space />

        <q-btn
          flat
          dense
          rounded
          no-caps
          no-wrap
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :title="$q.dark.isActive ? t('lightMode') : t('darkMode')"
          class="q-mr-sm"
          @click="$q.dark.toggle()"
        />

        <language-switch />

        <div v-if="keycloak">
          <q-btn v-if="keycloak.authenticated" flat dense round class="q-ml-sm">
            <q-avatar :title="t('account')" color="primary" text-color="white" size="md">
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
      :class="{ 'bg-grey-2': !$q.dark.isActive }"
      :width="240"
    >
      <q-scroll-area class="fit">
        <q-list padding class="q-mb-sm">
          <NavbarLink
            v-bind="{ title: t('home'), icon: 'house', routeName: 'home', exact: true }"
          />

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
            v-for="link in links.filter((l) => !l.isHidden)"
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
                icon="code"
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
                icon="book"
                :href="documentationUrl"
                target="_blank"
                :label="t('documentation')"
              />
            </div>
          </div>
        </q-list>

        <div v-show="leftDrawerOpen" class="version-box q-px-md text-caption text-grey">
          {{ t('frontend') }}: v{{ version }}<br />
          {{ t('backend') }}: {{ backendDetails ? 'v' + backendDetails.version : t('unavailable') }}
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <q-scroll-area class="main-content">
        <router-view v-if="backendDetails" :key="repositoryId" />
        <div v-else-if="!loading" class="q-mt-xl q-px-xl q-gutter-lg text-center items-center">
          <div class="text-h5">
            {{ t('backendUnavailable') }}
          </div>
          <q-btn icon="refresh" :label="t('tryAgain')" @click="performPing()" />
        </div>
        <q-inner-loading :showing="loading" />
      </q-scroll-area>
    </q-page-container>

    <q-ajax-bar position="top" color="primary" />
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEntityStore } from 'src/stores/entity-store'
import NavbarLink from 'src/components/NavbarLink.vue'
import LanguageSwitch from 'src/components/LanguageSwitch.vue'
import FancyEntitySearch from 'src/components/EntityEditor/FancyEntitySearch.vue'
import packageInfo from '../../package.json'
import { ref, computed, watch } from 'vue'
import { AppDescription } from '@onto-med/top-api'
import { QMenu, useMeta, useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { env } from 'src/config'
import { inject } from 'vue'
import { DefaultApiKey } from 'src/boot/axios'
import { onMounted } from 'vue'
import useEntityFormatter from 'src/mixins/useEntityFormatter'
import { MetaOptions } from 'quasar/dist/types/meta.js'

// eslint-disable-next-line @typescript-eslint/unbound-method
const { t, te } = useI18n()
const router = useRouter()
const entityStore = useEntityStore()
const $q = useQuasar()
const { routeToEntity } = useEntityFormatter()
const leftDrawerOpen = ref<boolean>(!($q.localStorage.getItem('minimiseDrawer') as boolean))
const { keycloak, organisation } = storeToRefs(entityStore)
const drawer = ref(undefined as QMenu | undefined)
const version = packageInfo.version
const defaultApi = inject(DefaultApiKey)
const loading = ref(false)
const backendDetails = ref<AppDescription>()

const links = computed(() => {
  const links = [
    {
      title: t('query', 2),
      icon: 'manage_search',
      caption: t('navbar.query.caption'),
      routeName: 'queryBuilder',
      isHidden: keycloak.value && !keycloak.value.authenticated,
    },
  ]
  if (env.DOCUMENTS_ENABLED) {
    links.push({
      title: t('document', 2),
      icon: 'article',
      caption: t('documentSearch.short'),
      routeName: 'documentSearch',
      isHidden: keycloak.value && !keycloak.value.authenticated,
    })
  }
  return links
})

const productName = packageInfo.productName
const documentationUrl = packageInfo.homepage
const repositoryUrl = packageInfo.repository
  ? ((packageInfo.repository as Record<string, unknown>).url as string)
  : undefined
const editAccountUrl = computed(() => keycloak.value?.createAccountUrl())

const smallScreen = computed(() => $q.screen.lt.md)
const username = computed(
  () =>
    (keycloak.value?.tokenParsed?.name || keycloak.value?.tokenParsed?.preferred_username) as
      | string
      | undefined,
)

const repositoryId = computed(() => {
  const route = router.currentRoute.value
  if (!route || route.name !== 'editor') return undefined
  return route.params.repositoryId as string | undefined
})

const routeName = computed(() => router.currentRoute.value?.name?.toString())

const metaData = () =>
  ({
    title: !!routeName.value && te(routeName.value) ? t(routeName.value) : undefined,
    titleTemplate: (title: string) => `${title} - ${productName}`,
    meta: [
      {
        name: 'description',
        content: t('appDescription'),
      },
      {
        name: 'keywords',
        content: t('appKeywords'),
      },
    ],
  }) as unknown as MetaOptions

useMeta(metaData)

onMounted(() => {
  $q.dark.set($q.localStorage.getItem('darkMode') as boolean)
  performPing()
})

watch(leftDrawerOpen, (newVal) => $q.localStorage.set('minimiseDrawer', !newVal))

watch(
  () => $q.dark.isActive,
  (newVal) => $q.localStorage.set('darkMode', newVal),
)

function performPing() {
  if (loading.value) return
  loading.value = true
  defaultApi
    ?.ping()
    .then((r) => (backendDetails.value = r.data))
    .catch(() => {})
    .finally(() => (loading.value = false))
}

function toggleLeftDrawer() {
  if (($q.platform.is.mobile || $q.screen.lt.md) && drawer.value) drawer.value.show()
  else leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style lang="scss" scoped>
.toolbar-input-container {
  min-width: 100px;
  width: 40%;
}
.brand-link {
  text-decoration: none;
  color: inherit;
}
.main-content {
  height: calc(100vh - 58px);
}

.version-box {
  position: absolute;
  bottom: 0;
}
</style>

<style lang="scss">
.main-content > .q-scrollarea__container > .q-scrollarea__content {
  width: 100%;
}
</style>
