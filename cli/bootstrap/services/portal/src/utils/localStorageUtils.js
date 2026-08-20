/**
 * Will store the tables data in the local storage
 * Info about table key, selected columns and order by will be stored
 * {
 *   tableKey: {
 *     availableColumns: [
 *      { id: <id>, key: 'addressLine1', label: 'Address', selected: true },
 *     ],
 *     orderBy: { key: 'name', direction: 'ASC' }
 *   }
 * }
 */

const STORAGE_KEY = 'tableData';

const readStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

const writeStorage = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const updateTableData = (tableKey, availableColumns) => {
    const existingData = readStorage();
    writeStorage({
        ...existingData,
        [tableKey]: {
            // Preserve any previously stored props (e.g. orderBy) for this table
            ...existingData[tableKey],
            availableColumns
        }
    });
}

export const updateTableOrderBy = (tableKey, orderBy) => {
    const existingData = readStorage();
    writeStorage({
        ...existingData,
        [tableKey]: {
            // Preserve any previously stored props (e.g. availableColumns) for this table
            ...existingData[tableKey],
            orderBy
        }
    });
}


export const getAvailableTableColumns = (tableKey) => {
    const storedData = readStorage();

    if (storedData?.[tableKey]?.availableColumns) {
        return storedData[tableKey].availableColumns;
    }

    return null;
}

export const getStoredOrderBy = (tableKey) => {
    const storedData = readStorage();

    if (storedData?.[tableKey]?.orderBy) {
        return storedData[tableKey].orderBy;
    }

    return null;
}


export const clearTableData = () => {
    localStorage.removeItem(STORAGE_KEY);
}
