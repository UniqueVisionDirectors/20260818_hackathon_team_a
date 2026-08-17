import { describe, it, expect } from 'vitest';
import { UploadUrlRequestSchema } from './images.js';

describe('Image Schemas', () => {
  describe('UploadUrlRequestSchema', () => {
    it('should validate correct request', () => {
      const validData = {
        filename: 'test.jpg',
        content_type: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };

      const result = UploadUrlRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid content type', () => {
      const invalidData = {
        filename: 'test.exe',
        content_type: 'application/x-msdownload',
        size: 1024
      };

      const result = UploadUrlRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject oversized file', () => {
      const invalidData = {
        filename: 'test.jpg',
        content_type: 'image/jpeg',
        size: 11 * 1024 * 1024 // 11MB
      };

      const result = UploadUrlRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty filename', () => {
      const invalidData = {
        filename: '',
        content_type: 'image/jpeg',
        size: 1024
      };

      const result = UploadUrlRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
