# SUI POAP - Proof of Attendance Protocol

🌐 **Project Website**: [suipo.app](https://suipo.app)

A decentralized application (dApp) built on the SUI blockchain that allows users to create events and mint POAP (Proof of Attendance Protocol) NFTs for event attendees.

## 🚀 Features

- **POAP Minting**: Mint unique NFTs for event attendees
- **Event Management**: Create, view, and manage events through a user-friendly interface
- **Blockchain Storage**: All event data and POAPs are stored on the SUI blockchain
- **zkLogin Support**: Secure authentication using zkLogin protocol

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Radix UI
- **Backend**: Node.js, Express.js
- **Blockchain**: SUI Network, Move language
- **Authentication**: zkLogin, SUI Wallet Standard
- **State Management**: Zustand, React Query
- **Storage**: AWS S3 for image storage and CDN delivery

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


## 📚 Documentation

- **[Frontend Documentation](client_web/README.md)** - React app setup, development, and deployment
- **[Backend Documentation](server/README.md)** - Node.js server setup, API endpoints, and configuration
- **[Smart Contracts Documentation](contracts/README.md)** - Move contracts, deployment, and security