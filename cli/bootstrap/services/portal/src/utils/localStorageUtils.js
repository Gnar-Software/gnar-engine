/**
 * Will store the tables data in the local storage
 * Info about table key and selected columns will be stored
 * {
 *   tableKey: {
 *     availableColumns: [
 *      { id: <id>, key: 'addressLine1', label: 'Address', selected: true },
 *     ]
 *   }
 * }
 */

const STORAGE_KEY = 'tableData';

export const updateTableData = (tableKey, availableColumns) => {
    console.log('UPDATING TABLE DATA IN LOCAL STORAGE FOR TABLE:', tableKey, availableColumns);
    const existingData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const updatedData = {
        ...existingData,
        [tableKey]: {
            availableColumns
        }
    }
    console.log('UPDATED DATA:', updatedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
}


export const getAvailableTableColumns = (tableKey) => {
    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

    if (storedData && storedData[tableKey] && storedData[tableKey].availableColumns) {
        return storedData[tableKey].availableColumns;
    }

    return null;
}


export const clearTableData = () => {
    localStorage.removeItem(STORAGE_KEY);
}

