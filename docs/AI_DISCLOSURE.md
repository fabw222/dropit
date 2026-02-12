# AI Tool Usage Disclosure

## Tool Information

| Item | Details |
|------|---------|
| **Tool Name** | Claude Code (Anthropic official CLI) |
| **Model Version** | Claude Opus 4.6 (`claude-opus-4-6`) |
| **Usage Method** | Interactive development via terminal CLI |

## Scope of AI Involvement

12 out of 13 commits in this project were co-authored by Claude Opus 4.6 (identified by `Co-Authored-By` signatures in Git history), covering:

1. **Design document** — `docs/plans/2026-02-11-dropit-design.md` (product design)
2. **Implementation plan** — `docs/plans/2026-02-11-dropit-implementation.md` (step-by-step implementation)
3. **Sui Move smart contract** — `move/dropit/sources/video.move`
4. **Entire React frontend** — scaffolding, routing, page components, Walrus upload logic, styling
5. **GitHub Pages deployment** — CI/CD workflow, SPA routing fallback
6. **Bug fixes** — share link base path, video list refresh after delete, etc.

The only commit without an AI co-author signature is `9d6e9c6 feat: contract` (manual contract publish to testnet).

## Key Prompts

Core prompt used during the design phase:

> **Goal:** Build a Sui dApp SPA that uploads videos to Walrus and shares them via links, with on-chain metadata storage.
>
> **Architecture:** React SPA (Vite) connects to Sui wallet via @mysten/dapp-kit. Videos upload to Walrus via HTTP publisher API. Video metadata (title, blob ID, timestamp) stored on-chain as owned Sui objects via a Move contract. Viewing is wallet-free via Walrus aggregator URL.
>
> **Tech Stack:** React 18, Vite, TypeScript, @mysten/dapp-kit, @mysten/sui, React Router, Sui Move, Walrus HTTP API

The implementation phase used Claude Code's superpowers skill system. The implementation plan file contains the directive:

> `For Claude: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.`

## Development Workflow

Human defines requirements → Claude generates design document → Claude generates step-by-step implementation plan → Claude writes code for each step → Human reviews and approves each operation → Human manually publishes contract to testnet.
