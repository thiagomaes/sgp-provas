<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Provas</template>
    <template #subtitulo>Provas reutilizáveis montadas a partir do banco de questões</template>

    <EmConstrucao tela="Provas" />
  </AppShell>
</template>
