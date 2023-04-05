<template>
  <q-item
    clickable
    exact
    :to="{ name: routeName }"
    :title="title"
    tag="a"
  >
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

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'NavbarLink',
  props: {
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
    }
  },
  setup () {
    const route = useRoute()
    const currentRouteName = computed(() => route.name)

    return { currentRouteName }
  }
})
</script>
