import { configure } from 'vee-validate';

/**
 * VeeValidateグローバル設定
 */

/**
 * ルールパラメータのうち表示できる値(文字列・数値)のみ文字列化する
 */
function paramText(value: unknown, fallback: string): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

// VeeValidateの設定
export function setupVeeValidate() {
  configure({
    // バリデーションのタイミング設定
    validateOnBlur: true, // フォーカスアウト時にバリデーション
    validateOnChange: true, // 値変更時にバリデーション
    validateOnInput: false, // 入力中はバリデーションしない
    validateOnModelUpdate: true, // v-model更新時にバリデーション

    // エラーメッセージの生成
    generateMessage: (context) => {
      // params は配列形式の場合もあるため、オブジェクト形式のみ参照する
      const rawParams = context.rule?.params;
      const params: Record<string, unknown> =
        rawParams !== undefined && !Array.isArray(rawParams) ? rawParams : {};

      // カスタムメッセージがある場合はそれを使用
      if (typeof params.message === 'string' && params.message !== '') {
        return params.message;
      }

      // フィールド名を日本語に変換
      const fieldNames: Record<string, string> = {
        email: 'メールアドレス',
        password: 'パスワード',
        passwordConfirm: 'パスワード（確認）',
        name: 'ユーザー名',
        displayName: '表示名',
        bio: '自己紹介',
        phone: '電話番号',
        zipcode: '郵便番号',
        website: 'ウェブサイト'
      };

      const fieldName = fieldNames[context.field] ?? context.field;

      // ルール別のメッセージ
      const messages: Record<string, string> = {
        required: `${fieldName}は必須項目です`,
        email: '正しいメールアドレス形式で入力してください',
        min: `${fieldName}は${paramText(params.min, '0')}文字以上で入力してください`,
        max: `${fieldName}は${paramText(params.max, '0')}文字以内で入力してください`,
        confirmed: `${fieldName}が一致しません`,
        url: '正しいURL形式で入力してください',
        numeric: '数値を入力してください',
        integer: '整数を入力してください'
      };

      return messages[context.rule?.name ?? ''] ?? `${fieldName}の入力値が正しくありません`;
    }
  });
}
