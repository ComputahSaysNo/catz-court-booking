<script setup lang="ts">
import {useUserStore} from "@/stores/user";
import {useTokenStore} from "@/stores/token";

const userStore = useUserStore()
const tokenStore = useTokenStore()

function logout() {
  userStore.user = null
  userStore.isAuthenticated = false
  tokenStore.token = null
}

</script>

<template>
  <nav class="navbar navbar-expand-sm bg-danger">
    <div class="container-fluid">
      <span class="navbar-brand text-white fw-bold fs-4">
        <img src="@/assets/catz-wheel.svg" width="35" height="35" class="mb-1 mx-1">
        Catz Court Booking</span>
      <form class="d-flex">
        <a href="http://127.0.0.1:8000/accounts/login/google-oauth2/" v-if="!userStore.isAuthenticated"
           class="btn btn-outline-light">
          <i class="bi bi-person"></i>
          Log in with Raven</a>
        <div v-else>
          <span class="mx-4 text-light fst-italic">logged in as {{userStore.user?.email}}</span>
          <a href="http://127.0.0.1:8000/accounts/logout" class="btn btn-outline-light">Log out</a>
        </div>


      </form>
    </div>

  </nav>
</template>

<style scoped>

</style>