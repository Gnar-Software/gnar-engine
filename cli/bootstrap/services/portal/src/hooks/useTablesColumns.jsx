import { useMemo, useState } from 'react';

const STORAGE_KEY = 'tableData';

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
export function useTablesColumns({ tableKey, availableColumns: initialAvailableColumns, filters: initialFilters, orderBy: initialOrderBy }) {
    const getStoredTableData = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (error) {
            console.error('Error reading table data from localStorage:', error);
            return {};
        }
    };

    const updateStoredTableData = (updates) => {
        if (!tableKey) {
            return;
        }

        const storedData = getStoredTableData();
        const updatedData = {
            ...storedData,
            [tableKey]: {
                ...(storedData[tableKey] || {}),
                ...updates,
            }
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    };

    const getStoredAvailableColumns = () => {
        if (!tableKey) {
            return null;
        }

        return getStoredTableData()?.[tableKey]?.availableColumns || null;
    };

    const getStoredOrderBy = () => {
        if (!tableKey) {
            return null;
        }

        return getStoredTableData()?.[tableKey]?.orderBy || null;
    };
    
    const [availableColumns, setAvailableColumns] = useState(() => getStoredAvailableColumns() || initialAvailableColumns);
    const [orderBy, setOrderBy] = useState(() => getStoredOrderBy() || initialOrderBy);

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
        });

        // Update the states (localStorage and hook state)
        setAvailableColumns(updatedColumns);
        updateStoredTableData({ availableColumns: updatedColumns });
    };

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
        updateStoredTableData({ orderBy: nextOrderBy });
    };

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
    };
}
