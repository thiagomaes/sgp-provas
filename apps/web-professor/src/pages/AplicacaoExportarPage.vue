<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Exportar aplicação</template>
    <template #subtitulo>Versões, embaralhamento, identificação do aluno e geração do PDF</template>

    <EmConstrucao tela="Exportar aplicação em PDF" />
  </AppShell>
</template>
