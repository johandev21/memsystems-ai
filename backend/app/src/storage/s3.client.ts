import {
  isLocalStorageEnabled,
  localDelete as fsDelete,
  localGetBuffer as fsGet,
  localPresign as fsPresign,
  localPut as fsPut,
} from "./local-fs";
import {
  s3Delete,
  s3GetBuffer,
  s3Presign,
  s3Put,
} from "./s3-backend";

export interface UploadInput {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
}

export async function putObject(input: UploadInput): Promise<void> {
  if (isLocalStorageEnabled()) {
    await fsPut(input.key, input.body, input.contentType);
    return;
  }
  await s3Put(input.key, input.body, input.contentType);
}

export async function deleteObject(key: string): Promise<void> {
  if (isLocalStorageEnabled()) {
    await fsDelete(key);
    return;
  }
  await s3Delete(key);
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  if (isLocalStorageEnabled()) {
    return fsGet(key);
  }
  return s3GetBuffer(key);
}

export async function presignDownload(
  key: string,
  expiresInSeconds = 300,
  downloadFilename?: string,
): Promise<string> {
  if (isLocalStorageEnabled()) {
    return fsPresign(key, expiresInSeconds, downloadFilename);
  }
  return s3Presign(key, expiresInSeconds, downloadFilename);
}
