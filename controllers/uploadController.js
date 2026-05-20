const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/s3');

async function uploadToS3(file) {
  const key = `notes/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ServerSideEncryption: 'AES256'
  }));

  const region = process.env.AWS_REGION || 'ap-southeast-1';
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
}

async function deleteFromS3(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract key from URL: https://bucket.s3.region.amazonaws.com/key
    const url = new URL(imageUrl);
    const key = url.pathname.slice(1); // remove leading /

    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    }));
  } catch (err) {
    // Log error but don't throw — non-blocking
    console.error('S3 delete error:', err.message);
  }
}

module.exports = { uploadToS3, deleteFromS3 };
