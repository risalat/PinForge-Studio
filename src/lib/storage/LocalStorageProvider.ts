import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import type {
  RetrievedObject,
  StorageProvider,
  StoredObject,
  UploadPayload,
} from "@/lib/storage/StorageProvider";

export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor(basePath = env.localStoragePath) {
    this.basePath = path.resolve(basePath);
  }

  async upload(payload: UploadPayload): Promise<StoredObject> {
    const absolutePath = this.resolvePath(payload.key);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, payload.body);

    return {
      key: payload.key,
      absolutePath,
      contentType: payload.contentType,
    };
  }

  async get(key: string): Promise<RetrievedObject> {
    const absolutePath = this.resolvePath(key);
    const body = await readFile(absolutePath);

    return {
      key,
      absolutePath,
      body,
    };
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolvePath(key);
    await rm(absolutePath, { force: true });
  }

  private resolvePath(key: string) {
    return path.join(this.basePath, key);
  }
}
