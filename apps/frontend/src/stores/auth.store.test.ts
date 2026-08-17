import { describe, expect, it } from 'vitest';
import { isStoredUser } from './auth.store';

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

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
