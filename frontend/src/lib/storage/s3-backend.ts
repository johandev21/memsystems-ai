import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let cachedS3: S3Client | null = null;
let cachedBucket: string | null = null;

function readS3Config() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  const missing: string[] = [];
  if (!endpoint) missing.push("S3_ENDPOINT");
  if (!region) missing.push("S3_REGION");
  if (!bucket) missing.push("S3_BUCKET");
  if (!accessKeyId) missing.push("S3_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("S3_SECRET_ACCESS_KEY");
  if (missing.length > 0) {
    throw new Error(
      `S3 storage is not configured. Missing env vars: ${missing.join(", ")}`,
    );
  }

  return {
    endpoint: endpoint as string,
    region: region as string,
    bucket: bucket as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  };
}

function getS3(): { client: S3Client; bucket: string } {
  if (cachedS3 && cachedBucket) {
    return { client: cachedS3, bucket: cachedBucket };
  }
  const cfg = readS3Config();
  cachedS3 = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: cfg.forcePathStyle,
  });
  cachedBucket = cfg.bucket;
  return { client: cachedS3, bucket: cachedBucket };
}

export async function s3Put(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  const { client, bucket } = getS3();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function s3Delete(key: string): Promise<void> {
  const { client, bucket } = getS3();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function s3GetBuffer(key: string): Promise<Buffer> {
  const { client, bucket } = getS3();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!response.Body) throw new Error(`S3 object not found: ${key}`);
  return Buffer.from(await response.Body.transformToByteArray());
}

export async function s3Presign(
  key: string,
  expiresInSeconds: number,
  downloadFilename?: string,
): Promise<string> {
  const { client, bucket } = getS3();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ...(downloadFilename
      ? {
          ResponseContentDisposition: `attachment; filename="${downloadFilename.replace(/"/g, "")}"`,
        }
      : {}),
  });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
