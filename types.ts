export type LogType = 'info' | 'processing' | 'success' | 'warning' | 'error';

export interface LogEntry {
  type: LogType;
  message: string;
  timestamp: string;
}

export type Verdict = 'Verified' | 'Disputed' | 'Inconclusive';

export interface SatelliteImagery {
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

export interface Report {
  verdict: Verdict;
  confidenceScore: number;
  estimatedLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedTime?: string;
  summary: string;
  evidence: {
    visualClues: string[];
    locationAnalysis: string;
    temporalAnalysis: string;
    satelliteAnalysis?: string;
  };
  groundingSources?: {
    title: string;
    uri: string;
  }[];
  satelliteData?: SatelliteImagery;
}