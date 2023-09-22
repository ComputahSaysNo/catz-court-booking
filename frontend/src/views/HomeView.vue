<script setup lang="ts">
import Calendar from "@/components/Calendar.vue"
import UserPanel from "@/components/UserPanel.vue";

import {useUserStore} from "@/stores/user";
import {computed, ref} from "vue";
import {useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";

const userStore = useUserStore()
const q = useQuery(SESSION_INFO).result

const e = computed(() => q.value?.data || null)
const dismissed = ref<boolean>(false)
</script>

<template>
  <main>
    <div class="">
      <UserPanel v-if="userStore.isAuthenticated"></UserPanel>
      <div v-else-if="!dismissed" class="container alert alert-info alert-dismissible mt-4 fw-bold">Login to make bookings
      <button class="btn-close" @click="dismissed=true"></button>
      </div>
      <div class="">
              <Calendar></Calendar>
      </div>
    </div>
  </main>
</template>
