import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env, isR2Configured } from "@/lib/env";
import type {
  RetrievedObject,
  StorageProvider,
  StoredObject,
  UploadPayload,
} from "@/lib/storage/StorageProvider";

export class R2StorageProvider implements StorageProvider {
  private readonly bucketName: string;
  private readonly client: S3Client;

  constructor() {
    if (!isR2Configured()) {
      throw new Error(
        "R2 storage is not configured. Set R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and either R2_ENDPOINT or R2_ACCOUNT_ID.",
      );
    }

    this.bucketName = env.r2BucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: this.resolveEndpoint(),
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    });
  }

  async upload(payload: UploadPayload): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: payload.key,
        Body: payload.body,
        CacheControl: payload.key.startsWith("temp/")
          ? "no-store, max-age=0"
          : "public, max-age=31536000, immutable",
        ContentType: payload.contentType,
      }),
    );

    return {
      key: payload.key,
      contentType: payload.contentType,
      publicUrl: this.buildPublicUrl(payload.key),
    };
  }

  async get(key: string): Promise<RetrievedObject> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    const bytes = await response.Body?.transformToByteArray();

    if (!bytes) {
      throw new Error(`R2 object not found: ${key}`);
    }

    return {
      key,
      contentType: response.ContentType,
      publicUrl: this.buildPublicUrl(key),
      body: Buffer.from(bytes),
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  private resolveEndpoint() {
    if (env.r2Endpoint.trim()) {
      return env.r2Endpoint.trim();
    }

    return `https://${env.r2AccountId}.r2.cloudflarestorage.com`;
  }

  private buildPublicUrl(key: string) {
    const publicBaseUrl = env.r2PublicBaseUrl.trim();
    if (!publicBaseUrl) {
      return undefined;
    }

    return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }
}
