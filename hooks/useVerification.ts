import { useState, useCallback } from 'react';
import { GeminiService } from '../services/geminiService';
import type { LogEntry, Report, SatelliteImagery } from '../types';

export const useVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLogEntry = useCallback((type: LogEntry['type'], message: string) => {
    setLog(prevLog => [
      ...prevLog,
      { type, message, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const runVerification = useCallback(async (
    file: File,
    claimedTimestamp: string,
    locationContext: string
  ) => {
    setIsLoading(true);
    setLog([]);
    setReport(null);
    setError(null);
    
    const geminiService = new GeminiService();

    try {
      addLogEntry('info', '🚀 Starting forensic analysis...');
      addLogEntry('info', `📍 Known region: ${locationContext}`);
      
      if (claimedTimestamp) {
        addLogEntry('info', '⏰ Mode: VERIFICATION of claimed timestamp');
      } else {
        addLogEntry('info', '⏰ Mode: DETERMINATION - will estimate timestamp from visual evidence');
      }

      // PHASE 1: Extract Visual Clues (Rainbolt-style)
      addLogEntry('processing', '🌍 PHASE 1: Extracting visual clues with Gemini Pro...');
      const clues = await geminiService.analyzeMediaForClues(file, locationContext);
      addLogEntry('success', `✅ Visual clues extracted: ${clues.substring(0, 150)}...`);

      // PHASE 2: Geolocate with Google Search
      addLogEntry('processing', '🔎 PHASE 2: Geolocating with Google Search grounding...');
      const { locationData, sources } = await geminiService.findLocationWithGrounding(clues, locationContext);
      addLogEntry('success', `📍 Location identified: ${locationData.address || 'Unknown'}`);
      addLogEntry('info', `🎯 Location confidence: ${locationData.confidence}% (${locationData.accuracy})`);
      
      if (sources.length > 0) {
        addLogEntry('success', `🔗 Found ${sources.length} grounding sources`);
      }

      // PHASE 3: Fetch Satellite Imagery
      let satelliteData: SatelliteImagery | null = null;
      
      if (locationData.latitude && locationData.longitude) {
        addLogEntry('processing', '🛰️ PHASE 3: Fetching Copernicus satellite imagery...');
        
        // Extract date from timestamp if available
        const dateStr = claimedTimestamp ? claimedTimestamp.split('T')[0] : null;
        
        satelliteData = await geminiService.getSatelliteImagery(
          locationData.latitude,
          locationData.longitude,
          dateStr
        );

        if (satelliteData.available && satelliteData.imagery) {
          addLogEntry('success', `🛰️ Found ${satelliteData.imagery.length} satellite images`);
          satelliteData.imagery.slice(0, 3).forEach(img => {
            addLogEntry('info', `📅 Image from ${new Date(img.date).toLocaleDateString()} - ${img.cloudCover}% cloud cover`);
          });
        } else {
          addLogEntry('warning', '⚠️ No recent satellite imagery available for this location');
        }
      }

      // PHASE 4: Determine/Verify Timestamp
      addLogEntry('processing', '⏰ PHASE 4: Analyzing shadows and lighting for time determination...');
      
      const timeData = await geminiService.determineTimestamp(
        file, 
        locationData,
        claimedTimestamp ? claimedTimestamp.split('T')[0] : null
      );

      if (timeData.estimatedTimeOfDay && timeData.estimatedTimeOfDay !== 'unknown') {
        addLogEntry('success', `⏰ Time estimate: ${timeData.estimatedTimeOfDay}`);
        addLogEntry('info', `📊 Time confidence: ${timeData.confidence}% (method: ${timeData.primaryMethod})`);
        addLogEntry('info', `💡 ${timeData.reasoning.substring(0, 100)}...`);
      } else {
        addLogEntry('warning', '⚠️ Could not determine time from visual evidence');
      }

      // PHASE 5: Generate Comprehensive Report
      addLogEntry('processing', '🤖 PHASE 5: Generating final forensic report with Gemini Pro + Thinking Mode...');
      
      const finalReport = await geminiService.generateVerificationReport(
        file, 
        clues, 
        locationData, 
        timeData,
        claimedTimestamp, 
        sources,
        satelliteData
      );
      
      setReport(finalReport);
      addLogEntry('success', '✅ Verification complete! Report generated.');
      
      // Summary of findings
      addLogEntry('info', `📋 Verdict: ${finalReport.verdict} (${finalReport.confidenceScore}% confidence)`);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      addLogEntry('error', `❌ Verification failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [addLogEntry]);

  return { isLoading, log, report, error, runVerification };
};