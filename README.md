# Zynt TempFile

A production-ready temporary and permanent file sharing backend built with Node.js, TypeScript, Fastify, MongoDB, and Cloudflare R2.

## Features

- ✅ **Streaming Uploads** - Direct streaming to Cloudflare R2 (S3-compatible)
- ✅ **File Deduplication** - SHA-256 hash-based deduplication
- ✅ **Temporary & Permanent Files** - Configurable TTL for temp files
- ✅ **Short URLs** - 5-character case-sensitive file IDs
- ✅ **Storage Quota** - Configurable storage limits (default: 10GB)
- ✅ **Admin Dashboard APIs** - File management and analytics
- ✅ **Download Tracking** - Track file downloads
- ✅ **Automatic Expiry** - MongoDB TTL indexes for temp files

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (S3-compatible)
- **File Processing**: Streaming with SHA-256 hashing

## API Endpoints

### Public Endpoints

- `POST /upload` - Upload files
- `GET /f/:fileId` - Download/stream files
- `GET /info/:fileId` - Get file metadata
- `GET /health` - Health check

### Admin Endpoints (requires `x-admin-key` header)

- `GET /admin/files` - List files with filters
- `DELETE /admin/files/:id` - Delete file
- `POST /admin/files/:id/expire` - Force expire file
- `GET /admin/stats/overview` - Overview statistics
- `GET /admin/stats/uploads` - Upload statistics
- `GET /admin/stats/downloads` - Download statistics
- `GET /admin/stats/top` - Top files (most downloaded, largest, most duplicated)

## Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/zynt-tempfile.git
cd zynt-tempfile

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
Environment Variables
See .env.example for all required variables:

MongoDB: Connection URI and database name
Cloudflare R2: Account ID, access keys, bucket name
Admin: API key for admin endpoints
Usage
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
Upload Example
# Upload temporary file (expires in 1 hour)
curl -X POST http://localhost:3000/upload \
  -F "file=@document.pdf" \
  -F "isTemporary=true" \
  -F "expiresIn=3600"

# Upload permanent file
curl -X POST http://localhost:3000/upload \
  -F "file=@image.jpg" \
  -F "isTemporary=false"
  File Limits
Temporary files: 200MB max
Permanent files: 50MB max
Total storage: Configurable (default: 10GB)
Admin API Example
# Get overview statistics
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  http://localhost:3000/admin/stats/overview

# List all duplicate uploads
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  "http://localhost:3000/admin/files?isDuplicate=true"
  # Get overview statistics
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  http://localhost:3000/admin/stats/overview

# List all duplicate uploads
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  "http://localhost:3000/admin/files?isDuplicate=true"