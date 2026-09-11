<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Nova questão</template>
    <template #subtitulo>Cadastre uma questão objetiva ou discursiva</template>

    <EmConstrucao tela="Nova questão" />
  </AppShell>
</template>
