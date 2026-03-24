const workspaceUploadQueue = new Map<string, Promise<void>>();

export async function runSerializedPublerUpload<T>(
  workspaceId: string,
  operation: () => Promise<T>,
) {
  const key = workspaceId.trim() || "default";
  const previous = workspaceUploadQueue.get(key) ?? Promise.resolve();

  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queueTail = previous.then(() => current);
  workspaceUploadQueue.set(key, queueTail);

  await previous;

  try {
    return await operation();
  } finally {
    release();
    if (workspaceUploadQueue.get(key) === queueTail) {
      workspaceUploadQueue.delete(key);
    }
  }
}
