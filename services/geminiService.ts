import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Report } from '../types';

// Backend API URL - credentials are stored securely on the server
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';

// Utility function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

interface SatelliteImagery {
  available: boolean;
  imagery?: Array<{
    id: string;
    name: string;
    date: string;
    cloudCover: number;
  }>;
  location: { lat: number; lon: number };
  searchDate: string;
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Authentication is now handled by the backend proxy
  // This method is no longer needed but kept for reference

  async getSatelliteImagery(lat: number, lon: number, date: string | null): Promise<SatelliteImagery> {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const dateStr = targetDate.toISOString().split('T')[0];

      // Get date 30 days before for comparison
      const beforeDate = new Date(targetDate);
      beforeDate.setDate(beforeDate.getDate() - 30);
      const beforeDateStr = beforeDate.toISOString().split('T')[0];

      // Call backend proxy instead of Copernicus API directly
      // This avoids CORS issues and keeps credentials secure
      const searchUrl = `${BACKEND_API_URL}/api/satellite/search?lat=${lat}&lon=${lon}&startDate=${beforeDateStr}&endDate=${dateStr}&limit=5`;

      const searchResponse = await fetch(searchUrl);

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        console.error('Satellite search failed:', errorData);
        throw new Error(errorData.message || 'Imagery search failed');
      }

      const data = await searchResponse.json();

