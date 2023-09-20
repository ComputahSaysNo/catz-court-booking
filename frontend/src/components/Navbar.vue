<script setup lang="ts">
import {useUserStore} from "@/stores/user";
const userStore = useUserStore()

</script>

<template>
<nav class="navbar navbar-expand-sm bg-danger p-3">
  <div class="container-fluid">
    <span class="navbar-brand text-white fw-bold">Catz Court Booking</span>
      <form class="d-flex">
      <a href="http://127.0.0.1:8000/accounts/login/google-oauth2/" v-if="!userStore.isAuthenticated" class="btn btn-outline-light">
        <i class="bi bi-person"></i>
        Log in with Raven</a>
    </form>
  </div>

</nav>
</template>

<style scoped>

</style>