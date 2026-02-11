import { useState, useCallback, useRef } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { uploadToWalrus } from "../lib/walrus";
import { PACKAGE_ID } from "../constants";
import {
  useWalrusStorageCost,
  formatWal,
} from "../hooks/useWalrusStorageCost";

export default function Home() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { totalCost, walBalance, isLoading: costLoading, error: costError, hasSufficientBalance } =
    useWalrusStorageCost(file?.size ?? null, account?.address ?? null);

  const handleFile = (f: File) => {
    setFile(f);
    setShareLink("");
    setError("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !account) return;

    setUploading(true);
    setError("");
    setShareLink("");

    try {
      setProgress("Uploading video to Walrus...");
      const blobId = await uploadToWalrus(file);

      setProgress("Storing metadata on Sui...");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::video::create_video`,
        arguments: [
          tx.pure.string(title || file.name),
          tx.pure.string(blobId),
          tx.object("0x6"),
        ],
      });

      await signAndExecute({ transaction: tx });

      const link = `${window.location.origin}/watch/${blobId}`;
      setShareLink(link);
      setProgress("");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setProgress("");
    } finally {
      setUploading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  return (
    <div className="home-page">
      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <p>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
        ) : (
          <p>Drag & drop a video here, or click to select</p>
        )}
      </div>

      {file && (
        <div className="upload-form">
          <input
            type="text"
            placeholder="Video title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />

          <div className="cost-info">
              {costLoading ? (
                <p className="cost-loading">Estimating storage cost...</p>
              ) : costError ? (
                <p className="cost-warning">Could not estimate cost</p>
              ) : totalCost != null ? (
                <>
                  <div className="cost-row">
                    <span className="cost-label">Estimated cost</span>
                    <span className="cost-value">{formatWal(totalCost)} WAL</span>
                  </div>
                  {account && walBalance != null && (
                    <>
                      <div className="cost-row">
                        <span className="cost-label">Your balance</span>
                        <span className={`cost-value${hasSufficientBalance === false ? " insufficient" : ""}`}>
                          {formatWal(walBalance)} WAL
                        </span>
                      </div>
                      {hasSufficientBalance === false && (
                        <p className="cost-error">
                          Insufficient WAL balance. You need {formatWal(totalCost - walBalance)} more WAL.
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : null}
          </div>

          {!account ? (
            <p className="hint">Connect your wallet to upload</p>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploading || hasSufficientBalance === false}
              className="upload-btn"
            >
              {uploading ? "Uploading..." : "Upload to Walrus"}
            </button>
          )}
        </div>
      )}

      {progress && <p className="progress">{progress}</p>}
      {error && <p className="error">{error}</p>}

      {shareLink && (
        <div className="share-box">
          <p>Video uploaded! Share this link:</p>
          <div className="share-link">
            <input type="text" readOnly value={shareLink} />
            <button onClick={copyLink}>Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}
