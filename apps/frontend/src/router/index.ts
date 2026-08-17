import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';

// ルートメタ情報の型付け(vue-router 公式の module augmentation パターン)
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    title?: string;
  }
}

// 遅延読み込みコンポーネント
const LoginView = () => import('@/views/LoginView.vue');
const DashboardView = () => import('@/views/DashboardView.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresGuest: true,
      title: 'ログイン'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'ダッシュボード'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  }
});

// ナビゲーションガード
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // 認証状態の復元が完了するまで待機
  if (!authStore.isInitialized) {
    await authStore.restoreAuthState();
  }

  const isLoggedIn = authStore.isLoggedIn;

  // 認証が必要なルートのガード
  if (to.meta.requiresAuth && !isLoggedIn) {
    return '/login';
  }

  // ゲスト専用ルートのガード
  if (to.meta.requiresGuest && isLoggedIn) {
    return '/dashboard';
  }

  // ページタイトルの設定
  if (to.meta.title) {
    document.title = `${to.meta.title} - Babylon Stack`;
  } else {
    document.title = 'Babylon Stack';
  }

  return;
});

export default router;
