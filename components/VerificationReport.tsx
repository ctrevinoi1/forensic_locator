import React from 'react';
import type { Report } from '../types';
import { CheckCircleIcon, XCircleIcon, QuestionMarkCircleIcon } from './Icons';

const VerdictDisplay: React.FC<{ verdict: Report['verdict'] }> = ({ verdict }) => {
  const verdictConfig = {
    Verified: { icon: CheckCircleIcon, color: 'text-green-accent', text: 'Verified' },
    Disputed: { icon: XCircleIcon, color: 'text-red-accent', text: 'Disputed' },
    Inconclusive: { icon: QuestionMarkCircleIcon, color: 'text-orange-accent', text: 'Inconclusive' },
  };

  const { icon: Icon, color, text } = verdictConfig[verdict];

  return (
    <div className="flex items-center space-x-2">
      <Icon className={`w-8 h-8 ${color}`} />
      <span className={`text-2xl font-bold ${color}`}>{text}</span>
    </div>
  );
};

export const VerificationReport: React.FC<{ 
  report: Report | null, 
  isLoading: boolean, 
  error: string | null 
}> = ({ report, isLoading, error }) => {
  if (isLoading && !report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg className="animate-spin h-8 w-8 text-blue-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Generating final report...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-4 bg-red-900/20 text-red-accent border border-red-accent/30 rounded-lg">
        <h4 className="font-bold">Analysis Failed</h4>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (!report) {
    return <div className="text-center text-gray-500 pt-10">Report will be displayed here.</div>;
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Verdict and Confidence */}
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <VerdictDisplay verdict={report.verdict} />
          <div className="text-right">
            <p className="font-semibold text-gray-400">Confidence</p>
            <p className="text-3xl font-bold text-blue-accent">{report.confidenceScore}%</p>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <h4 className="font-bold text-lg mb-2 text-gray-200">Summary</h4>
        <p className="text-gray-300">{report.summary}</p>
      </div>

      {/* Location */}
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <h4 className="font-bold text-lg mb-2 text-gray-200">📍 Estimated Location</h4>
        <p className="text-gray-300">{report.estimatedLocation.address}</p>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Lat: {report.estimatedLocation.latitude}, Lon: {report.estimatedLocation.longitude}
        </p>
      </div>

      {/* Time Estimate */}
      {report.estimatedTime && report.estimatedTime !== 'unknown' && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-200">⏰ Estimated Time</h4>
          <p className="text-gray-300 text-xl">{report.estimatedTime}</p>
          <p className="text-xs text-gray-500 mt-1">
            Determined from shadow analysis and lighting conditions
          </p>
        </div>
      )}

      {/* Satellite Imagery */}
      {report.satelliteData && report.satelliteData.available && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-200">🛰️ Satellite Imagery</h4>
          <p className="text-gray-400 mb-2">
            Found {report.satelliteData.imagery?.length || 0} Sentinel-2 images
          </p>
          <div className="space-y-2">
            {report.satelliteData.imagery?.slice(0, 3).map((img, i) => (
              <div key={i} className="bg-gray-800/50 p-2 rounded text-xs">
                <p className="text-gray-300">
                  📅 {new Date(img.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-gray-500">
                  ☁️ Cloud cover: {img.cloudCover}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Evidence Breakdown */}
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <h4 className="font-bold text-lg mb-2 text-gray-200">Evidence Breakdown</h4>
        <div className="space-y-3">
          <div>
            <h5 className="font-semibold text-gray-300">📍 Location Analysis</h5>
            <p className="text-gray-400 text-sm">{report.evidence.locationAnalysis}</p>
          </div>
          <div>
            <h5 className="font-semibold text-gray-300">⏰ Temporal Analysis</h5>
            <p className="text-gray-400 text-sm">{report.evidence.temporalAnalysis}</p>
          </div>
          {report.evidence.satelliteAnalysis && (
            <div>
              <h5 className="font-semibold text-gray-300">🛰️ Satellite Analysis</h5>
              <p className="text-gray-400 text-sm">{report.evidence.satelliteAnalysis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Grounding Sources */}
      {report.groundingSources && report.groundingSources.length > 0 && (
        <div className="bg-gray-900/50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2 text-gray-200">🔗 Grounding Sources</h4>
          <ul className="space-y-2">
            {report.groundingSources.map((source, i) => (
              <li key={i}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-accent hover:underline break-all text-xs"
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};