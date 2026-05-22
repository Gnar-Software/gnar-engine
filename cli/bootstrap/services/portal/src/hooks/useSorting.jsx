import { useCallback, useState } from 'react';

export const defaultSortingOptions = [
    { id: 'az', name: 'A-Z' },
    { id: 'za', name: 'Z-A' },
    { id: 'newest', name: 'Newest' },
    { id: 'oldest', name: 'Oldest' },
];

/**
 * Shared local sorting hook for components that sort already-loaded data.
 *
 * @param {object} params
 * @param {Array<object>} [params.options=defaultSortingOptions] - Selectable sorting options.
 * @param {string} [params.defaultOptionId='az'] - Option id to use when local state has no selection.
 * @returns {object} Sorting state, option list, and local item sorting helper.
 */
export function useSorting({ options = defaultSortingOptions, defaultOptionId = 'az' } = {}) {
    const getDefaultOption = () => {
        return options.find(option => option.id === defaultOptionId) || options[0] || null;
    }

    const [selectedSortingOption, setSelectedSortingOption] = useState(getDefaultOption);

    /**
     * Sort a local array without mutating the source collection.
     *
     * @param {Array<object>} items - Items to sort.
     * @param {object} resolvers - Value resolvers used by generic sort options.
     * @param {Function} resolvers.getLabel - Returns the text value for A-Z and Z-A sorting.
     * @param {Function} resolvers.getDate - Returns the date value for newest and oldest sorting.
     * @returns {Array<object>} A sorted copy of the source items.
     */
    const sortItems = useCallback((items = [], {
        getLabel = item => item?.name || '',
        getDate = item => item?.createdAt || '',
    } = {}) => {
        const sortId = selectedSortingOption?.id || getDefaultOption()?.id;
        const nextItems = [...items];

        return nextItems.sort((a, b) => {
            if (sortId === 'za') {
                return getStringValue(b, getLabel).localeCompare(getStringValue(a, getLabel));
            }

            if (sortId === 'newest') {
                return getTimestampValue(b, getDate) - getTimestampValue(a, getDate);
            }

            if (sortId === 'oldest') {
                return getTimestampValue(a, getDate) - getTimestampValue(b, getDate);
            }

            return getStringValue(a, getLabel).localeCompare(getStringValue(b, getLabel));
        });
    }, [selectedSortingOption, options, defaultOptionId]);

    return {
        sortingOptions: options,
        selectedSortingOption: selectedSortingOption || getDefaultOption(),
        setSelectedSortingOption,
        sortItems,
    };
}

/**
 * Resolve and normalize a string value for predictable text sorting.
 *
 * @param {object} item - Source item.
 * @param {Function} getLabel - Label resolver.
 * @returns {string} Lowercase string value.
 */
const getStringValue = (item, getLabel) => {
    return String(getLabel(item) || '').toLowerCase();
}

/**
 * Resolve and normalize a date value for predictable date sorting.
 *
 * @param {object} item - Source item.
 * @param {Function} getDate - Date resolver.
 * @returns {number} Milliseconds timestamp, or zero for invalid values.
 */
const getTimestampValue = (item, getDate) => {
    const value = getDate(item);
    const timestamp = value ? new Date(value).getTime() : 0;

    return isNaN(timestamp) ? 0 : timestamp;
}
