<script setup lang="ts">
import Calendar from "@/components/Calendar.vue"

import {useUserStore} from "@/stores/user";
import {computed} from "vue";
import {useQuery} from "@vue/apollo-composable";
import {SESSION_INFO} from "@/queries";
const userStore = useUserStore()
const q = useQuery(SESSION_INFO).result

const e = computed(()=>q.value?.data || null)
</script>

<template>
  <main>
      <div class="">
        <Calendar></Calendar>
      </div>
  </main>
</template>
