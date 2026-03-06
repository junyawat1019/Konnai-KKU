<template>
  <div>
    <Navbar @updateLocation="$emit('updateLocation', $event)" />
    <main>
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/layouts/components/Navbar.vue'
import Footer from '@/layouts/components/Footer.vue'
</script>

<style>
main {
  padding: 1rem;
}
</style>
