import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Image } from '@/types';
import * as imagesService from '@/services/images.service';
import { ApiError, toErrorMessage } from '@/services/api';
import { useAuthStore } from './auth.store';

/**
 * 画像管理ストア
 * 画像データのCRUD操作と状態管理
 */
export const useImagesStore = defineStore('images', () => {
  // Auth store for error handling
  const authStore = useAuthStore();

  // State
  const images = ref<Image[]>([]);
  const selectedImage = ref<Image | null>(null);
  const isInitialized = ref<boolean>(false);

  const loading = ref<boolean>(false);
  const uploading = ref<boolean>(false);
  const uploadProgress = ref<number>(0);
  const error = ref<string | null>(null);

  // Getters
  /**
   * 全画像数
   */
  const totalImages = computed(() => images.value.length);

  /**
   * 画像を作成日時の降順でソート
   */
  const sortedImages = computed(() => {
    return [...images.value].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  // Actions
  /**
   * 画像をアップロード
   * @param file アップロードするファイル
   * @returns Promise<Image> アップロードされた画像
   */
  async function uploadImage(file: File): Promise<Image> {
    uploading.value = true;
    uploadProgress.value = 0;
    error.value = null;

    try {
      // バリデーション
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('サポートされていない画像形式です');
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('ファイルサイズは10MB以下にしてください');
      }

      uploadProgress.value = 30;

      // アップロードフロー実行
      const newImage = await imagesService.uploadImage(file);

      uploadProgress.value = 100;

      // ローカルステートを更新
      images.value.unshift(newImage);
      return newImage;
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = toErrorMessage(err, '画像のアップロードに失敗しました。');
      throw err;
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  }

  /**
   * 画像削除
   * @param id 画像ID
   */
  async function deleteImage(id: string): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // APIを使用して画像を削除
      await imagesService.deleteImage(id);

      // ローカルステートから削除
      const imageIndex = images.value.findIndex(image => image.id === id);
      if (imageIndex !== -1) {
        images.value.splice(imageIndex, 1);
      }

      // 選択中の画像が削除された場合はクリア
      if (selectedImage.value?.id === id) {
        selectedImage.value = null;
      }
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        throw err;
      }
      error.value = toErrorMessage(err, '画像の削除に失敗しました。');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 画像をIDで取得
   * @param id 画像ID
   * @returns Image | undefined
   */
  function getImageById(id: string): Image | undefined {
    return images.value.find(image => image.id === id);
  }

  /**
   * 選択中の画像を設定
   * @param image 画像オブジェクトまたはnull
   */
  function setSelectedImage(image: Image | null): void {
    selectedImage.value = image;
  }

  /**
   * 画像一覧を取得
   */
  async function fetchImages(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // APIから画像一覧を取得
      const fetchedImages = await imagesService.getImages();
      images.value = fetchedImages;
      isInitialized.value = true;
    } catch (err) {
      // 認証エラー時は認証ストアでナビゲーション処理
      if (err instanceof ApiError && err.status === 401) {
        authStore.handleAuthError();
        return;
      }
      error.value = toErrorMessage(err, '画像一覧の取得に失敗しました。');
    } finally {
      loading.value = false;
    }
  }

  /**
   * エラーのクリア
   */
  function clearError(): void {
    error.value = null;
  }

  // 初期データの取得
  if (!isInitialized.value) {
    // store 初期化時の fire-and-forget(エラーは error state 側で扱う)
    void fetchImages();
  }

  return {
    // State
    images,
    selectedImage,
    loading,
    uploading,
    uploadProgress,
    error,

    // Getters
    totalImages,
    sortedImages,

    // Actions
    fetchImages,
    uploadImage,
    deleteImage,
    getImageById,
    setSelectedImage,
    clearError
  };
});
