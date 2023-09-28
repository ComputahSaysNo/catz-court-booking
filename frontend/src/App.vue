<script setup lang="ts">

// components
import Navbar from "@/components/Navbar.vue"
import Footer from "@/components/Footer.vue"




</script>

<template>
  <div id="app">
    <Navbar id="nav"></Navbar>
    <div id="main">
      <RouterView/>
    </div>
    <Footer id="footer"></Footer>
  </div>

</template>

<style scoped>
</style>