<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Detalhe do relatório</template>
    <template #subtitulo>Estatísticas da aplicação e exportação em CSV, Excel e PDF</template>

    <EmConstrucao tela="Detalhe do relatório" />
  </AppShell>
</template>
