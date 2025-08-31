import React, { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { getApiUrl, getEndpoint } from '../../config/apiConfig.js';

const FilterControls = ({ filters, onFilterChange }) => {
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableFilters = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(getEndpoint('DASHBOARD', 'AVAILABLE_FILTERS')));
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log("Available filters data:", data);
        
        setAvailableYears(Array.isArray(data.years) ? data.years : []);
        setAvailableMonths(Array.isArray(data.months) ? data.months : []);
        
        // Set default year to current year if not already set
        if (!filters.selectedYear && data.currentYear) {
          onFilterChange({ ...filters, selectedYear: data.currentYear });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching available filters:', error);
        setAvailableYears([]);
        setAvailableMonths([]);
        setLoading(false);
      }
    };

    fetchAvailableFilters();
    // GLOBAL SUBMIT PREVENTER
    const handler = (e) => {
      if (e.target.tagName === 'SELECT') {
        e.preventDefault();
      }
    };
    window.addEventListener('submit', handler, true);
    return () => window.removeEventListener('submit', handler, true);
  }, [filters.selectedYear, onFilterChange]);

  // Filter months based on selected year
  const filteredMonths = availableMonths.filter(month => 
    filters.selectedYear ? month.year === filters.selectedYear : true
  );

  return (
    <div className="bg-white  rounded-xl shadow-sm border border-gray-200  p-6 mb-6 transition-colors duration-300">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600 " />
        <h3 className="text-lg font-semibold text-gray-900 ">Filters</h3>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-500 " />
          <label className="text-sm font-medium text-gray-700 ">Year:</label>
          <select
            value={filters.selectedYear || ''}
            onChange={(e) => onFilterChange({ ...filters, selectedYear: parseInt(e.target.value) })}
            onClick={e => e.stopPropagation()}
            className="px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white  text-gray-900 "
            disabled={loading}
          >
            {loading ? (
              <option>Loading...</option>
            ) : (
              availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            )}
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-gray-500 " />
          <label className="text-sm font-medium text-gray-700 ">Month:</label>
          <select
            value={filters.selectedMonth || "All"}
            onChange={(e) => onFilterChange({ ...filters, selectedMonth: e.target.value })}
            onClick={e => e.stopPropagation()}
            className="px-3 py-2 border border-gray-300  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white  text-gray-900 "
            disabled={loading}
          >
            <option value="All">All Months</option>
            {loading ? (
              <option>Loading...</option>
            ) : (
              filteredMonths.map(month => (
                <option key={`${month.year}-${month.value}`} value={month.value}>
                  {month.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterControls; 
