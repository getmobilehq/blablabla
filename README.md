# Blablabla 2.0 🎤

**The AI that listens and knows.**

Blablabla is a universal audio intelligence platform that transcribes, understands, identifies, and enriches any audio input. Whether you're humming a tune, quoting something you half-remember, or capturing thoughts on the go — Blablabla figures out what it is.

## Features

- **🎵 Song Identification** — Sing, hum, or quote lyrics. Blablabla identifies songs even when they're not on Shazam.
- **📖 Scripture Companion** — Find Bible verses from partial quotes or themes.
- **💬 Quote Attribution** — Discover the source of quotes, sayings, and famous phrases.
- **🧠 Voice-First Capture** — Record thoughts and get them enriched with context and references.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI (Whisper for transcription, GPT-4o-mini for analysis)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/blablabla.git
cd blablabla
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and anon key from **Settings > API**

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note**: OpenAI API key is configured server-side in Supabase Edge Functions for security.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
blablabla/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Logo.tsx
│   │   ├── RecordButton.tsx
│   │   ├── ResultCard.tsx
│   │   └── ProcessingStatus.tsx
│   ├── pages/           # Route pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Record.tsx
│   │   ├── History.tsx
│   │   └── Profile.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useRecorder.ts
│   ├── lib/             # Core utilities
│   │   ├── supabase.ts
│   │   └── api.ts
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app component
├── supabase/
│   └── migrations/      # Database migrations
└── tailwind.config.js   # Design system config
```

## Design System

Blablabla uses the "Echo" design direction:

- **Primary**: Emerald `#059669`
- **Background**: Near Black `#09090B`
- **Typography**: Space Grotesk (display), Inter (body)

See `tailwind.config.js` for the complete design token system.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:
- Database setup
- Edge Function deployment
- Security configuration
- Environment variables

**Quick Start:**

1. Deploy Edge Function: `supabase functions deploy analyze-audio`
2. Set OpenAI secret: `supabase secrets set OPENAI_API_KEY=sk-xxx`
3. Deploy frontend to Netlify/Vercel

## API Costs

At scale of 1000 recordings/day:
- Whisper: ~$6/day
- GPT-4o-mini: ~$5/day
- Total: ~$300-400/month

## Roadmap

- [x] Core recording and analysis
- [x] User authentication
- [x] History with search
- [ ] Collections/folders
- [ ] Audio playback with waveform
- [ ] Shareable results
- [ ] Browser extension
- [ ] Mobile apps

## License

MIT © 2026
