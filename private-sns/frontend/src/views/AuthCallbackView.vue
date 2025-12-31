<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  // OAuth認証後のコールバック処理
  await authStore.fetchUser()

  // ログイン済みならホームへ、そうでなければログインページへ
  if (authStore.isAuthenticated) {
    router.push('/')
  } else {
    router.push('/login')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-600">認証中...</p>
    </div>
  </div>
</template>
