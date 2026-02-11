# DropIt Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Sui dApp SPA that uploads videos to Walrus and shares them via links, with on-chain metadata storage.

**Architecture:** React SPA (Vite) connects to Sui wallet via @mysten/dapp-kit. Videos upload to Walrus via HTTP publisher API. Video metadata (title, blob ID, timestamp) stored on-chain as owned Sui objects via a Move contract. Viewing is wallet-free via Walrus aggregator URL.

**Tech Stack:** React 18, Vite, TypeScript, @mysten/dapp-kit, @mysten/sui, React Router, Sui Move, Walrus HTTP API

---

### Task 1: Scaffold Sui Move Contract

**Files:**
- Create: `move/dropit/Move.toml`
- Create: `move/dropit/sources/video.move`

**Step 1: Create Move.toml**

```toml
[package]
name = "dropit"
version = "0.1.0"
edition = "2024"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
dropit = "0x0"
```

**Step 2: Write the video module**

```move
module dropit::video;

use std::string::String;
use sui::clock::Clock;

public struct Video has key, store {
    id: UID,
    title: String,
    blob_id: String,
    owner: address,
    created_at: u64,
}

public entry fun create_video(
    title: String,
    blob_id: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let video = Video {
        id: object::new(ctx),
        title,
        blob_id,
        owner: tx_context::sender(ctx),
        created_at: clock::timestamp_ms(clock),
    };
    transfer::transfer(video, tx_context::sender(ctx));
}

public entry fun delete_video(video: Video) {
    let Video { id, title: _, blob_id: _, owner: _, created_at: _ } = video;
    object::delete(id);
}
```

**Step 3: Build the contract**

Run: `cd move/dropit && sui move build`
Expected: Build successful

**Step 4: Commit**

```bash
git add move/
git commit -m "feat: add Sui Move video metadata contract"
```

---

### Task 2: Scaffold React Frontend

**Files:**
- Create: `web/` (Vite project)
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/index.css`

**Step 1: Create Vite React project**

Run:
```bash
cd /Users/admin/Desktop/sui/dropit
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query react-router-dom
```

**Step 2: Set up main.tsx with providers**

Replace `web/src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { BrowserRouter } from "react-router-dom";
import "@mysten/dapp-kit/dist/index.css";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Step 3: Set up App.tsx with routing**

Replace `web/src/App.tsx`:

```tsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import MyVideos from "./pages/MyVideos";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/watch/:blobId" element={<Watch />} />
      <Route path="/my" element={<MyVideos />} />
    </Routes>
  );
}
```

**Step 4: Create placeholder page components**

Create `web/src/pages/Home.tsx`:
```tsx
export default function Home() {
  return <div>Home</div>;
}
```

Create `web/src/pages/Watch.tsx`:
```tsx
export default function Watch() {
  return <div>Watch</div>;
}
```

Create `web/src/pages/MyVideos.tsx`:
```tsx
export default function MyVideos() {
  return <div>My Videos</div>;
}
```

**Step 5: Verify dev server runs**

Run: `cd web && npm run dev`
Expected: Vite dev server starts, pages render at `/`, `/watch/test`, `/my`

**Step 6: Commit**

```bash
git add web/
git commit -m "feat: scaffold React frontend with routing and Sui providers"
```

---

### Task 3: Create Shared Layout with Navbar

**Files:**
- Create: `web/src/components/Navbar.tsx`
- Modify: `web/src/App.tsx`
- Create: `web/src/constants.ts`

**Step 1: Create constants file**

```tsx
// web/src/constants.ts
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || "0x0";
export const WALRUS_PUBLISHER_URL =
  import.meta.env.VITE_WALRUS_PUBLISHER_URL ||
  "https://publisher.walrus-testnet.walrus.space";
export const WALRUS_AGGREGATOR_URL =
  import.meta.env.VITE_WALRUS_AGGREGATOR_URL ||
  "https://aggregator.walrus-testnet.walrus.space";
```

**Step 2: Create Navbar component**

```tsx
// web/src/components/Navbar.tsx
import { ConnectButton } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        DropIt
      </Link>
      <div className="navbar-links">
        <Link to="/my">My Videos</Link>
        <ConnectButton />
      </div>
    </nav>
  );
}
```

**Step 3: Update App.tsx to include Navbar**

```tsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import MyVideos from "./pages/MyVideos";

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:blobId" element={<Watch />} />
          <Route path="/my" element={<MyVideos />} />
        </Routes>
      </main>
    </div>
  );
}
```

**Step 4: Add base styles to index.css**

Replace `web/src/index.css` with layout styles: reset, navbar flex layout, main content centering, basic color scheme.

**Step 5: Verify navbar renders with wallet button**

Run: `cd web && npm run dev`
Expected: Navbar shows "DropIt" logo, "My Videos" link, and ConnectButton

**Step 6: Commit**

```bash
git add web/src/
git commit -m "feat: add navbar with wallet connect and routing"
```

---

### Task 4: Build Home Page — Upload UI

**Files:**
- Modify: `web/src/pages/Home.tsx`
- Create: `web/src/lib/walrus.ts`

**Step 1: Create Walrus upload helper**

```tsx
// web/src/lib/walrus.ts
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
```

**Step 2: Build Home page with drag-and-drop upload**

