# AWS S3 Integration Setup

Complete guide for integrating AWS S3 storage with Supabase.

## Overview

Use AWS S3 as an alternative or backup to Supabase Storage:
- Unlimited scalability
- Global CDN with CloudFront
- Advanced lifecycle policies
- Cost-effective for large files
- Enterprise features

## Prerequisites

- AWS account
- S3 bucket created
- IAM user with S3 permissions
- Supabase project

## Installation

```bash
npm install aws-sdk
# or use AWS SDK v3 (recommended)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Environment Variables

```env
# Server-side only (Supabase Edge Functions)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Architecture

```
Mobile App
    ↓
Supabase Edge Function (get presigned URL)
    ↓
S3 Bucket (upload directly)
    ↓
CloudFront CDN (serve files)
```

## Edge Function for Presigned URLs

```typescript
// supabase/functions/s3-upload/index.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: Deno.env.get('AWS_REGION'),
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});

Deno.serve(async (req) => {
  const { fileName, fileType, userId } = await req.json();

  const key = `uploads/${userId}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: Deno.env.get('AWS_S3_BUCKET'),
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return new Response(
    JSON.stringify({ uploadUrl, key }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

## Client Usage

```typescript
// Upload file to S3
async function uploadToS3(file: File) {
  // 1. Get presigned URL
  const { data } = await supabase.functions.invoke('s3-upload', {
    body: {
      fileName: file.name,
      fileType: file.type,
      userId: user.id,
    },
  });

  // 2. Upload directly to S3
  await fetch(data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  return data.key;
}
```

## Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
