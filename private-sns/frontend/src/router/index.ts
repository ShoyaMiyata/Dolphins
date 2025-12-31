import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallbackView from '../views/AuthCallbackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackView,
    },
  ],
})

// 認証ガード
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 初回アクセス時にユーザー情報を取得
  if (authStore.loading) {
    await authStore.fetchUser()
  }

  // 認証が必要なページ
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // ゲストのみアクセス可能なページ（ログイン済みの場合はホームへ）
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
