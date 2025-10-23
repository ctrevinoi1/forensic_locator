# Backend Proxy Server

This Express.js server acts as a secure proxy for the Copernicus Data Space Ecosystem API, solving CORS issues and protecting your API credentials.

## Features

- ✅ **CORS-enabled**: Allows frontend to make requests without browser restrictions
- 🔒 **Secure**: API credentials stay on the server, never exposed to the browser
- 🛰️ **Sentinel-2 satellite imagery**: Search and retrieve satellite images
- 🚀 **Simple API**: RESTful endpoints for easy integration

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (create .env in root)
COPERNICUS_CLIENT_ID=your-client-id
COPERNICUS_CLIENT_SECRET=your-client-secret

# Run in development mode
npm run dev

# Run in production
npm start
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "Satellite imagery proxy server running"
}
```

### Authenticate with Copernicus

```http
POST /api/satellite/auth
```

Returns an access token for manual API calls (optional - other endpoints handle auth automatically).

### Search Satellite Imagery

```http
GET /api/satellite/search?lat={latitude}&lon={longitude}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}&limit={number}
```

**Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lon` (required): Longitude (-180 to 180)
- `startDate` (optional): Start date for search (default: 30 days ago)
- `endDate` (optional): End date for search (default: today)
- `limit` (optional): Maximum number of results (default: 5)

**Example:**
```bash
curl "http://localhost:3001/api/satellite/search?lat=31.5&lon=34.45&startDate=2024-10-01&endDate=2024-10-23&limit=3"
```

**Success Response:**
```json
{
  "available": true,
  "imagery": [
    {
      "id": "12345-abcde",
      "name": "S2A_MSIL2A_20241015T...",
      "date": "2024-10-15T08:34:21.000Z",
      "cloudCover": 5.2,
      "thumbnail": "http://localhost:3001/api/satellite/thumbnail/12345-abcde"
    }
  ],
  "location": {
    "lat": 31.5,
    "lon": 34.45
  },
  "searchDate": "2024-10-23",
  "count": 1
}
```

**No Results Response:**
```json
{
  "available": false,
  "imagery": [],
  "location": { "lat": 31.5, "lon": 34.45 },
  "searchDate": "2024-10-23",
  "count": 0
}
```

### Get Satellite Image Thumbnail

```http
GET /api/satellite/thumbnail/:productId
```

Returns the thumbnail image as binary data (PNG/JPEG).

**Example:**
```bash
curl "http://localhost:3001/api/satellite/thumbnail/12345-abcde" --output thumbnail.png
```

## Environment Variables

Create a `.env` file in the **root directory** (not in the server directory):

```env
# Copernicus Data Space Ecosystem credentials
COPERNICUS_CLIENT_ID=sh-your-client-id
COPERNICUS_CLIENT_SECRET=your-client-secret

# Server configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Missing required parameters
- `500 Internal Server Error`: Server or API error

Error response format:
```json
{
  "error": "Error type",
  "message": "Error message",
  "details": "Additional context"
}
```

## Testing

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test satellite search
curl "http://localhost:3001/api/satellite/search?lat=48.8566&lon=2.3522&startDate=2024-01-01&endDate=2024-01-31"
```

### Integration with Frontend

The frontend automatically uses this backend when you run:

```bash
# From root directory
npm run dev
```

This starts both the frontend (port 5173) and backend (port 3001) concurrently.

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3002
```

### Network Errors (EAI_AGAIN)

This error means the server can't reach Copernicus servers. Check:
- Internet connection
- Firewall settings
- DNS resolution

### Authentication Errors

If you get "Authentication failed":
- Verify your client_id and client_secret in `.env`
- Check that your Copernicus account is active
- Ensure you created an OAuth client with "Client Credentials" grant type

### CORS Errors

If the frontend can't connect:
- Make sure `FRONTEND_URL` in `.env` matches your frontend URL exactly
- Check that the backend server is running
- Verify the frontend is using the correct `BACKEND_API_URL`

## Production Deployment

### Recommended Platforms

- **Railway**: Easy Node.js deployment with environment variables
- **Render**: Free tier available, simple setup
- **Heroku**: Classic PaaS, well-documented
- **Fly.io**: Modern deployment platform
- **DigitalOcean App Platform**: Simple and reliable

### Deployment Checklist

1. Set environment variables on your platform
2. Ensure `NODE_ENV=production`
3. Update `FRONTEND_URL` to your production frontend URL
4. Update frontend's `VITE_BACKEND_API_URL` to your production backend URL
5. Enable HTTPS
6. Consider rate limiting for production use

### Example Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd server
railway init

# Set environment variables
railway variables set COPERNICUS_CLIENT_ID=your-id
railway variables set COPERNICUS_CLIENT_SECRET=your-secret
railway variables set FRONTEND_URL=https://your-frontend.vercel.app

# Deploy
railway up
```

## Security Notes

- ⚠️ **Never commit `.env` to git** (already in `.gitignore`)
- 🔒 Keep your client_secret confidential
- 🌐 Use HTTPS in production
- 🚫 Consider rate limiting to prevent abuse
- ✅ Restrict CORS to your specific frontend domain in production

## Resources

- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- [Sentinel Hub API Docs](https://documentation.dataspace.copernicus.eu/)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Fetch API](https://nodejs.org/api/globals.html#fetch)
