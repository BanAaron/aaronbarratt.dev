<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen">
    <header class="sticky top-0 h-screen w-100 border-r">
      <nav class="flex flex-col p-4">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/photography">Photography</RouterLink>
      </nav>
    </header>
    <main class="flex-1">
      <RouterView/>
    </main>
  </div>
</template>
