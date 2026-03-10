export type UploadPayload = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
};

export type StoredObject = {
  key: string;
  absolutePath?: string;
  contentType?: string;
  publicUrl?: string;
};

export type RetrievedObject = StoredObject & {
  body: Buffer;
};

export interface StorageProvider {
  upload(payload: UploadPayload): Promise<StoredObject>;
  get(key: string): Promise<RetrievedObject>;
  delete(key: string): Promise<void>;
}
