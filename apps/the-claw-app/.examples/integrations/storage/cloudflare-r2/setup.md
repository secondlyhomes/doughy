# Cloudflare R2 Integration Setup

Complete guide for integrating Cloudflare R2 storage.

## Overview

Cloudflare R2 provides:
- S3-compatible object storage
- Zero egress fees
- Global distribution
- Cost-effective storage

## Prerequisites

- Cloudflare account
- R2 bucket created
- API token with R2 permissions

## Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Environment Variables

```bash
# Server-side only (Edge Functions)
supabase secrets set R2_ACCOUNT_ID=your_account_id
supabase secrets set R2_ACCESS_KEY_ID=your_access_key
supabase secrets set R2_SECRET_ACCESS_KEY=your_secret_key
supabase secrets set R2_BUCKET_NAME=your_bucket
```

## Edge Function

```typescript
// supabase/functions/r2-upload/index.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
});

Deno.serve(async (req) => {
  const { fileName, fileType } = await req.json();

  const command = new PutObjectCommand({
    Bucket: Deno.env.get('R2_BUCKET_NAME'),
    Key: fileName,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

  return new Response(JSON.stringify({ uploadUrl }));
});
```

## Client Usage

```typescript
// Get presigned URL and upload
const { data } = await supabase.functions.invoke('r2-upload', {
  body: {
    fileName: file.name,
    fileType: file.type,
  },
});

await fetch(data.uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
```

## Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [S3 Compatibility](https://developers.cloudflare.com/r2/api/s3/api)
