/**
 * Images Service
 * Handles all image-related API calls
 */
import { api, ApiError } from './api';
import type {
  ImageResponse,
  UploadUrlRequest,
  UploadUrlResponse,
  ConfirmUploadRequest,
} from '@/types/image.types';

/**
 * Get all images
 */
export async function getImages(): Promise<ImageResponse[]> {
  try {
    const images = await api<ImageResponse[]>('/images', {
      method: 'GET',
    });

    return images;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('画像一覧の取得に失敗しました');
  }
}

/**
 * Request upload URL (internal)
 */
async function requestUploadUrl(
  data: UploadUrlRequest
): Promise<UploadUrlResponse> {
  try {
    const response = await api<UploadUrlResponse>('/images/upload-url', {
      method: 'POST',
      body: data,
    });

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('アップロードURLの取得に失敗しました');
  }
}

/**
 * Upload file to MinIO using presigned URL (internal)
 */
async function uploadToMinio(
  uploadUrl: string,
  file: File
): Promise<void> {
  try {
    // ⭐ Blobでラップして Content-Type を削除
    // 理由:
    // 1. fetch() API は File オブジェクトを body に渡すと、自動的に Content-Type を設定する
    // 2. しかし MinIO の presignedPutObject は Content-Type を X-Amz-SignedHeaders に含めない
    // 3. 結果: 署名不一致エラー (SignatureDoesNotMatch)
    // 4. 解決策: type を指定せずに Blob でラップすることで、Content-Type を送信しない
    const blob = new Blob([file]);

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        // テキスト取得失敗時は無視
      }

      console.error('❌ Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        uploadUrlPath: uploadUrl.split('?')[0],
        fileSize: file.size,
        fileType: file.type,
      });

      // ステータスコードに応じたエラーメッセージ
      if (response.status === 403) {
        throw new Error('アップロード権限がありません。URLの有効期限が切れた可能性があります。');
      } else if (response.status === 413) {
        throw new Error('ファイルサイズが大きすぎます。');
      } else {
        throw new Error(`アップロードに失敗しました: ${response.statusText}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(`ファイルのアップロードに失敗しました: ${error.message}`);
    }
    throw new ApiError('ファイルのアップロードに失敗しました');
  }
}

/**
 * Confirm upload and save metadata (internal)
 */
async function confirmUpload(
  data: ConfirmUploadRequest
): Promise<ImageResponse> {
  try {
    const image = await api<ImageResponse>('/images/confirm', {
      method: 'POST',
      body: data,
    });

    return image;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('画像メタデータの保存に失敗しました');
  }
}

/**
 * Delete image
 */
export async function deleteImage(id: string): Promise<void> {
  try {
    await api(`/images/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('画像の削除に失敗しました');
  }
}

/**
 * Complete upload flow: request URL, upload to MinIO, confirm
 */
export async function uploadImage(file: File): Promise<ImageResponse> {
  try {
    // Step 1: Request upload URL
    const { upload_url, file_key } = await requestUploadUrl({
      filename: file.name,
      content_type: file.type,
      size: file.size,
    });

    // Step 2: Upload to MinIO
    await uploadToMinio(upload_url, file);

    // Step 3: Confirm upload and save metadata
    const image = await confirmUpload({
      file_key,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
    });

    return image;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('画像のアップロードに失敗しました');
  }
}
