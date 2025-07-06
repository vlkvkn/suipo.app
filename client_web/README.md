# SUI POAP - Frontend

Web client for the decentralized SUI POAP application, built with React and TypeScript.

## 🚀 Features

- **POAP Minting**: Mint unique NFTs for event attendees
- **Event Management**: Create, view, and manage events through a user-friendly interface
- **zkLogin Support**: Secure authentication using zkLogin protocol
- **Wallet Integration**: Support for SUI wallet connections

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Radix UI
- **Authentication**: zkLogin, SUI Wallet Standard
- **State Management**: Zustand, React Query
- **Styling**: CSS, Framer Motion
- **Storage**: AWS S3 for image storage and CDN delivery

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Navigate to the client directory:
```bash
cd client_web
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the client directory. See `env.example` for reference.

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Usage

### Creating Events

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the Event Manager page (`/eventmanager`)
3. Fill in the event details
4. Click "Create Event" to deploy the event to the blockchain

### Minting POAPs

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the Mint page (`/mint?mintkey=<yourmintkey>`)
3. Confirm the transaction in your wallet

### Viewing POAPs

1. Connect your SUI wallet or zkLogin using the "Connect Wallet" button
2. Navigate to the POAPs page (`/poaps`)
3. View all your collected POAPs

## 🌐 Deployment

The application is configured for deployment on Fly.io with Docker containers.

### Frontend Deployment
- Uses Vite for building
- Served via nginx
- Configured with `fly.toml` 