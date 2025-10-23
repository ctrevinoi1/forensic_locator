# AI Forensic Verification System

An advanced AI-powered system for geolocating and chronolocating visual evidence using satellite imagery, AI analysis, and web grounding.

## Features

- 🌍 **Geolocation**: AI-powered visual clue extraction and location determination
- ⏰ **Chronolocation**: Shadow analysis and lighting assessment for timestamp verification
- 🛰️ **Satellite Imagery**: Integration with Copernicus/Sentinel-2 satellite data
- 🔍 **Web Grounding**: Google Search integration for verification
- 🤖 **AI Analysis**: Powered by Google Gemini Pro with extended thinking

## Architecture

This application consists of two parts:

1. **Frontend** (React + Vite) - Port 5173
   - User interface for uploading evidence
   - Real-time AI reasoning log
   - Verification report display

2. **Backend** (Express.js) - Port 3001
   - Proxy for Copernicus satellite API
   - Secure credential management
   - CORS handling

## Quick Start

### Prerequisites

- Node.js 18+ (with native fetch support)
- npm or yarn
- Copernicus Data Space Ecosystem account ([Sign up here](https://dataspace.copernicus.eu/))
- Google AI API key

### Installation

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### Configuration

Create a `.env` file in the root directory:

```env
# Google AI (Gemini)
API_KEY=your-google-ai-api-key

# Copernicus Data Space Ecosystem
COPERNICUS_CLIENT_ID=sh-your-client-id
COPERNICUS_CLIENT_SECRET=your-client-secret

# Server configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Running the Application

```bash
# Start both frontend and backend
npm run dev
```

Or run separately:

```bash
# Terminal 1: Frontend
npm run dev:client

# Terminal 2: Backend
npm run dev:server
```

Access the application at: `http://localhost:5173`

## How It Works

### 5-Phase Verification Process

1. **Visual Clue Extraction**
   - Analyzes architecture, infrastructure, signage, landmarks
   - Identifies vegetation, urban patterns, cultural indicators
   - Detects damage patterns if present

2. **Geolocation with Web Grounding**
   - Uses extracted clues with Google Search
   - Cross-references landmarks and features
   - Provides coordinates and confidence score

3. **Satellite Imagery Retrieval**
   - Fetches Sentinel-2 imagery from Copernicus
   - Searches 30-day window around the event
   - Reports cloud cover and availability

4. **Timestamp Determination**
   - Shadow length and direction analysis
   - Sun position calculation
   - Lighting quality assessment
   - Activity indicators (if visible)

5. **Comprehensive Report Generation**
   - Synthesizes all evidence
   - Provides verdict with confidence score
   - Details reasoning for each finding

## API Endpoints (Backend)

### Health Check
```
GET http://localhost:3001/health
```

### Satellite Imagery Search
```
GET http://localhost:3001/api/satellite/search?lat={lat}&lon={lon}&startDate={date}&endDate={date}
```

### Satellite Image Thumbnail
```
GET http://localhost:3001/api/satellite/thumbnail/{productId}
```

See [server/README.md](server/README.md) for detailed API documentation.

## Project Structure

```
forensic_locator/
├── components/           # React components
│   ├── FileUpload.tsx
│   ├── ReasoningLog.tsx
│   ├── VerificationReport.tsx
│   └── Icons.tsx
├── hooks/               # React hooks
│   └── useVerification.ts
├── services/            # API services
│   └── geminiService.ts
├── server/              # Backend proxy server
│   ├── index.js
│   ├── package.json
│   └── README.md
├── App.tsx              # Main application
├── types.ts             # TypeScript definitions
├── .env                 # Environment variables
└── package.json         # Frontend dependencies
```

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express.js, Node.js fetch API
- **AI**: Google Gemini 2.5 Pro/Flash with extended thinking
- **Satellite Data**: Copernicus Data Space Ecosystem (Sentinel-2)
- **Search**: Google Search Grounding

## Satellite Imagery Integration

The application uses Sentinel-2 satellite imagery from the European Space Agency's Copernicus programme. This provides:

- **Global coverage** with 5-day revisit time
- **High resolution** (10m, 20m, 60m multi-spectral)
- **Free and open access**
- **Historical data** going back to 2015

### Why a Backend Proxy?

Direct browser access to the Copernicus API causes two problems:
1. **CORS errors**: Browsers block cross-origin requests
2. **Security risk**: Exposing API credentials in the browser

The backend proxy solves both issues by handling authentication securely and proxying requests.

See [SATELLITE_SETUP.md](SATELLITE_SETUP.md) for detailed satellite integration documentation.

## Development Scripts

```bash
npm run dev              # Run both frontend and backend
npm run dev:client       # Run frontend only
npm run dev:server       # Run backend only
npm run build            # Build frontend for production
npm run preview          # Preview production build
npm run install:all      # Install all dependencies
```

## Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Set environment variable: `VITE_BACKEND_API_URL=https://your-backend.com`

### Backend (Railway/Render/Heroku)

1. Deploy the `server` directory
2. Set environment variables:
   - `COPERNICUS_CLIENT_ID`
   - `COPERNICUS_CLIENT_SECRET`
   - `FRONTEND_URL=https://your-frontend.com`
   - `PORT=3001`

See [SATELLITE_SETUP.md](SATELLITE_SETUP.md) for detailed deployment instructions.

## Troubleshooting

### CORS Errors
- Ensure backend is running on port 3001
- Check `FRONTEND_URL` in `.env` matches your frontend URL
- Verify `VITE_BACKEND_API_URL` points to correct backend

### Satellite Imagery Not Loading
- Check internet connection
- Verify Copernicus credentials are correct
- Try expanding the date range (last 30-60 days)
- Note: Some locations may have high cloud cover

### Authentication Errors
- Verify your Copernicus OAuth client uses "Client Credentials" grant type
- Check that credentials in `.env` are correct
- Ensure your Copernicus account is active

### Network Errors (EAI_AGAIN)
- Check internet connection
- Verify DNS resolution
- Check firewall settings

## Security Notes

- ⚠️ Never commit `.env` to git
- 🔒 Keep API credentials secure
- 🌐 Use HTTPS in production
- 🚫 Restrict CORS to specific domains in production
- ✅ Consider rate limiting for public deployments

## License

This is a defensive security tool for forensic verification purposes only.

## Resources

- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- [Sentinel Hub Documentation](https://documentation.dataspace.copernicus.eu/)
- [Google AI for Developers](https://ai.google.dev/)
- [Sentinel-2 Mission](https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2)

## Support

For issues or questions:
1. Check [SATELLITE_SETUP.md](SATELLITE_SETUP.md) for satellite-specific help
2. Check [server/README.md](server/README.md) for backend API documentation
3. Review troubleshooting section above

---

Built with ❤️ using AI and satellite technology for truth verification
