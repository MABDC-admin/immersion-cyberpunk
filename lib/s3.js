import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    region: process.env.MINIO_REGION || "us-east-1",
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET;

/**
 * Uploads a file to MinIO
 * @param {Buffer | ReadableStream} file - File content
 * @param {string} key - S3 object key (filename/path)
 * @param {string} contentType - File mime type
 */
export async function uploadToS3(file, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    });

    await s3Client.send(command);
    return key;
}

/**
 * Generates a signed URL for temporary file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - Expiry in seconds (default 3600)
 */
export async function getSignedS3Url(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes an object from S3
 * @param {string} key - S3 object key
 */
export async function deleteFromS3(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await s3Client.send(command);
}

export default s3Client;
