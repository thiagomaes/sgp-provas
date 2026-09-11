<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Dashboard</template>
    <template #subtitulo>Visão geral das suas turmas, provas e correções</template>

    <EmConstrucao tela="Dashboard" />
  </AppShell>
</template>
