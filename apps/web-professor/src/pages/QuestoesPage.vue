<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Banco de questões</template>
    <template #subtitulo>Questões objetivas e discursivas, com tags e busca</template>

    <EmConstrucao tela="Banco de questões" />
  </AppShell>
</template>
