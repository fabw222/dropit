import { WALRUS_PUBLISHER_URL } from "../constants";

export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
    };
  };
  alreadyCertified?: {
    blobId: string;
  };
}

export async function uploadToWalrus(file: File, epochs = 5): Promise<string> {
  const response = await fetch(
    `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${epochs}`,
    {
      method: "PUT",
      body: file,
    }
  );

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.statusText}`);
  }

  const data: WalrusUploadResponse = await response.json();
  const blobId =
    data.newlyCreated?.blobObject.blobId || data.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error("No blob ID returned from Walrus");
  }

  return blobId;
}