      return data;
    } catch (error) {
      console.error('Satellite imagery error:', error);
      return {
        available: false,
        location: { lat, lon },
        searchDate: date || new Date().toISOString().split('T')[0]
      };
    }
  }

  async analyzeMediaForClues(file: File, locationContext: string): Promise<string> {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `You are an expert geolocation analyst like Rainbolt. Extract EVERY possible location clue from this media.

Known region: ${locationContext}

Analyze in extreme detail:
1. **Architecture**: Building styles, materials (concrete, stone, brick), construction patterns, building density, height variations, roof types, balcony styles
2. **Infrastructure**: Road types (paved/unpaved), road markings, curbs, utility poles and wires, street lights, drainage systems, sidewalks
3. **Signage**: ANY visible text (Arabic/English/other), store names, street signs, banners, graffiti, advertisements, vehicle license plates
4. **Landmarks**: Distinctive buildings, monuments, mosques, churches, towers, recognizable structures, architectural details
5. **Vegetation**: Plant types, trees (palm, olive, etc), climate indicators, landscaping
6. **Urban patterns**: Street layout, building arrangements, urban density, city planning style
7. **Cultural indicators**: Architectural details specific to the region, urban planning characteristics
8. **Damage patterns**: If visible, types of destruction, blast patterns, building collapse patterns, debris characteristics

Focus on the MOST UNIQUE and IDENTIFYING features that could help narrow down the specific location.

Provide a detailed comma-separated list of the most prominent and distinctive clues, emphasizing anything that could identify a specific neighborhood or area.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    });

    return response.text;
  }

  async findLocationWithGrounding(clues: string, locationContext: string): Promise<{ locationData: any, sources: any[] }> {
    const prompt = `Based on these detailed visual clues: "${clues}", determine the most likely specific location within the ${locationContext}. 

Use your knowledge and Google Search to:
1. Identify any mentioned landmarks or distinctive features
2. Cross-reference architectural styles with known neighborhoods
3. Match infrastructure patterns to specific areas
4. Verify any visible signage or text with real locations

Provide the most specific address possible, along with accurate latitude and longitude coordinates. Be as precise as possible - aim for neighborhood or street level accuracy, not just city level.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const locationText = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter(Boolean)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    // Structure the found location data
    const structuringResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract the estimated address, latitude, and longitude from the following text. Respond in JSON format like {"address": "...", "latitude": 0.0, "longitude": 0.0, "confidence": 0-100, "accuracy": "precise/neighborhood/district/city"}. Text: ${locationText}`
    });
    
    try {
        const jsonText = structuringResponse.text.replace(/```json|```/g, '').trim();
        const locationData = JSON.parse(jsonText);
        return { locationData, sources };
    } catch(e) {
        console.error("Failed to parse location JSON:", e);
        return { 
          locationData: { 
            address: locationText, 
            latitude: 31.5, 
            longitude: 34.45, 
            confidence: 30,
            accuracy: 'region'
          }, 
          sources 
        };
    }
  }

  async determineTimestamp(file: File, locationData: any, claimedDate: string | null): Promise<any> {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `You are a forensic analyst determining the TIME this photo was taken (not verifying a claimed time, but DETERMINING it from evidence).

Location: ${locationData.address}
Coordinates: ${locationData.latitude}, ${locationData.longitude}
${claimedDate ? `Known date: ${claimedDate}` : 'Date unknown'}

Analyze ALL time indicators in the image:

1. **Shadow Analysis** (PRIMARY METHOD - most reliable):
   - Measure shadow lengths relative to object heights (short shadows = midday, long shadows = morning/evening)
   - Determine shadow direction (shadows point away from sun)
   - Assess shadow sharpness (sharp = clear sun, diffuse = cloudy/early/late)
   - If multiple objects visible, check shadow consistency

2. **Sun Position**:
   - Visible sun angle in the sky
   - Brightness and color of sunlight (golden = dawn/dusk, white/harsh = midday)
   - Sky gradient and color patterns

3. **Lighting Conditions**:
   - Direct vs indirect sunlight
   - Ambient light quality and intensity
   - Contrast levels (high contrast = strong sun)

4. **Activity Indicators**:
   - People's activities (prayer times in Muslim regions, school hours, market activity, work hours)
   - Traffic patterns (rush hour vs quiet)
   - Store hours (open/closed businesses)
   - Street activity levels

5. **Visible Time Markers**:
   - Any digital displays, clocks, timestamps
   - TV screens with visible content
   - Newspapers or dated materials

6. **Weather/Atmospheric**:
   - Dew or moisture (morning indicator)
   - Heat shimmer (afternoon)
   - Temperature appearance
   - Sky conditions

Provide JSON response:
{
  "estimatedTimeOfDay": "HH:MM-HH:MM format, e.g., 14:00-16:00",
  "confidence": 0-100,
  "primaryMethod": "shadows/lighting/activity/other",
  "shadowAnalysis": "detailed description of shadow observations",
  "shadowDirection": "compass direction or 'towards/away from camera'",
  "lightingQuality": "harsh midday/soft morning/golden evening/etc",
  "reasoning": "detailed explanation of how you determined the time",
  "additionalEvidence": "any supporting observations"
}

If you cannot determine a specific time, provide your best estimate with lower confidence.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    });

    try {
      const jsonText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse timestamp JSON:", e);
      return {
        estimatedTimeOfDay: "unknown",
        confidence: 0,
        primaryMethod: "error",
        shadowAnalysis: response.text,
        reasoning: "Could not parse response"
      };
    }
  }

  async generateVerificationReport(
    file: File,
    clues: string,
    locationData: any,
    timeData: any,
    claimedTimestamp: string,
    sources: any[],
    satelliteData: SatelliteImagery | null
  ): Promise<Report> {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `
      You are a forensic chronolocation expert generating a comprehensive verification report.
      
      **Input Data:**
      1.  **Visual Clues:** ${clues}
      2.  **Estimated Location:** ${JSON.stringify(locationData)}
      3.  **Time Analysis:** ${JSON.stringify(timeData)}
      4.  **Claimed Timestamp:** ${claimedTimestamp || 'Not provided - time was DETERMINED from evidence'}
      5.  **Grounding Sources:** ${JSON.stringify(sources)}
      6.  **Satellite Imagery Available:** ${satelliteData?.available ? `Yes - ${satelliteData.imagery?.length || 0} images found` : 'No'}

      **Analysis Requirements:**
      
      1.  **Location Verification:**
          - Confirm visual clues match the estimated location
          - Use grounding sources as evidence
          - Assess location confidence based on distinctive features identified
          - Note if satellite imagery confirms the location
      
      2.  **Temporal Analysis:**
          - If timestamp was DETERMINED (not claimed):
            * Explain the shadow analysis in detail
            * Confirm the lighting conditions support the estimated time
            * Note any activity indicators that corroborate the time
          - If timestamp was CLAIMED (verification mode):
            * Compare observed shadows with expected sun position
            * Calculate sun azimuth and elevation for that time/location
            * Verify consistency between claimed time and visual evidence
      
      3.  **Weather/Environmental Verification:**
          - Assess visible weather conditions
          - Note any atmospheric indicators
          - Check consistency with typical conditions for that region/time
      
      4.  **Satellite Imagery Analysis:**
          - If available, note how satellite data supports or contradicts findings
          - Mention imagery dates and quality (cloud cover)
          - This provides independent verification of location
      
      5.  **Overall Assessment:**
          - Synthesize all evidence into a coherent verdict
          - Provide specific confidence score based on:
            * Quality and uniqueness of visual clues (0-30 points)
            * Location verification strength (0-30 points)
            * Temporal analysis reliability (0-30 points)
            * Supporting evidence quality (0-10 points)
      
      **Output Format (Strictly follow this JSON structure):**
      {
        "verdict": "Verified" | "Disputed" | "Inconclusive",
        "confidenceScore": number (0-100),
        "estimatedLocation": {
          "address": "string",
          "latitude": number,
          "longitude": number
        },
        "estimatedTime": "${timeData.estimatedTimeOfDay || 'unknown'}",
        "summary": "A concise 2-3 sentence summary of findings",
        "evidence": {
          "visualClues": ["List of key confirmed visual clues"],
          "locationAnalysis": "Detailed reasoning for location determination, including what specific features led to this conclusion",
          "temporalAnalysis": "Detailed reasoning for time determination, including shadow analysis, sun position calculations, and any other temporal indicators",
          "satelliteAnalysis": "${satelliteData?.available ? 'Description of how satellite imagery supports findings' : 'No satellite imagery available'}"
        }
      }
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    try {
      const jsonText = response.text.replace(/```json|```/g, '').trim();
      const reportData: Omit<Report, 'groundingSources' | 'satelliteData'> = JSON.parse(jsonText);
      return { 
        ...reportData, 
        groundingSources: sources,
        satelliteData: satelliteData || undefined
      };
    } catch (e) {
      console.error("Failed to parse report JSON:", e);
      throw new Error("AI returned a report in an invalid format.");
    }
  }
}