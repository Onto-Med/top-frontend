<template>
  <q-page v-if="organisation && repository" class="q-pa-md q-gutter-md">
    <q-card>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useEntity } from 'src/pinia/entity'
import {storeToRefs} from "pinia";

const entityStore = useEntity()
const { entities, repository, organisation } = storeToRefs(entityStore)
</script>

<style scoped lang="sass">

</style>
