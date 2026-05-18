import { useState } from 'react';
import { tablesConfig } from '../data/tables.data.js';
import { getAvailableTableColumns, updateTableData, } from '../utils/localStorageUtils.js';


/**
 * Use tables columns hook to manage the available colums for the tables filter.
 * Checks the localStorage for already stored data and the tables.data.js for default configurations.
 * @param {String} param0 
 * @returns 
 */
export function useTablesColumns({ tableKey }) {
    const [availableColumns, setAvailableColumns] = useState(() => fetchAvailableColumns(tableKey));

    /**
     * Toggle the selected state of a column
     * @param {string} columnKey - The key of the column to toggle as returned from the api
     * @returns {void}
     */
    const toggleColumn = (columnKey) => {

        if (!availableColumns) {
            return;
        }

        const updatedColumns = availableColumns.map(col => {
            if (col.key === columnKey) {
                return { ...col, selected: !col.selected };
            }
            return col;
        })

        // Update the states (localStorage and hook state)
        setAvailableColumns(updatedColumns);
        updateTableData(tableKey, updatedColumns);
    }

    return {
        availableColumns,
        toggleColumn
    }

}

// Fetch available columns for the table
function fetchAvailableColumns(tableKey) {

    // Check if the table data is stored in local storage
    const storedData = getAvailableTableColumns(tableKey);
    console.log('STORED DATA FOR TABLE:', tableKey, storedData);
    if (storedData) {

        const defaultConfig = tablesConfig[tableKey] || {};
        const defaultColumns = defaultConfig.availableColumns || [];
        const storedKeys = storedData.map(col => col.key).join('|');
        const defaultKeys = defaultColumns.map(col => col.key).join('|');

        if (storedKeys !== defaultKeys) {
            updateTableData(tableKey, defaultConfig.availableColumns || []);
            return defaultConfig.availableColumns || [];
        }
        
        return storedData;
    }

    // Fallback to default config if no stored data
    const tableConfig = tablesConfig[tableKey] || {};
    updateTableData(tableKey, tableConfig.availableColumns || []); // Store the default config in local storage for future reference
    return tableConfig?.availableColumns || [];
}
