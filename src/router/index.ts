import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Editor from '../views/Editor.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Editor',
    component: Editor
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
