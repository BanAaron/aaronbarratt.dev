<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen">
    <nav class="sticky top-0 h-screen flex flex-col p-4 bg-pink-800">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
      <RouterLink to="/photography">Photography</RouterLink>
    </nav>
    <main class="flex-1">
      <RouterView/>
    </main>
  </div>
</template>
