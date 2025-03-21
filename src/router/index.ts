import { AxiosError } from 'axios'
import { defineRouter } from '#q-app/wrappers'
import useNotify from 'src/mixins/useNotify'
import { useEntityStore } from 'src/stores/entity-store'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */
export default defineRouter(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to) => {
    const entityStore = useEntityStore()
    const { renderError } = useNotify()

    if (to.meta.disabled) {
      return await Router.replace({ name: 'home' })
    }
    if (!to.meta.allowAnonymous) {
      if (entityStore.keycloak && !entityStore.keycloak.authenticated)
        return await entityStore.keycloak.login()
    }
    await entityStore
      .setOrganisationById(to.params.organisationId as string | undefined)
      .catch((e: AxiosError) => {
        renderError(e)
        void Router.push({ name: 'organisations' })
      })
      .then(() => entityStore.setRepositoryById(to.params.repositoryId as string | undefined))
      .catch((e: AxiosError) => {
        renderError(e)
        void Router.push({
          name: 'showOrganisation',
          params: { organisationId: to.params.organisationId },
        })
      })
  })

  return Router
})