```tsx
// web/src/pages/Home.tsx
import { useState, useCallback, useRef } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { uploadToWalrus } from "../lib/walrus";
import { PACKAGE_ID } from "../constants";

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
      // Step 1: Upload to Walrus
      setProgress("Uploading video to Walrus...");
      const blobId = await uploadToWalrus(file);

      // Step 2: Store metadata on-chain
      setProgress("Storing metadata on Sui...");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::video::create_video`,
        arguments: [
          tx.pure.string(title || file.name),
          tx.pure.string(blobId),
          tx.object("0x6"), // Clock
        ],
      });

      await signAndExecute({ transaction: tx });

      // Step 3: Generate share link
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

          {!account ? (
            <p className="hint">Connect your wallet to upload</p>
          ) : (
            <button
              onClick={handleUpload}
              disabled={uploading}
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
```

**Step 3: Verify upload UI renders**

Run: `cd web && npm run dev`
Expected: Drop zone appears, file selection works, title input shows after selecting a file

**Step 4: Commit**

```bash
git add web/src/
git commit -m "feat: add home page with Walrus upload and on-chain metadata"
```

---

### Task 5: Build Watch Page

**Files:**
- Modify: `web/src/pages/Watch.tsx`

**Step 1: Implement the Watch page**

```tsx
// web/src/pages/Watch.tsx
import { useParams } from "react-router-dom";
import { WALRUS_AGGREGATOR_URL } from "../constants";

export default function Watch() {
  const { blobId } = useParams<{ blobId: string }>();

  if (!blobId) {
    return <div className="watch-page"><p>Invalid video link</p></div>;
  }

  const videoUrl = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

  return (
    <div className="watch-page">
      <div className="video-container">
        <video controls autoPlay className="video-player">
          <source src={videoUrl} />
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );
}
```

**Step 2: Verify watch page renders**

Run: `cd web && npm run dev`
Navigate to `/watch/some-blob-id` — should show video player (won't play without real blob ID but UI should render)

**Step 3: Commit**

```bash
git add web/src/pages/Watch.tsx
git commit -m "feat: add watch page with Walrus video playback"
```

---

### Task 6: Build My Videos Page

**Files:**
- Modify: `web/src/pages/MyVideos.tsx`

**Step 1: Implement My Videos page**

```tsx
// web/src/pages/MyVideos.tsx
import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Link } from "react-router-dom";
import { PACKAGE_ID } from "../constants";

interface VideoFields {
  title: string;
  blob_id: string;
  owner: string;
  created_at: string;
}

export default function MyVideos() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const { data, isPending, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: {
        StructType: `${PACKAGE_ID}::video::Video`,
      },
      options: { showContent: true },
    },
    { enabled: !!account?.address }
  );

  if (!account) {
    return (
      <div className="my-videos-page">
        <p>Connect your wallet to see your videos</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="my-videos-page">
        <p>Loading...</p>
      </div>
    );
  }

  const videos = data?.data || [];

  const handleDelete = async (objectId: string) => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::video::delete_video`,
        arguments: [tx.object(objectId)],
      });
      await signAndExecute({ transaction: tx });
      refetch();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="my-videos-page">
      <h2>My Videos</h2>
      {videos.length === 0 ? (
        <p>No videos yet. <Link to="/">Upload one!</Link></p>
      ) : (
        <div className="video-list">
          {videos.map((obj) => {
            const fields = (obj.data?.content as any)?.fields as VideoFields;
            const objectId = obj.data?.objectId || "";
            if (!fields) return null;

            const shareLink = `${window.location.origin}/watch/${fields.blob_id}`;
            const date = new Date(Number(fields.created_at)).toLocaleDateString();

            return (
              <div key={objectId} className="video-card">
                <div className="video-card-info">
                  <h3>{fields.title}</h3>
                  <p className="video-date">{date}</p>
                </div>
                <div className="video-card-actions">
                  <Link to={`/watch/${fields.blob_id}`} className="btn">
                    Watch
                  </Link>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                    }}
                    className="btn"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleDelete(objectId)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify My Videos page renders**

Run: `cd web && npm run dev`
Navigate to `/my` — should show "Connect your wallet" message or video list

**Step 3: Commit**

```bash
git add web/src/pages/MyVideos.tsx
git commit -m "feat: add my videos page with list, delete, and share"
```

---

### Task 7: Styling

**Files:**
- Modify: `web/src/index.css`

**Step 1: Write complete CSS**

Style all components: navbar, drop zone, upload form, video player, video cards, buttons. Keep it clean and modern — dark theme, rounded corners, subtle shadows.

Key styles needed:
- `.navbar` — fixed top, flex row, space-between
- `.drop-zone` — dashed border, hover/drag-over state, cursor pointer
- `.upload-form` — flex column, gap
- `.title-input` — full width input
- `.upload-btn` — primary action button
- `.share-box` — success state with link display
- `.video-player` — max-width 100%, aspect-ratio 16/9
- `.video-list` — flex column, gap
- `.video-card` — flex row, space-between, border, padding
- `.btn`, `.btn-danger` — button styles

**Step 2: Verify all pages look good**

Run: `cd web && npm run dev`
Check all three routes render with proper styling

**Step 3: Commit**

```bash
git add web/src/index.css
git commit -m "feat: add app styling"
```

---

### Task 8: Deploy Move Contract to Testnet

**Step 1: Deploy contract**

Run:
```bash
cd move/dropit
sui client publish --gas-budget 100000000
```
Expected: Contract published, get package ID from output

**Step 2: Update .env with package ID**

Create `web/.env`:
```
VITE_PACKAGE_ID=<published-package-id>
```

**Step 3: Test full flow**

1. Connect wallet on home page
2. Upload a small test video
3. Verify share link works
4. Check My Videos page shows the video
5. Test delete

**Step 4: Commit**

```bash
git add web/.env
git commit -m "feat: configure deployed contract package ID"
```
