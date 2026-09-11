<script setup lang="ts">
import AppShell from '../layouts/AppShell.vue'
import EmConstrucao from '../components/EmConstrucao.vue'
</script>

<template>
  <AppShell>
    <template #titulo>Detalhe da turma</template>
    <template #subtitulo>Alunos cadastrados e aplicações da turma</template>

    <EmConstrucao tela="Detalhe da turma" />
  </AppShell>
</template>
