import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'root',
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'editor', path: '/:organisationName/:repositoryName/:entityId?', props: true, component: () => import('pages/Editor.vue') },
      { name: 'organisation', path: '/organisation', component: () => import('pages/Organisation.vue') }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
