import React, { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { INDIAN_STATES_LIST } from '../../types';
import type { IndianState } from '../../types';
import { api } from '../../services/api';

interface StateSelectorProps {
  variant?: 'compact' | 'hero' | 'bar';
  className?: string;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ variant = 'compact', className = '' }) => {
  const { selectedState, setSelectedState } = useAppState();
  const [availableStates, setAvailableStates] = useState<string[]>(INDIAN_STATES_LIST);

  useEffect(() => {
    let isMounted = true;
    api.getStates()
      .then((states) => {
        if (isMounted && states && states.length > 0) {
          setAvailableStates(states.map((s) => s.name));
        }
      })
      .catch(() => {
        // Graceful fallback to static list
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value as IndianState);
  };

  if (variant === 'hero') {
    return (
      <div className={`relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl bg-white border border-slate-300 shadow-md ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 text-slate-700">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">Select Jurisdiction:</span>
        </div>
        <div className="relative flex-1">
          <select
            value={selectedState}
            onChange={handleChange}
            className="w-full appearance-none bg-slate-50 text-slate-900 font-semibold text-base rounded-lg px-4 py-2.5 pr-10 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
          >
            {availableStates.map((state) => (
              <option key={state} value={state} className="bg-white text-slate-900 py-1">
                {state}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-medium transition cursor-pointer shadow-sm">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        <select
          value={selectedState}
          onChange={handleChange}
          className="appearance-none bg-transparent text-slate-800 pr-5 focus:outline-none cursor-pointer text-xs font-semibold"
        >
          {availableStates.map((state) => (
            <option key={state} value={state} className="bg-white text-slate-900 text-xs">
              {state}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 -ml-4 pointer-events-none" />
      </div>
    </div>
  );
};
