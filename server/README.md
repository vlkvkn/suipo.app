# SUI POAP Backend Server

Backend server for SUI POAP application with image upload and zklogin salt management functionality.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy configuration file:
```bash
cp env.example .env
```

3. Configure environment variables in `.env` file

## Running

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server will be available at: `http://localhost:8000`

## API Endpoints

### Image Upload

#### POST `/api/upload/image`
Upload single image

**Parameters:**
- `image` (file) - image file

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "file": {
    "filename": "uuid-filename.jpg",
    "originalName": "original-name.jpg",
    "size": 12345,
    "url": "http://localhost:8000/uploads/uuid-filename.jpg"
  }
}
```

#### POST `/api/upload/images`
Upload multiple images (up to 10 files)

**Parameters:**
- `images` (files) - array of image files

#### GET `/api/upload/images`
Get list of all uploaded images

#### DELETE `/api/upload/image/:filename`
Delete image by filename

### ZKLogin Salt Management

#### POST `/api/zklogin/salt`
Save new salt for user

**Request body:**
```json
{
  "userAddress": "0x...",
  "salt": "salt-value",
  "provider": "google",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET `/api/zklogin/salt/:userAddress`
Get salt by user address

#### GET `/api/zklogin/salts`
Get all salts with pagination

**Query parameters:**
- `page` (number) - page number (default: 1)
- `limit` (number) - records per page (default: 10)
- `provider` (string) - filter by provider

#### PUT `/api/zklogin/salt/:id`
Update existing salt

#### DELETE `/api/zklogin/salt/:id`
Delete salt by ID

#### DELETE `/api/zklogin/salt/user/:userAddress`
Delete salt by user address

### Health Check

#### GET `/api/health`
Server health check

## Project Structure

```
server/
├── index.js              # Main server file
├── routes/
│   ├── upload.js         # Image upload routes
│   └── zklogin.js        # ZKLogin salt management routes
├── uploads/              # Uploaded images directory
├── data/                 # Data directory (salts)
├── package.json
├── env.example
└── README.md
```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

Maximum file size: 5MB

## Security

- File type validation
- File size limits
- Unique filenames
- CORS settings
- Input validation

## Usage Examples

### Upload image from frontend

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:8000/api/upload/image', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

### Save zklogin salt

```javascript
fetch('http://localhost:8000/api/zklogin/salt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userAddress: '0x123...',
    salt: 'generated-salt',
    provider: 'google'
  })
})
.then(response => response.json())
.then(data => console.log(data));
``` 