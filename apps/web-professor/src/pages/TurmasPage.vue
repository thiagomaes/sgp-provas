<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Turmas</template>
    <template #subtitulo>Gerencie suas turmas e os alunos cadastrados</template>

    <EmConstrucao tela="Turmas" />
  </AppShell>
</template>
