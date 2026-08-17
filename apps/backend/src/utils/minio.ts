import { Client } from 'minio';
import { randomUUID } from 'crypto';

// ⭐ 許可するContent-Typeのホワイトリスト
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const;

type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const CONTENT_TYPE_EXTENSIONS: Record<AllowedContentType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// ⭐ MinIOクライアント初期化（バックエンド操作用）
// Docker内部からMinIOサービスにアクセスするためのクライアント
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'minio',
  port: parseInt(process.env.MINIO_PORT ?? '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin123',
});

// ⭐ presigned URL生成専用クライアント（外部アクセス用）
// 重要: 署名にホスト名が含まれるため、最初から外部エンドポイントで署名を生成
// これによりconvertToExternalUrlでのホスト名変換による署名無効化を回避
const minioClientForPresignedUrls = new Client({
  endPoint: process.env.MINIO_EXTERNAL_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_EXTERNAL_PORT ?? process.env.MINIO_PORT ?? '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET ?? 'item-images';
const UPLOAD_URL_EXPIRY = parseInt(process.env.MINIO_UPLOAD_URL_EXPIRY ?? '600');
const DOWNLOAD_URL_EXPIRY = 60 * 60; // 1時間

/**
 * バケットの存在確認と作成
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
    }
  } catch (error) {
    console.error('❌ Failed to ensure bucket exists:', error);
    throw error;
  }
}

/**
 * ⭐ アップロード用署名付きURL生成（バリデーション強化）
 */
export async function generateUploadUrl(
  _filename: string,
  contentType: string
): Promise<{ uploadUrl: string; fileKey: string }> {
  // ⭐ Content-Typeバリデーション
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  // 元ファイル名をobject keyへ含めず、検証済みMIME typeから拡張子を決定する
  const extension = CONTENT_TYPE_EXTENSIONS[contentType as AllowedContentType];
  const fileKey = `${randomUUID()}${extension}`;

  try {
    // ⭐ presigned URL生成（外部エンドポイントで直接署名）
    // 重要事項:
    // 1. minioClientForPresignedUrlsを使用（endPoint='localhost'）
    // 2. Content-Typeヘッダーを署名に含めない（ブラウザのfetch()が自動付与するため）
    // 3. 最初から外部アクセス可能なURLで署名→変換不要
    const uploadUrl = await minioClientForPresignedUrls.presignedPutObject(
      BUCKET_NAME,
      fileKey,
      UPLOAD_URL_EXPIRY
    );

    return { uploadUrl, fileKey };
  } catch (error) {
    console.error('❌ Failed to generate upload URL:', error);
    throw error;
  }
}

/**
 * ダウンロード用署名付きURL生成
 */
export async function generateDownloadUrl(fileKey: string): Promise<string> {
  try {
    // ⭐ 外部エンドポイント用クライアントで直接署名生成
    const downloadUrl = await minioClientForPresignedUrls.presignedGetObject(
      BUCKET_NAME,
      fileKey,
      DOWNLOAD_URL_EXPIRY
    );

    return downloadUrl;
  } catch (error) {
    console.error('❌ Failed to generate download URL:', error);
    throw error;
  }
}

/**
 * ファイル削除
 */
export async function deleteFile(fileKey: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, fileKey);
  } catch (error) {
    console.error('❌ Failed to delete file:', error);
    throw error;
  }
}

/**
 * ⭐ ファイル存在確認とメタデータ取得
 */
export async function getFileMetadata(fileKey: string): Promise<{
  exists: boolean;
  size?: number;
  contentType?: string;
}> {
  try {
    const stat = await minioClient.statObject(BUCKET_NAME, fileKey);
    const contentType: unknown = stat.metaData['content-type'];
    return {
      exists: true,
      size: stat.size,
      contentType: typeof contentType === 'string' ? contentType : undefined,
    };
  } catch {
    return { exists: false };
  }
}
