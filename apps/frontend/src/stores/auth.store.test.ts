import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const authServiceMocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  checkSession: vi.fn(),
}));

vi.mock('@/services/auth.service', () => authServiceMocks);

import { isStoredUser, useAuthStore } from './auth.store';

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

beforeEach(() => {
  setActivePinia(createPinia());
  localStorage.clear();
  sessionStorage.clear();
  authServiceMocks.logout.mockClear();
});

// localStorage から復元した user は uuid 化に伴い id が string。number id は uuid 化前の
// 旧 localStorage 残骸であり、型ガードは string のみを受理して旧データを弾く必要がある。
describe('isStoredUser', () => {
  it('id が uuid string で name/email も string のとき true を返す', () => {
    expect(isStoredUser({ id: UUID, name: 'John Doe', email: 'john@example.com' })).toBe(true);
  });

  it('id が number(uuid 化前の旧 localStorage)のとき false を返す', () => {
    expect(isStoredUser({ id: 1, name: 'John Doe', email: 'john@example.com' })).toBe(false);
  });

  it('id が null のとき false を返す', () => {
    expect(isStoredUser({ id: null, name: 'John Doe', email: 'john@example.com' })).toBe(false);
  });

  it('id が欠落しているとき false を返す', () => {
    expect(isStoredUser({ name: 'John Doe', email: 'john@example.com' })).toBe(false);
  });

  it('name が欠落しているとき false を返す', () => {
    expect(isStoredUser({ id: UUID, email: 'john@example.com' })).toBe(false);
  });

  it('email が欠落しているとき false を返す', () => {
    expect(isStoredUser({ id: UUID, name: 'John Doe' })).toBe(false);
  });

  it('value が null のとき false を返す', () => {
    expect(isStoredUser(null)).toBe(false);
  });

  it('value が非 object(string)のとき false を返す', () => {
    expect(isStoredUser('not-an-object')).toBe(false);
  });
});

describe('guest session', () => {
  it('バックエンドを呼ばずゲスト状態を開始し、既存の認証情報を消去する', () => {
    localStorage.setItem('auth:token', 'old-token');
    localStorage.setItem('auth:isLoggedIn', 'true');
    localStorage.setItem('auth:currentUser', JSON.stringify({ id: UUID }));
    const store = useAuthStore();

    store.continueAsGuest();

    expect(store.isGuest).toBe(true);
    expect(store.isLoggedIn).toBe(false);
    expect(store.currentUser).toEqual({ id: 'guest', name: 'ゲスト', email: '' });
    expect(store.isInitialized).toBe(true);
    expect(sessionStorage.getItem('auth:isGuest')).toBe('true');
    expect(localStorage.getItem('auth:token')).toBeNull();
    expect(localStorage.getItem('auth:isLoggedIn')).toBeNull();
    expect(localStorage.getItem('auth:currentUser')).toBeNull();
  });

  it('ページ更新後にsessionStorageからゲスト状態を復元する', async () => {
    sessionStorage.setItem('auth:isGuest', 'true');
    const store = useAuthStore();

    await store.restoreAuthState();

    expect(store.isGuest).toBe(true);
    expect(store.currentUser?.name).toBe('ゲスト');
    expect(authServiceMocks.checkSession).not.toHaveBeenCalled();
  });

  it('ゲスト終了時はログアウトAPIを呼ばずセッションを消去する', async () => {
    const store = useAuthStore();
    store.continueAsGuest();

    await store.logout();

    expect(authServiceMocks.logout).not.toHaveBeenCalled();
    expect(store.isGuest).toBe(false);
    expect(store.currentUser).toBeNull();
    expect(sessionStorage.getItem('auth:isGuest')).toBeNull();
  });
});
