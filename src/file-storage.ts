// File storage utilities for Cloudflare R2 and PDF text extraction
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 client configuration
export function getR2Client(env: any) {
  console.log('getR2Client called with env keys:', Object.keys(env || {}));
  console.log('CF_ACCOUNT_ID:', env?.CF_ACCOUNT_ID);
  console.log('R2_ACCESS_KEY_ID:', env?.R2_ACCESS_KEY_ID ? '***' : 'undefined');
  console.log('R2_SECRET_ACCESS_KEY:', env?.R2_SECRET_ACCESS_KEY ? '***' : 'undefined');

  // Use Wrangler's R2 bucket binding if available (preferred method)
  if (env?.FILES_BUCKET) {
    console.log('Using Wrangler R2 bucket binding');
    return env.FILES_BUCKET;
  }

  // Fallback to manual S3 client configuration
  if (!env?.CF_ACCOUNT_ID || !env?.R2_ACCESS_KEY_ID || !env?.R2_SECRET_ACCESS_KEY) {
    console.warn('R2 not configured - missing required environment variables');
    console.warn('Available env keys:', Object.keys(env || {}));
    return null;
  }

  console.log('Creating S3 client for R2...');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// Upload file to R2
export async function uploadFileToR2(
  env: any,
  file: File,
  fileName: string,
  contentType?: string
): Promise<{ key: string; url: string; size: number }> {
  const client = getR2Client(env);

  // Generate unique key
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const key = `uploads/${timestamp}-${randomId}-${fileName}`;

  // If R2 is not configured, return a placeholder URL for development
  if (!client) {
    console.warn('R2 not configured - using development fallback URL');
    const url = `/api/files/${key}`; // Local development URL

    return {
      key,
      url,
      size: file.size,
    };
  }

  // Check if using Wrangler R2 binding (different API)
  if (env?.FILES_BUCKET && typeof client.put === 'function') {
    // Using Wrangler R2 binding
    console.log('Uploading via Wrangler R2 binding');
    await env.FILES_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: contentType || file.type,
      },
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      },
    });

    // Use the public bucket URL from environment or fallback
    const publicBucketUrl = env?.R2_PUBLIC_BUCKET_URL || `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url = `${publicBucketUrl}/${key}`;

    console.log('Generated R2 URL:', url);

    return {
      key,
      url,
      size: file.size,
    };
  }

  // Using manual S3 client
  const bucketName = env.FILES_BUCKET_NAME || 'faith-defenders-files';
  console.log('Attempting to upload to bucket:', bucketName);
  console.log('Upload key:', key);
  console.log('File size:', file.size);
  console.log('Content type:', contentType || file.type);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: new Uint8Array(await file.arrayBuffer()),
    ContentType: contentType || file.type,
    Metadata: {
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
      size: file.size.toString(),
    },
  });

  console.log('Sending PutObjectCommand...');
  await client.send(command);
  console.log('Upload successful!');

  // Generate public URL using the configured public bucket URL
  const publicBucketUrl = env?.R2_PUBLIC_BUCKET_URL || `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${publicBucketUrl}/${key}`;

  return {
    key,
    url,
    size: file.size,
  };
}

// Delete file from R2
export async function deleteFileFromR2(env: any, key: string): Promise<boolean> {
  const client = getR2Client(env);

  if (!client) {
    console.warn('R2 client not available - cannot delete file');
    return false;
  }

  try {
    // Check if using Wrangler R2 binding
    if (env?.FILES_BUCKET && typeof client.delete === 'function') {
      // Using Wrangler R2 binding
      console.log('Deleting file via Wrangler R2 binding:', key);
      await env.FILES_BUCKET.delete(key);
      console.log('File deleted successfully from R2:', key);
      return true;
    }

    // Using manual S3 client
    const bucketName = env.FILES_BUCKET_NAME || 'faith-defenders-files';
    console.log('Deleting file from bucket:', bucketName, 'key:', key);
    
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await client.send(command);
    console.log('File deleted successfully from R2:', key);
    return true;
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return false;
  }
}

// Get file from R2
export async function getFileFromR2(env: any, key: string): Promise<ReadableStream | null> {
  const client = getR2Client(env);

  if (!client) {
    console.warn('R2 client not available');
    return null;
  }

  try {
    // Check if using Wrangler R2 binding
    if (env?.FILES_BUCKET && typeof client.get === 'function') {
      // Using Wrangler R2 binding
      console.log('Getting file via Wrangler R2 binding');
      const object = await env.FILES_BUCKET.get(key);
      return object?.body || null;
    }

    // Using manual S3 client
    const command = new GetObjectCommand({
      Bucket: env.FILES_BUCKET.name,
      Key: key,
    });

    const response = await client.send(command);
    return response.Body as ReadableStream;
  } catch (error) {
    console.error('Error getting file from R2:', error);
    return null;
  }
}


// Generate file metadata
export function generateFileMetadata(file: File, extractedText?: string) {
  return {
    fileType: file.type,
    size: file.size,
    lastModified: file.lastModified,
    extractedTextLength: extractedText?.length || 0,
    uploadedAt: new Date().toISOString(),
  };
}

// Validate file type and size
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxSize = 100 * 1024 * 1024; // 100MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload PDF, audio, video, image, or document files.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 100MB.'
    };
  }

  return { valid: true };
}