import type {
  RetrievedObject,
  StorageProvider,
  StoredObject,
  UploadPayload,
} from "@/lib/storage/StorageProvider";

function notImplemented(): never {
  throw new Error("R2StorageProvider is a stub. Wire Cloudflare R2 credentials before using it.");
}

export class R2StorageProvider implements StorageProvider {
  async upload(payload: UploadPayload): Promise<StoredObject> {
    void payload;
    return notImplemented();
  }

  async get(key: string): Promise<RetrievedObject> {
    void key;
    return notImplemented();
  }

  async delete(key: string): Promise<void> {
    void key;
    return notImplemented();
  }
}
