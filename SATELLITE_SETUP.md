# Satellite Imagery Integration Setup

This document explains how the satellite imagery integration works and how to set it up.

## Architecture

The application uses a **backend proxy server** to access the Copernicus Data Space Ecosystem (Sentinel Hub) API. This architecture solves two critical issues:

1. **CORS (Cross-Origin Resource Sharing) errors**: Browsers block direct API calls to external services from client-side JavaScript
2. **Security**: Keeps your API credentials secure on the server instead of exposing them in the browser

## Components

### Backend Server (`/server`)
- Express.js server running on port 3001
- Handles authentication with Copernicus API
- Proxies requests to Sentinel Hub/Copernicus Data Space Ecosystem
- Provides three main endpoints:
  - `GET /health` - Health check
  - `GET /api/satellite/search` - Search for satellite imagery
  - `GET /api/satellite/thumbnail/:productId` - Fetch image thumbnails

### Frontend Client
- React/Vite application
- Calls the backend proxy instead of Copernicus API directly
- Updated `geminiService.ts` to use `BACKEND_API_URL`

## Setup Instructions

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or install separately:
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server && npm install
```

### 2. Configure Environment Variables

The `.env` file in the root directory contains your Copernicus credentials:

```env
# Copernicus Data Space Ecosystem credentials
COPERNICUS_CLIENT_ID=sh-ba12f06c-4f5d-46ae-ae18-820c65592585
COPERNICUS_CLIENT_SECRET=7e4PZsYWt0sOBBGouJ1zih6MugRelVxj

# Server configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Important**: The `.env` file is already in `.gitignore` to prevent committing credentials to git.

### 3. Running the Application

#### Development Mode (Recommended)

Run both frontend and backend together:

```bash
npm run dev
```

This uses `concurrently` to start:
- Frontend (Vite) on `http://localhost:5173`
- Backend (Express) on `http://localhost:3001`

#### Run Separately

Terminal 1 (Frontend):
```bash
npm run dev:client
```

Terminal 2 (Backend):
```bash
npm run dev:server
```

## How It Works

### Request Flow

1. User uploads an image for analysis
2. AI determines location (latitude/longitude)
3. Frontend calls: `GET http://localhost:3001/api/satellite/search?lat=31.5&lon=34.45&startDate=2024-01-01&endDate=2024-01-31`
4. Backend server:
   - Authenticates with Copernicus using OAuth2 client credentials
   - Searches for Sentinel-2 satellite imagery at the specified location and date range
   - Returns results to frontend
5. Frontend displays satellite imagery information in the verification report

### API Endpoints

#### Search Satellite Imagery

```http
GET /api/satellite/search?lat={latitude}&lon={longitude}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&limit={number}
```

Response:
```json
{
  "available": true,
  "imagery": [
    {
      "id": "product-id",
      "name": "S2A_MSIL2A_20240115T...",
      "date": "2024-01-15T08:34:21.000Z",
      "cloudCover": 12.5,
      "thumbnail": "http://localhost:3001/api/satellite/thumbnail/product-id"
    }
  ],
  "location": { "lat": 31.5, "lon": 34.45 },
  "searchDate": "2024-01-31",
  "count": 1
}
```

#### Get Thumbnail

```http
GET /api/satellite/thumbnail/{productId}
```

Returns the satellite image thumbnail as binary data.

## Sentinel-2 Satellite Data

- **Revisit time**: 5 days (with both satellites)
- **Resolution**: 10m, 20m, and 60m depending on the band
- **Coverage**: Global
- **Cloud cover**: Variable, reported in metadata
- **Data availability**: Free and open through Copernicus

## Troubleshooting

### CORS Errors
- Make sure the backend server is running on port 3001
- Check that `FRONTEND_URL` in `.env` matches your frontend URL
- Verify `BACKEND_API_URL` in the frontend is correct

### Authentication Errors
- Verify your Copernicus credentials in `.env`
- Make sure you created an OAuth client with "Client Credentials" grant type
- Check the Copernicus Dashboard: https://dataspace.copernicus.eu/

### No Imagery Found
- Satellite imagery may not be available for all locations/dates
- Try expanding the date range (use last 30 days)
- Check cloud cover - high cloud cover may obscure the ground

## Production Deployment

For production, you'll need to:

1. Deploy the backend server (e.g., on Railway, Render, Heroku, etc.)
2. Set environment variables on your hosting platform
3. Update `VITE_BACKEND_API_URL` to point to your production backend URL
4. Deploy the frontend (Vercel, Netlify, etc.)

Example production `.env`:
```env
# Backend
COPERNICUS_CLIENT_ID=your-client-id
COPERNICUS_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001

# Frontend (.env.production)
VITE_BACKEND_API_URL=https://your-backend-domain.com
```

## Resources

- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- [Sentinel Hub API Documentation](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub.html)
- [OAuth Client Setup Guide](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Overview/Authentication.html)
- [Sentinel-2 Mission](https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2)
