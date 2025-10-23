import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Satellite imagery proxy server running' });
});

// Copernicus authentication endpoint
app.post('/api/satellite/auth', async (req, res) => {
  try {
    const response = await fetch(
      'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.COPERNICUS_CLIENT_ID,
          client_secret: process.env.COPERNICUS_CLIENT_SECRET
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Copernicus auth error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
      details: error.code === 'EAI_AGAIN'
        ? 'Network error: Unable to reach Copernicus servers. Check your internet connection.'
        : error.message
    });
  }
});

// Satellite imagery search endpoint
app.get('/api/satellite/search', async (req, res) => {
  try {
    const { lat, lon, startDate, endDate, limit = 5 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Latitude and longitude are required'
      });
    }

    // Get authentication token
    const authResponse = await fetch(
      'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.COPERNICUS_CLIENT_ID,
          client_secret: process.env.COPERNICUS_CLIENT_SECRET
        })
      }
    );

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // Calculate date range (default to last 30 days if not provided)
    const endDateTime = endDate ? new Date(endDate) : new Date();
    const startDateTime = startDate
      ? new Date(startDate)
      : new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startDateStr = startDateTime.toISOString().split('.')[0] + 'Z';
    const endDateStr = endDateTime.toISOString().split('.')[0] + 'Z';

    // Search for Sentinel-2 imagery
    const searchUrl = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;POINT(${lon} ${lat})') and ContentDate/Start gt ${startDateStr} and ContentDate/Start lt ${endDateStr}&$orderby=ContentDate/Start desc&$top=${limit}`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.value && searchData.value.length > 0) {
      const imagery = searchData.value.map(item => ({
        id: item.Id,
        name: item.Name,
        date: item.ContentDate.Start,
        cloudCover: item.CloudCover || 0,
        thumbnail: item.S3Path ? `https://catalogue.dataspace.copernicus.eu/odata/v1/Products(${item.Id})/Thumbnail/$value` : null
      }));

      res.json({
        available: true,
        imagery,
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        searchDate: endDateStr.split('T')[0],
        count: imagery.length
      });
    } else {
      res.json({
        available: false,
        imagery: [],
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        searchDate: endDateStr.split('T')[0],
        count: 0
      });
    }
  } catch (error) {
    console.error('Satellite imagery search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
      details: error.cause?.code === 'EAI_AGAIN' || error.code === 'EAI_AGAIN'
        ? 'Network error: Unable to reach Copernicus servers. Check your internet connection.'
        : error.message
    });
  }
});

// Get satellite image thumbnail
app.get('/api/satellite/thumbnail/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Get authentication token
    const authResponse = await fetch(
      'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.COPERNICUS_CLIENT_ID,
          client_secret: process.env.COPERNICUS_CLIENT_SECRET
        })
      }
    );

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.json();
    const token = authData.access_token;

    // Fetch thumbnail
    const thumbnailUrl = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products(${productId})/Thumbnail/$value`;

    const thumbnailResponse = await fetch(thumbnailUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!thumbnailResponse.ok) {
      throw new Error('Thumbnail fetch failed');
    }

    // Forward the image response
    const imageBuffer = await thumbnailResponse.arrayBuffer();
    const contentType = thumbnailResponse.headers.get('content-type') || 'image/png';

    res.set('Content-Type', contentType);
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('Thumbnail fetch error:', error);
    res.status(500).json({
      error: 'Thumbnail fetch failed',
      message: error.message,
      details: error.cause?.code === 'EAI_AGAIN' || error.code === 'EAI_AGAIN'
        ? 'Network error: Unable to reach Copernicus servers. Check your internet connection.'
        : error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🛰️  Satellite imagery proxy server running on port ${PORT}`);
  console.log(`✅ CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
