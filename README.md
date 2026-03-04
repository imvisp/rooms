# Rooms

A voice chat room web app — create or join rooms and talk with anyone, anywhere.

Built with an Apple iOS-inspired dark mode design.

## Live

[roomschat.vercel.app](https://roomschat.vercel.app)

## Features

- **Create a room** — generates a unique 4-character code
- **Join a room** — enter a code to join instantly
- **Voice chat** — tap to speak, tap to mute
- **Participant avatars** — see who's in the room with live speaking indicators
- **Share** — copy the room link to invite others
- **No sign-up required** — just enter your name and go
- **Max 6 participants** per room

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Apple iOS dark mode design system)
- **Audio:** Agora Web SDK (`agora-rtc-sdk-ng`)
- **Deployment:** Vercel

## Download & Run Locally

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18 or higher) — [download here](https://nodejs.org)
- **npm** (comes with Node.js)
- **Git** — [download here](https://git-scm.com)

To check if they're installed, run:

```bash
node --version    # should show v18.x.x or higher
npm --version     # should show 9.x.x or higher
git --version     # should show git version 2.x.x
```

### Step 1: Clone the Repository

```bash
git clone https://github.com/imvisp/rooms.git
```

This downloads the entire project to a folder called `rooms` on your computer.

### Step 2: Navigate into the Project

```bash
cd rooms
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs all the required packages (React, Tailwind, Agora SDK, etc.). It may take a minute.

### Step 4: Set Up Agora (Required for Voice Chat)

The app uses [Agora](https://www.agora.io) for real-time voice. You need a free Agora App ID:

1. Go to [console.agora.io](https://console.agora.io) and sign up (free)
2. Click **Create a Project**
3. Give it any name (e.g., "rooms")
4. **Important:** Select **Testing mode** (this disables App Certificate so no token is needed)
5. Once created, copy the **App ID**

### Step 5: Add Your Agora App ID

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Open the `.env` file and replace `your_agora_app_id_here` with your actual App ID:

```
VITE_AGORA_APP_ID=paste_your_app_id_here
```

### Step 6: Start the Dev Server

```bash
npm run dev
```

The app will start at **http://localhost:5173** — open it in your browser.

### Step 7: Test It

1. Open **http://localhost:5173** in your browser
2. Enter your name
3. Click **Create Room**
4. Allow microphone access when prompted
5. Share the room code with someone else (or open a second browser tab to test)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | Create production build in `dist/` folder |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
rooms/
├── src/
│   ├── pages/
│   │   ├── Home.tsx        # Home screen — create or join a room
│   │   └── Room.tsx        # Room screen — mic button, avatars, share
│   ├── hooks/
│   │   └── useAgora.ts     # All Agora logic — join, leave, mic, participants
│   ├── App.tsx             # Router setup
│   ├── main.tsx            # App entry point
│   └── index.css           # Apple iOS design system styles
├── public/                 # Static assets
├── .env.example            # Environment variable template
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json             # Vercel routing config
```

## How It Works

- Room codes are 4 uppercase alphanumeric characters (ambiguous chars like O, 0, I, 1 excluded)
- Each room code maps directly to an Agora channel name — no backend or database needed
- User names and gender are saved in localStorage so they persist across sessions
- The app is fully static — deployed on Vercel with no server

## Deploy Your Own

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set your Agora App ID in Vercel dashboard:
# Project Settings → Environment Variables → Add VITE_AGORA_APP_ID
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Mic not working | Allow microphone permission in browser settings and reload |
| "Agora App ID not set" | Make sure `.env` file exists with your `VITE_AGORA_APP_ID` |
| Can't hear others | Click anywhere on the page first (browsers block autoplay audio) |
| "CAN_NOT_GET_GATEWAY_SERVER" | Your Agora project has App Certificate enabled — disable it in Agora console |

## License

MIT
