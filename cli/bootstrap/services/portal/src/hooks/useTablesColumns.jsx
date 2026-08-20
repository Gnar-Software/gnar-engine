import { useMemo, useState } from 'react';
import { tablesConfig } from '../data/tables.data.js';
import { getAvailableTableColumns, getStoredOrderBy, updateTableData, updateTableOrderBy } from '../utils/localStorageUtils.js';


/**
 * Use tables columns hook to manage the available colums and the order by for the tables.
 * Checks the localStorage for already stored data and the tables.data.js for default configurations.
 *
 * @param {String} param0.tableKey - The table key as defined in tables.data.js
 * @returns {{
 *   availableColumns: Array,
 *   toggleColumn: Function,
 *   orderBy: { key: string, direction: 'ASC' | 'DESC' },
 *   orderByParam: Object | undefined,
 *   setOrderByColumn: Function
 * }}
 */
export function useTablesColumns({ tableKey }) {
    const [availableColumns, setAvailableColumns] = useState(() => fetchAvailableColumns(tableKey));
    const [orderBy, setOrderBy] = useState(() => fetchOrderBy(tableKey));

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

    /**
     * Set the order by column. Clicking the currently ordered column flips the
     * direction (ASC -> DESC), clicking a new column orders it ascending.
     * @param {string} columnKey - The column key to order by
     * @returns {void}
     */
    const setOrderByColumn = (columnKey) => {
        const nextOrderBy = orderBy.key === columnKey
            ? { key: columnKey, direction: orderBy.direction === 'ASC' ? 'DESC' : 'ASC' }
            : { key: columnKey, direction: 'ASC' };

        // Update the states (localStorage and hook state)
        setOrderBy(nextOrderBy);
        updateTableOrderBy(tableKey, nextOrderBy);
    }

    // Wire format expected by the back end: { [columnKey]: 'ASC' | 'DESC' }.
    // Undefined while no column is chosen, so the back end applies its own default order.
    const orderByParam = useMemo(
        () => (orderBy.key ? { [orderBy.key]: orderBy.direction } : undefined),
        [orderBy]
    );

    return {
        availableColumns,
        toggleColumn,
        orderBy,
        orderByParam,
        setOrderByColumn
    }

}

// Fetch available columns for the table
function fetchAvailableColumns(tableKey) {

    // Check if the table data is stored in local storage
    const storedData = getAvailableTableColumns(tableKey);
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

// Fetch the order by for the table, preferring stored data over the default config.
// The stored key can be a column key or a column sortKey (for joined columns), so it
// is not validated against the config column keys here.
function fetchOrderBy(tableKey) {
    const defaultOrderBy = tablesConfig[tableKey]?.orderBy || { key: '', direction: 'ASC' };
    const storedOrderBy = getStoredOrderBy(tableKey);

    if (storedOrderBy?.key) {
        return { key: storedOrderBy.key, direction: storedOrderBy.direction || 'ASC' };
    }

    return { key: defaultOrderBy.key || '', direction: defaultOrderBy.direction || 'ASC' };
}
