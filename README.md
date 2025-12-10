# 🏆 PROVELT

> **Prove Your Skills, Earn Your Badges** – A Web3 Social Skill-Challenge Platform on Solana

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple?logo=solana)](https://solana.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)

---

## 🎯 What is PROVELT?

PROVELT is a gamified social platform where users complete daily skill challenges, submit proof of completion, and earn **compressed NFT badges** on the Solana blockchain. Think of it as a TikTok-style feed meets Web3 achievements.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Daily Challenges** | New skill challenges every day across categories |
| 📸 **Proof Submissions** | Upload photos, videos, or text as proof |
| 🏆 **NFT Badges** | Earn compressed NFTs (cNFTs) for completed challenges |
| 📜 **On-Chain Verification** | Challenge completions logged on Solana |
| 📱 **Infinite Feed** | TikTok-style swipeable feed of submissions |
| 👛 **Wallet Integration** | Phantom, Solflare, Coinbase, and more |
| 🔥 **Reactions & Streaks** | Engage with community and build streaks |
| 👤 **Profiles** | Showcase your badges and achievements |

## 🛠️ Tech Stack

```
Frontend          Backend           Blockchain
─────────────     ─────────────     ─────────────
Next.js 14        Supabase          Solana
TypeScript        PostgreSQL        Metaplex Bubblegum
TailwindCSS       Realtime          Compressed NFTs
React Query       Storage           Wallet Adapters
Zustand           Edge Functions
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **pnpm**
- **Supabase** account ([supabase.com](https://supabase.com))
- **Solana Wallet** with devnet SOL ([faucet](https://faucet.solana.com))

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/provelt.git
cd provelt

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Solana (required)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MERKLE_TREE_ADDRESS=your_merkle_tree
NEXT_PUBLIC_COLLECTION_ADDRESS=your_collection

# Server (required for minting)
TREASURY_PRIVATE_KEY=your_treasury_key_base58
```

### 3. Database Setup

```bash
# Run Supabase migrations (if using Supabase CLI)
npx supabase db push

# Generate TypeScript types
npm run db:generate
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
provelt/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (challenges, mint, submissions)
│   │   ├── auth/              # Authentication pages
│   │   ├── challenges/        # Challenge list & detail pages
│   │   ├── feed/              # Infinite scroll feed
│   │   └── profile/           # User profile pages
│   │
│   ├── components/
│   │   ├── challenges/        # Challenge-specific components
│   │   ├── feed/              # Feed & submission cards
│   │   ├── profile/           # Profile components
│   │   ├── providers/         # React context providers
│   │   ├── ui/                # Reusable UI components
│   │   └── wallet/            # Wallet connection components
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-feed.ts        # Feed data fetching
│   │   ├── use-mint-badge.ts  # NFT minting hook
│   │   └── use-realtime.ts    # Supabase realtime
│   │
│   ├── lib/
│   │   ├── actions/           # Server actions
│   │   ├── solana/            # Solana utilities
│   │   │   ├── config.ts      # Network configuration
│   │   │   ├── mint.ts        # NFT minting logic
│   │   │   ├── rpc.ts         # RPC connection management
│   │   │   └── metadata.ts    # NFT metadata generation
│   │   └── supabase/          # Supabase clients & types
│   │
│   ├── stores/                # Zustand state stores
│   └── types/                 # TypeScript definitions
│
├── supabase/                  # Database migrations & config
├── public/                    # Static assets
├── netlify.toml              # Netlify deployment config
└── .env.example              # Environment template
```

---

## ⚙️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Supabase types |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/`
3. Enable Row Level Security (RLS) policies
4. Create storage buckets: `submissions`, `avatars`, `badges`

### Solana Setup (Devnet)

1. **Create Treasury Wallet**:
   ```bash
   solana-keygen new --outfile treasury.json
   solana airdrop 2 $(solana-keygen pubkey treasury.json) --url devnet
   ```

2. **Create Merkle Tree** (for compressed NFTs):
   ```bash
   # Use Metaplex CLI or SDK to create a Merkle tree
   # See: https://developers.metaplex.com/bubblegum
   ```

3. **Create Collection NFT**:
   ```bash
   # Create a collection NFT for grouping badges
   # See: https://developers.metaplex.com/token-metadata
   ```

---

## 🌐 Deployment

### Netlify (Recommended)

1. **Connect Repository**:
   - Push your code to GitHub
   - Connect repo in Netlify dashboard

2. **Configure Build**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `20`

3. **Set Environment Variables**:
   Add all variables from `.env.example` to Netlify's environment settings.

4. **Deploy!** 🚀

### Vercel Alternative

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## 🔐 Security Considerations

- ⚠️ Never expose `SUPABASE_SERVICE_ROLE_KEY` or `TREASURY_PRIVATE_KEY` to the client
- ✅ Use environment variables for all secrets
- ✅ Enable RLS policies on all Supabase tables
- ✅ Validate wallet signatures server-side
- ✅ Rate limit API endpoints

---

## 🗺️ Roadmap

- [x] Core challenge system
- [x] Proof submissions with media
- [x] Compressed NFT minting
- [x] User profiles & badges
- [x] Infinite feed with reactions
- [ ] Challenge categories filter
- [ ] Leaderboards
- [ ] Social follows
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ on Solana**

[Website](https://provelt.xyz) · [Twitter](https://twitter.com/provelt) · [Discord](https://discord.gg/provelt)

</div>

