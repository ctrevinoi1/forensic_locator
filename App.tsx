import React, { useState } from 'react';
import { UploadIcon, ClockIcon, MapPinIcon } from './components/Icons';
import { FileUpload } from './components/FileUpload';
import { ReasoningLog } from './components/ReasoningLog';
import { VerificationReport } from './components/VerificationReport';
import { useVerification } from './hooks/useVerification';
import type { LogEntry, Report } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [claimedDate, setClaimedDate] = useState<string>('');
  const [claimedTime, setClaimedTime] = useState<string>('');
  const [locationContext, setLocationContext] = useState<string>('Gaza Strip');
  
  const { isLoading, log, report, error, runVerification } = useVerification();

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleAnalyze = () => {
    if (!file) {
      alert('Please upload a file first.');
      return;
    }
    // Combine date and time if both provided, or just date, or empty
    let claimedTimestamp = '';
    if (claimedDate) {
      claimedTimestamp = claimedTime ? `${claimedDate}T${claimedTime}` : claimedDate;
    }
    runVerification(file, claimedTimestamp, locationContext);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-blue-accent tracking-tight">
            AI Forensic Verification System
          </h1>
          <p className="text-gray-400 mt-2">
            Geolocation + Timestamp Determination + Satellite Analysis
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-4 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-3 text-gray-100">
              Evidence Input
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center text-lg font-medium text-gray-300 mb-2">
                  <UploadIcon className="w-6 h-6 mr-2 text-blue-accent" />
                  Upload Image/Video
                </label>
                <FileUpload onFileSelect={handleFileChange} />
                <p className="text-xs text-gray-500 mt-2">
                  AI will determine location and time from visual evidence
                </p>
              </div>

              <div>
                <label htmlFor="location" className="flex items-center text-lg font-medium text-gray-300 mb-2">
                  <MapPinIcon className="w-6 h-6 mr-2 text-blue-accent" />
                  Known Region
                </label>
                <input
                  id="location"
                  type="text"
                  value={locationContext}
                  onChange={(e) => setLocationContext(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-accent focus:outline-none"
                  placeholder="e.g., Gaza Strip, Northern Gaza"
                />
                <p className="text-xs text-gray-500 mt-1">
                  General area to start geolocation analysis
                </p>
              </div>

              <div>
                <label className="flex items-center text-lg font-medium text-gray-300 mb-2">
                  <ClockIcon className="w-6 h-6 mr-2 text-blue-accent" />
                  Claimed Date/Time (Optional)
                </label>

                <div className="space-y-2">
                  <div>
                    <label htmlFor="date" className="block text-sm text-gray-400 mb-1">
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={claimedDate}
                      onChange={(e) => setClaimedDate(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-accent focus:outline-none"
                      placeholder="YYYY-MM-DD"
                    />
                  </div>

                  <div>
                    <label htmlFor="time" className="block text-sm text-gray-400 mb-1">
                      Time (optional, only if you know it)
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={claimedTime}
                      onChange={(e) => setClaimedTime(e.target.value)}
                      disabled={!claimedDate}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-blue-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="HH:MM"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {claimedDate && claimedTime
                    ? 'Will verify both date and time against evidence'
                    : claimedDate
                    ? 'Will verify date and estimate time from shadows/lighting'
                    : 'Leave empty - AI will determine both date and time from visual evidence'
                  }
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !file}
                className="w-full bg-blue-accent text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Start Forensic Analysis'
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: AI Reasoning and Report */}
          <div className="lg:col-span-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 min-h-[60vh] flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 border-b border-gray-600 pb-3 text-gray-100">
              AI Analysis
            </h2>
            {log.length === 0 && !report && !isLoading ? (
               <div className="flex-grow flex items-center justify-center text-gray-500">
                 AI reasoning process will appear here once analysis begins.
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                <div className="h-[65vh] overflow-y-auto pr-2">
                  <h3 className="text-xl font-semibold mb-3 text-gray-200 sticky top-0 bg-gray-800 py-2">
                    Reasoning Process
                  </h3>
                  <ReasoningLog log={log} />
                </div>
                <div className="h-[65vh] overflow-y-auto">
                   <h3 className="text-xl font-semibold mb-3 text-gray-200 sticky top-0 bg-gray-800 py-2">
                     Verification Report
                   </h3>
                  <VerificationReport report={report} isLoading={isLoading} error={error} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;