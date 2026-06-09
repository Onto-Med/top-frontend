<template>
  <q-dialog ref="dialogRef">
    <q-card class="file-type-description">
      <q-card-section>
        <div class="text-h5">{{ props.title }}</div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <pre
          class="q-ma-md"
          v-html="props.text"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  title: string
}>()
</script>

<style scoped lang="scss">
.file-type-description {
  pre {
    font-family: inherit;
    text-wrap: wrap;
    word-wrap: break-word;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -pre-wrap;
    white-space: -o-pre-wrap;
  }
}
</style>
