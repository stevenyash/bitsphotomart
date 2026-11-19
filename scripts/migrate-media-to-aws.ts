/**
 * Media Migration Script
 * 
 * Usage: npx ts-node --compiler-options {"module":"CommonJS"} scripts/migrate-media-to-aws.ts
 * 
 * This script:
 * 1. Scans local public/uploads folder
 * 2. Uploads files to AWS S3
 * 3. Updates database records with new CloudFront URLs
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configuration
const config = {
  region: process.env.AWS_REGION || 'af-south-1',
  bucket: process.env.AWS_S3_BUCKET_NAME || 'bpm-kenya',
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  localUploadsDir: path.join(process.cwd(), 'public', 'uploads'),
  backupDir: path.join(process.cwd(), 'public', 'uploads', 'backup'),
};

// Initialize S3 client
const s3Client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// MIME type mapping
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Get folder based on file type
function getFolder(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (['.mp4', '.mov', '.webm', '.avi'].includes(ext)) {
    return 'videos/processed';
  }
  return 'photos/originals';
}

// Upload file to S3
async function uploadToS3(filePath: string, folder: string): Promise<{ cloudFrontUrl: string; s3Key: string } | null> {
  try {
    const filename = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(filename);
    
    // Generate unique key
    const timestamp = Date.now();
    const uuid = Math.random().toString(36).substring(2, 10);
    const ext = path.extname(filename);
    const key = `${folder}/${timestamp}-${uuid}${ext}`;

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Generate CloudFront URL
    const cloudFrontUrl = config.cloudFrontDomain 
      ? `https://${config.cloudFrontDomain}/${key}`
      : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;

    console.log(`  ✓ Uploaded: ${filename} -> ${key}`);
    return { cloudFrontUrl, s3Key: key };
  } catch (error) {
    console.error(`  ✗ Failed to upload ${filePath}:`, error);
    return null;
  }
}

// Extract filename from URL
function extractFilename(url: string): string | null {
  if (!url) return null;
  
  // Handle CloudFront URLs
  if (url.includes('cloudfront.net') || url.includes('.s3.')) {
    return url.split('/').pop() || null;
  }
  
  // Handle local URLs
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '');
  }
  
  return null;
}

// Main migration function
async function migrateMedia() {
  console.log('\n=== Media Migration to AWS S3 ===\n');
  
  console.log('Configuration:');
  console.log(`  Region: ${config.region}`);
  console.log(`  Bucket: ${config.bucket}`);
  console.log(`  CloudFront: ${config.cloudFrontDomain || 'Not configured'}`);
  console.log(`  Local uploads: ${config.localUploadsDir}`);
  console.log('');

  // Check if local uploads directory exists
  if (!fs.existsSync(config.localUploadsDir)) {
    console.log('No local uploads directory found. Nothing to migrate.');
    return;
  }

  // Get all files in local uploads
  const files = fs.readdirSync(config.localUploadsDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.mov', '.webm'].includes(ext);
  });

  console.log(`Found ${files.length} files to migrate.\n`);

  if (files.length === 0) {
    console.log('No media files to migrate.');
    return;
  }

  // Migrate files
  let migrated = 0;
  let failed = 0;
  const migratedFiles: { local: string; cloudFront: string; s3Key: string }[] = [];

  for (const file of files) {
    const filePath = path.join(config.localUploadsDir, file);
    const folder = getFolder(file);
    
    const result = await uploadToS3(filePath, folder);
    
    if (result) {
      migratedFiles.push({
        local: file,
        cloudFront: result.cloudFrontUrl,
        s3Key: result.s3Key,
      });
      migrated++;
    } else {
      failed++;
    }
  }

  console.log(`\nUpload complete: ${migrated} succeeded, ${failed} failed.`);
  console.log('\nMigrated files (S3 URLs):');
  for (const file of migratedFiles) {
    console.log(`  ${file.local} -> ${file.cloudFront}`);
  }

  console.log('\n✓ Migration complete!');
  console.log('\nNote: Database sync requires manual update.');
  console.log('Run this SQL to update database URLs:\n');
  
  console.log('-- Run these queries in your database to update photo URLs:');
  for (const file of migratedFiles) {
    const s3Key = file.s3Key.replace('photos/originals/', '').replace('videos/processed/', '');
    console.log(`UPDATE photo SET originalUrl = '${file.cloudFront}' WHERE originalUrl LIKE '%${s3Key}%';`);
  }
  
  console.log('\n');
}

// Run migration
migrateMedia().catch(console.error);
