# SUI POAP - Proof of Attendance Protocol

🌐 **Project Website**: [suipo.app](https://suipo.app)

A decentralized application (dApp) built on the SUI blockchain that allows users to create events and mint POAP (Proof of Attendance Protocol) NFTs for event attendees.

## 🚀 Features

- **POAP Minting**: Mint unique NFTs for event attendees
- **Event Management**: Create, view, and manage events through a user-friendly interface
- **Blockchain Storage**: All event data and POAPs are stored on the SUI blockchain
- **zkLogin Support**: Secure authentication using zkLogin protocol
- **Wallet Integration**: Support for SUI wallet connections

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Radix UI
- **Backend**: Node.js, Express.js
- **Blockchain**: SUI Network, Move language
- **Authentication**: zkLogin, SUI Wallet Standard
- **State Management**: Zustand, React Query
- **Styling**: CSS, Framer Motion

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- SUI CLI (for contract deployment)

### Deploy Smart Contracts

Navigate to the contracts directory and deploy the POAP contracts:

```bash
cd contracts/poap
sui move build
sui client publish --gas-budget 10000000
```

### Configure backend

Navigate to the backend directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the backend directory. See `env.example` for reference.

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8000`

### Configure frontend

Navigate to the frontend directory and install dependencies:

```bash
cd client_web
npm install
```
Create a `.env` file in the frontend directory. See `env.example` for reference.

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎯 Usage

### Creating Events

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the Event Manager page (`/eventmanager`)
3. Fill in the event details
4. Click "Create Event" to deploy the event to the blockchain

### Minting POAPs

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the Mint page (`/mint`)
3. Enter the mint key provided by the event organizer
4. Confirm the transaction in your wallet

### Viewing POAPs

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the POAPs page (`/poaps`)
3. View all your collected POAPs

## 🔧 Development

### Available Scripts

**Frontend (client_web):**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend (server):**
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Project Structure

```
sui-poap/
├── client_web/          # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── contexts/    # React contexts
│   │   ├── api/         # API integration
│   │   └── sui/         # SUI blockchain integration
├── server/              # Backend Node.js server
│   ├── routes/          # API routes
│   └── data/            # Application data
└── contracts/           # SUI Move smart contracts
    └── poap/            # POAP contract implementation
```

## 🌐 Deployment

The application is configured for deployment on Fly.io with Docker containers for both frontend and backend.

### Frontend Deployment
- Uses Vite for building
- Served via nginx
- Configured with `fly.toml`

### Backend Deployment
- Node.js Express server
- File upload handling
- CORS configuration
- Configured with `fly.toml`