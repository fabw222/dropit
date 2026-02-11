# DropIt - Video Sharing dApp on Sui

## Overview

A Sui dApp for uploading videos to Walrus decentralized storage and sharing them via links. Built for the Sui hackathon.

Core flow: Connect wallet -> Upload video to Walrus (pay storage fee) -> Store metadata on-chain -> Share link -> Anyone can watch without wallet.

## Tech Stack

- **Frontend:** React SPA (Vite)
- **Wallet:** `@mysten/dapp-kit` (Sui Wallet Kit)
- **Sui SDK:** `@mysten/sui` for chain interaction
- **Storage:** Walrus (decentralized storage, paid via wallet)
- **Routing:** React Router
- **Smart Contract:** Sui Move

## Smart Contract

### Module: `dropit::video`

**Video struct (owned object):**
- `title: String`
- `blob_id: String`
- `owner: address`
- `created_at: u64`

**Entry functions:**
- `create_video(title: String, blob_id: String, clock: &Clock, ctx: &mut TxContext)` — Creates a Video object and transfers it to the sender
- `delete_video(video: Video)` — Destroys the caller's Video object

No shared objects, no admin, no tokens. Video content lives on Walrus; the contract only stores metadata pointers.

## Routes

| Route | Auth | Description |
|---|---|---|
| `/` | Optional (needed to upload) | Home page with upload area |
| `/watch/:blobId` | None | Video playback page |
| `/my` | Required | Personal video management |

## Page Designs

### Home `/`

- Top nav: "DropIt" logo + Connect Wallet button + "My Videos" link
- Center: Drag-and-drop upload zone (or click to select file)
- Title input field
- Upload button triggers: Walrus upload (wallet signs storage payment) -> On-chain `create_video` call -> Show share link with copy button
- Progress bar during upload

### Watch `/watch/:blobId`

- No wallet required
- Extract `blobId` from URL, construct Walrus aggregator URL for video stream
- Centered `<video>` player with native controls
- Display video title and upload time below player (queried from chain by blobId if possible)

### My Videos `/my`

- Requires wallet connection; prompt to connect if not connected
- Query all `Video` objects owned by current wallet address via Sui RPC
- List view: title, upload time, copy share link button, delete button
- Click video to navigate to watch page

## Upload Flow

1. User connects wallet
2. User drags/selects video file and enters title
3. Click upload
4. Frontend uploads video to Walrus, wallet signs the storage payment transaction
5. On success, receive Walrus blob ID
6. Frontend calls `create_video` Move function with title + blob ID
7. Display share link: `{app_url}/watch/{blobId}`
8. User can copy and share the link

## Key Decisions

- No video size/format restrictions — user pays Walrus storage proportionally
- Viewing requires no wallet — maximum accessibility for shared links
- Video metadata on-chain as owned objects — enables "My Videos" queries by address
- No backend server — fully decentralized (frontend + Walrus + Sui chain)
