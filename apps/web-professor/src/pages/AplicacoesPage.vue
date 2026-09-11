<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Aplicações e PDF</template>
    <template #subtitulo>Provas aplicadas às turmas e geração do PDF consolidado</template>

    <EmConstrucao tela="Aplicações e PDF" />
  </AppShell>
</template>
