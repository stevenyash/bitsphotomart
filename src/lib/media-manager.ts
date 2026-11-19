/**
 * MediaManager - AWS S3 + CloudFront Media Management Class
 * 
 * Handles:
 * - Upload to AWS S3
 * - CloudFront CDN delivery
 * - Database synchronization
 * - Image processing with Sharp
 * - Signed URLs for private content
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Type definitions
export type MediaType = 'avatar' | 'cover' | 'gallery' | 'photo' | 'video' | 'document' | 'blog' | 'service';
export type MediaFolder = 
  | 'users/avatars'
  | 'users/covers'
  | 'users/galleries'
  | 'photos/originals'
  | 'photos/processed'
  | 'photos/thumbnails'
  | 'photos/watermarked'
  | 'videos/raw'
  | 'videos/processed'
  | 'videos/thumbnails'
  | 'documents/orders'
  | 'documents/invoices'
  | 'documents/contracts'
  | 'blog'
  | 'services/portfolios'
  | 'services/samples';

export interface MediaMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // For videos
}

export interface UploadResult {
  success: boolean;
  key: string;
  url: string;
  cloudFrontUrl: string;
  metadata: MediaMetadata;
  error?: string;
}

export interface MediaRecord {
  id: string;
  key: string;
  url: string;
  cloudFrontUrl: string;
  type: MediaType;
  folder: MediaFolder;
  userId?: string;
  metadata: MediaMetadata;
  createdAt: Date;
}

// Configuration from environment
const config = {
  region: process.env.AWS_REGION || 'af-south-1',
  bucket: process.env.AWS_S3_BUCKET_NAME || 'bpm-kenya',
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  cloudFrontDistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
  signedUrlExpiry: parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY || '3600', 10),
  publicUrlExpiry: parseInt(process.env.AWS_S3_PUBLIC_URL_EXPIRY || '604800', 10), // 7 days
  maxFileSize: parseInt(process.env.AWS_S3_MAX_FILE_SIZE || '104857600', 10), // 100MB
};

// Allowed file types by category
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'],
  document: ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'],
};

class MediaManager {
  private s3Client: S3Client;
  private bucket: string;
  private cloudFrontDomain: string | undefined;

  constructor() {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucket = config.bucket;
    this.cloudFrontDomain = config.cloudFrontDomain;
  }

  /**
   * Get folder path for a media type
   */
  getFolder(type: MediaType, subType?: string): MediaFolder {
    const folderMap: Record<MediaType, MediaFolder> = {
      avatar: 'users/avatars',
      cover: 'users/covers',
      gallery: 'users/galleries',
      photo: 'photos/originals',
      video: 'videos/raw',
      document: 'documents/orders',
      blog: 'blog',
      service: 'services/portfolios',
    };
    return folderMap[type] || 'photos/originals';
  }

  /**
   * Validate file type
   */
  validateFileType(mimeType: string, category: keyof typeof ALLOWED_TYPES): boolean {
    return ALLOWED_TYPES[category]?.includes(mimeType) || false;
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): boolean {
    return size <= config.maxFileSize;
  }

  /**
   * Generate unique key for S3
   */
  private generateKey(folder: MediaFolder, originalName: string): string {
    const ext = originalName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8);
    return `${folder}/${timestamp}-${uuid}.${ext}`;
  }

  /**
   * Get CloudFront URL from S3 key
   */
  getCloudFrontUrl(key: string): string {
    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${key}`;
    }
    // Fallback to S3 URL if CloudFront not configured
    return `https://${this.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  /**
   * Generate S3 URL
   */
  getS3Url(key: string): string {
    return `https://${this.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  /**
   * Upload file to S3
   */
  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: MediaFolder,
    options?: {
      generateThumbnail?: boolean;
      addWatermark?: boolean;
      userId?: string;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file type
      const category = mimeType.startsWith('image/') ? 'image' 
        : mimeType.startsWith('video/') ? 'video' 
        : 'document';
      
      if (!this.validateFileType(mimeType, category)) {
        return {
          success: false,
          key: '',
          url: '',
          cloudFrontUrl: '',
          metadata: { originalName, mimeType, size: buffer.length },
          error: `Invalid file type: ${mimeType}`,
        };
      }

      // Validate file size
      if (!this.validateFileSize(buffer.length)) {
        return {
          success: false,
          key: '',
          url: '',
          cloudFrontUrl: '',
          metadata: { originalName, mimeType, size: buffer.length },
          error: `File too large. Max size: ${config.maxFileSize} bytes`,
        };
      }

      // Generate key
      const key = this.generateKey(folder, originalName);

      // Process image if needed
      let uploadBuffer = buffer;
      let width: number | undefined;
      let height: number | undefined;

      if (category === 'image' && (options?.generateThumbnail || options?.addWatermark)) {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        width = metadata.width;
        height = metadata.height;

        if (options.addWatermark && process.env.WATERMARK_ENABLED === 'true') {
          const watermarkText = process.env.WATERMARK_TEXT || 'BPM ©';
          
          // Create watermark as SVG with transparency
          const svgWatermark = `
            <svg width="${metadata.width || 800}" height="${metadata.height || 600}">
              <style>
                .watermark { fill: white; font-size: 48px; font-family: Arial; opacity: 0.7; }
              </style>
              <text x="20" y="${(metadata.height || 600) - 20}" class="watermark">${watermarkText}</text>
            </svg>
          `;

          uploadBuffer = await sharp(buffer)
            .composite([{
              input: Buffer.from(svgWatermark),
              top: (metadata.height || 600) - 60,
              left: 20,
            }])
            .toBuffer();
        }
      }

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: uploadBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-name': originalName,
          'user-id': options?.userId || 'system',
        },
      });

      await this.s3Client.send(command);

      // Get metadata
      const metadata: MediaMetadata = {
        originalName,
        mimeType,
        size: uploadBuffer.length,
        width,
        height,
      };

      return {
        success: true,
        key,
        url: this.getS3Url(key),
        cloudFrontUrl: this.getCloudFrontUrl(key),
        metadata,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        key: '',
        url: '',
        cloudFrontUrl: '',
        metadata: { originalName, mimeType, size: buffer.length },
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload thumbnail for an image
   */
  async uploadThumbnail(
    originalBuffer: Buffer,
    originalKey: string,
    options?: { width?: number; height?: number; quality?: number }
  ): Promise<UploadResult> {
    try {
      const width = options?.width || parseInt(process.env.THUMBNAIL_WIDTH || '300', 10);
      const height = options?.height || parseInt(process.env.THUMBNAIL_HEIGHT || '200', 10);
      const quality = options?.quality || parseInt(process.env.THUMBNAIL_QUALITY || '80', 10);

      // Generate thumbnail
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality })
        .toBuffer();

      // Generate new key for thumbnail
      const originalName = originalKey.split('/').pop() || 'thumbnail.jpg';
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      const folder = 'photos/thumbnails';
      const thumbnailKey = `${folder}/${nameWithoutExt}-thumbnail.jpg`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
      });

      await this.s3Client.send(command);

      return {
        success: true,
        key: thumbnailKey,
        url: this.getS3Url(thumbnailKey),
        cloudFrontUrl: this.getCloudFrontUrl(thumbnailKey),
        metadata: {
          originalName: `${nameWithoutExt}-thumbnail.jpg`,
          mimeType: 'image/jpeg',
          size: thumbnailBuffer.length,
          width,
          height,
        },
      };
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      return {
        success: false,
        key: '',
        url: '',
        cloudFrontUrl: '',
        metadata: { originalName: 'thumbnail.jpg', mimeType: 'image/jpeg', size: 0 },
        error: error instanceof Error ? error.message : 'Thumbnail upload failed',
      };
    }
  }

  /**
   * Delete file from S3
   */
  async delete(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  /**
   * Generate signed URL for private access
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn || config.signedUrlExpiry,
    });
  }

  /**
   * Check if file exists in S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(prefix: string, maxKeys = 100): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);
      return response.Contents?.map((obj) => obj.Key || '') || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  /**
   * List files in a folder with pagination support
   */
  async listFilesPaginated(
    prefix: string,
    maxKeys = 50,
    continuationToken?: string
  ): Promise<{ files: string[]; nextToken: string | null; totalCount: number }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);
      
      // Get total count if this is the first page
      let totalCount = 0;
      if (!continuationToken && response.IsTruncated) {
        // For accurate count, we'd need to iterate - approximate with maxKeys * 2
        totalCount = maxKeys * 2; // This is an approximation
      } else if (!response.IsTruncated) {
        totalCount = response.Contents?.length || 0;
      }

      return {
        files: response.Contents?.map((obj) => obj.Key || '') || [],
        nextToken: response.NextContinuationToken || null,
        totalCount,
      };
    } catch (error) {
      console.error('List files paginated error:', error);
      return { files: [], nextToken: null, totalCount: 0 };
    }
  }

  /**
   * Get total count of files in a folder
   */
  async getFileCount(prefix: string): Promise<number> {
    try {
      let totalCount = 0;
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        });

        const response = await this.s3Client.send(command);
        totalCount += response.Contents?.length || 0;
        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      return totalCount;
    } catch (error) {
      console.error('Get file count error:', error);
      return 0;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Metadata || {};
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const mediaManager = new MediaManager();

// Export class for custom configurations
export { MediaManager };
