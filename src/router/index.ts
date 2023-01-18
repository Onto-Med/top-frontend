import { AxiosError } from 'axios'
import { route } from 'quasar/wrappers'
import useNotify from 'src/mixins/useNotify'
import { useEntity } from 'src/pinia/entity'
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

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE
    ),
  })

  Router.beforeEach(async (to) => {
    const entityStore = useEntity()
    const { renderError } = useNotify()

    if (!to.meta.allowAnonymous) {
      if (entityStore.keycloak && !entityStore.keycloak.authenticated)
        void entityStore.keycloak.login()
    }
    await entityStore.setOrganisation(to.params.organisationId as string | undefined)
      .catch((e: AxiosError) => {
        renderError(e)
        void Router.push({ name: 'organisations' })
      })
    await entityStore.setRepository(to.params.repositoryId as string | undefined)
      .catch((e: AxiosError) => {
        renderError(e)
        void Router.push({ name: 'showOrganisation' })
      })
  })

  return Router
})
