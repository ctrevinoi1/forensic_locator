import React from 'react';
import type { LogEntry } from '../types';
import { InfoIcon, CheckCircleIcon, XCircleIcon, ClockIcon, WarningIcon } from './Icons';

const logTypeStyles = {
  info: { icon: InfoIcon, color: 'text-blue-accent' },
  processing: { icon: ClockIcon, color: 'text-orange-accent' },
  success: { icon: CheckCircleIcon, color: 'text-green-accent' },
  warning: { icon: WarningIcon, color: 'text-yellow-400' },
  error: { icon: XCircleIcon, color: 'text-red-accent' },
};

export const ReasoningLog: React.FC<{ log: LogEntry[] }> = ({ log }) => {
  return (
    <div className="space-y-3">
      {log.map((entry, index) => {
        const { icon: IconComponent, color } = logTypeStyles[entry.type];
        return (
          <div key={index} className="flex items-start text-sm bg-gray-900/50 p-2 rounded-md">
            <IconComponent className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${color}`} />
            <div className="flex-grow">
              <p className="font-mono text-gray-300">{entry.message}</p>
              <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};