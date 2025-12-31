<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const username = ref('')
const error = ref('')
const loading = ref(false)

async function handleEmailAuth() {
  if (!email.value || !password.value) {
    error.value = 'メールアドレスとパスワードを入力してください'
    return
  }

  if (isSignUp.value && !username.value) {
    error.value = 'ユーザー名を入力してください'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (isSignUp.value) {
      const { error: signUpError } = await authStore.signUpWithEmail(
        email.value,
        password.value,
        username.value
      )
      if (signUpError) {
        error.value = signUpError.message
        return
      }
      // サインアップ成功
      router.push('/')
    } else {
      const { error: signInError } = await authStore.signInWithEmail(
        email.value,
        password.value
      )
      if (signInError) {
        error.value = signInError.message
        return
      }
      // ログイン成功
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogleAuth() {
  loading.value = true
  error.value = ''

  const { error: googleError } = await authStore.signInWithGoogle()

  if (googleError) {
    error.value = googleError.message
    loading.value = false
  }
}

async function handleTwitterAuth() {
  loading.value = true
  error.value = ''

  const { error: twitterError } = await authStore.signInWithTwitter()

  if (twitterError) {
    error.value = twitterError.message
    loading.value = false
  }
}

function toggleMode() {
  isSignUp.value = !isSignUp.value
  error.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- ロゴ -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
        <h2 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Private SNS
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ isSignUp ? '新しいアカウントを作成' : 'おかえりなさい' }}
        </p>
      </div>

      <!-- メインカード -->
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">

        <!-- エラーメッセージ -->
        <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <form class="space-y-4" @submit.prevent="handleEmailAuth">
          <div class="space-y-4">
            <!-- ユーザー名（サインアップ時のみ） -->
            <div v-if="isSignUp">
              <label for="username" class="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="username"
              />
            </div>

            <!-- メールアドレス -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="example@email.com"
              />
            </div>

            <!-- パスワード -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- メール認証ボタン -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            <span v-if="loading">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else>
              {{ isSignUp ? 'アカウントを作成' : 'ログイン' }}
            </span>
          </button>
        </form>

        <!-- OAuth ボタン -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-gray-500">または</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Google ログイン -->
          <button
            @click="handleGoogleAuth"
            :disabled="loading"
            class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="ml-2">Google</span>
          </button>

          <!-- Twitter ログイン -->
          <button
            @click="handleTwitterAuth"
            :disabled="loading"
            class="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span class="ml-2">X</span>
          </button>
        </div>

        <!-- モード切替 -->
        <div class="text-center pt-2">
          <button
            @click="toggleMode"
            class="text-sm text-gray-600 hover:text-purple-600 transition"
          >
            {{ isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
