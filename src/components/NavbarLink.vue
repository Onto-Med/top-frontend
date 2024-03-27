<template>
  <q-item clickable :exact="exact" :to="{ name: routeName }" :title="title" tag="a">
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label v-if="caption" caption>
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  routeName: {
    type: String,
    default: 'root'
  },
  icon: {
    type: String,
    default: ''
  },
  exact: Boolean
})
</script>
