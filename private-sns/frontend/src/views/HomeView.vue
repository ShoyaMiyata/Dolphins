<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.fetchUser()
})

async function handleSignOut() {
  await authStore.signOut()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
    <!-- ヘッダー -->
    <header class="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-2xl mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <!-- ロゴ -->
          <div class="flex items-center space-x-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h1 class="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Private SNS
            </h1>
          </div>

          <!-- ユーザー情報 -->
          <div class="flex items-center space-x-3">
            <div v-if="authStore.profile" class="hidden sm:flex items-center space-x-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                {{ (authStore.profile.display_name || authStore.profile.username).charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-gray-700">
                {{ authStore.profile.display_name || authStore.profile.username }}
              </span>
            </div>
            <button
              @click="handleSignOut"
              class="text-sm text-gray-600 hover:text-purple-600 transition font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- ウェルカムカード -->
      <div class="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 mb-6 border border-white/20">
        <div class="flex items-center space-x-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl">
            {{ (authStore.profile?.display_name || authStore.profile?.username || '?').charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              ようこそ、{{ authStore.profile?.display_name || authStore.profile?.username }}さん！
            </h2>
            <p class="text-gray-600 text-sm mt-1">
              あなただけのプライベートSNSです
            </p>
          </div>
        </div>

        <!-- プロフィール情報 -->
        <div v-if="authStore.profile" class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 class="font-semibold text-gray-800 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            プロフィール情報
          </h3>
          <dl class="space-y-3">
            <div class="flex items-center">
              <dt class="flex items-center text-sm font-medium text-gray-600 w-24">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                ユーザー名
              </dt>
              <dd class="text-sm text-gray-900 font-medium">@{{ authStore.profile.username }}</dd>
            </div>
            <div class="flex items-center">
              <dt class="flex items-center text-sm font-medium text-gray-600 w-24">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                表示名
              </dt>
              <dd class="text-sm text-gray-900 font-medium">{{ authStore.profile.display_name || '未設定' }}</dd>
            </div>
            <div class="flex items-center">
              <dt class="flex items-center text-sm font-medium text-gray-600 w-24">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                メール
              </dt>
              <dd class="text-sm text-gray-900 font-medium">{{ authStore.user?.email }}</dd>
            </div>
          </dl>
        </div>

        <!-- 次のステップ -->
        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-blue-900">認証機能が正常に動作しています！</p>
              <p class="text-sm text-blue-700 mt-1">次は投稿機能を実装していきます。</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
