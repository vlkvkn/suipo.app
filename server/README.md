# SUI POAP - Backend

Backend server for the decentralized SUI POAP application, built with Node.js and Express.js.

## 🚀 Features

- **File Upload API**: Handle image uploads for POAPs
- **zkLogin Integration**: Support for zkLogin authentication
- **File Storage**: AWS S3 integration for image storage

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Storage**: AWS S3 for image storage and CDN delivery
- **Authentication**: zkLogin
- **Deployment**: Docker, Fly.io

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS S3 bucket (for file storage)

### Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory. See `env.example` for reference.

4. Start the development server:
```bash
npm run dev
```

The server will be available at `http://localhost:8000`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### API Endpoints

#### File Upload
- `POST /upload` - Upload images for POAPs

#### zkLogin
- `POST /zklogin/verify` - Verify zkLogin tokens

## 🌐 Deployment

The application is configured for deployment on Fly.io with Docker containers.

### Backend Deployment
- Node.js Express server
- File upload handling
- CORS configuration
- Configured with `fly.toml`

### Environment Variables

Create a `.env` file with the following variables:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name

# Server Configuration
PORT=8000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## 🔒 Security

- All uploaded files are validated for type and size
- CORS is configured to restrict access to allowed domains only
- zkLogin provides secure authentication without exposing private keys
