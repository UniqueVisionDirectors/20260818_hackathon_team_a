import { describe, expect, it, vi } from 'vitest'

const minioMocks = vi.hoisted(() => ({
  presignedPutObject: vi.fn(
    (_bucket: string, fileKey: string) => Promise.resolve(`http://localhost:9000/item-images/${fileKey}`),
  ),
  statObject: vi.fn(() => Promise.reject(new Error('Not found'))),
}))

vi.mock('minio', () => ({
  Client: class {
    presignedPutObject = minioMocks.presignedPutObject
    statObject = minioMocks.statObject
  },
}))

import { generateUploadUrl, getFileMetadata } from './minio.js'

describe('MinIO Utils', () => {
  describe('Content-Type Validation', () => {
    it('should accept valid content types', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

      for (const type of validTypes) {
        const result = await generateUploadUrl(`test.${type.split('/')[1] ?? ''}`, type)
        expect(result).toHaveProperty('uploadUrl')
        expect(result).toHaveProperty('fileKey')
      }
    })

    it('should reject invalid content types', async () => {
      const invalidTypes = [
        'application/x-msdownload',
        'text/javascript',
        'application/pdf',
        'video/mp4',
      ]

      for (const type of invalidTypes) {
        await expect(generateUploadUrl('test.file', type)).rejects.toThrow(
          'Invalid content type',
        )
      }
    })
  })

  describe('File Metadata', () => {
    it('should return exists: false for non-existent file', async () => {
      const metadata = await getFileMetadata('non-existent-file.jpg')
      expect(metadata.exists).toBe(false)
      expect(metadata.size).toBeUndefined()
      expect(metadata.contentType).toBeUndefined()
    })
  })

  describe('Filename Sanitization', () => {
    it('should generate traversal-free object keys', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
      ]

      for (const filename of maliciousFilenames) {
        const result = await generateUploadUrl(filename, 'image/jpeg')
        expect(result.fileKey).not.toContain('/')
        expect(result.fileKey).not.toContain('\\')
        expect(result.fileKey).not.toContain('..')
      }
    })
  })
})
