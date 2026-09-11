<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Relatórios e notas</template>
    <template #subtitulo>Notas por aplicação e relatórios consolidados</template>

    <EmConstrucao tela="Relatórios e notas" />
  </AppShell>
</template>
