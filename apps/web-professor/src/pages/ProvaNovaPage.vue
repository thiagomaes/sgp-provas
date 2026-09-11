<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Nova prova</template>
    <template #subtitulo>Monte a prova com até 20 questões e pontuação por questão</template>

    <EmConstrucao tela="Nova prova" />
  </AppShell>
</template>
