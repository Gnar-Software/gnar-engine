import { useEffect, useState, useRef } from 'react';
import { defaultPageSize, defaultPage } from '../config.js';

const PAGE_SIZE_KEY = 'pageSize';

export function usePagination(props) {
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [pageSize, setPageSize] = useState(persistedPageSize());
    const [currentPage, setCurrentPage] = useState(defaultPage);

    const isInitialized = useRef(false);


    // On mount check for query params for page and pageSize
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const page = parseInt(params.get('page'), 10);
        // console.log('URL PAGE PARAM:', page);
        const size = parseInt(params.get('pageSize'), 10);

        if (!isNaN(page) && page !== currentPage) {
            setCurrentPage(page);
        }
        if (!isNaN(size) && size !== pageSize) {
            setPageSize(size);
            updatePersistedPageSize(size);
        }

        isInitialized.current = true;
    }, []);


    // On pageSize or currentPage change, update the URL query params
    useEffect(() => {
        if (!isInitialized.current) {
            return
        };

        const params = new URLSearchParams(window.location.search);

        // Set or remove pageSize param
        if (pageSize !== persistedPageSize()) {
            params.set('pageSize', pageSize);
        } else {
            params.delete('pageSize');
        }

        // Set or remove page param
        if (currentPage !== defaultPage) {
            params.set('page', currentPage);
        } else {
            params.delete('page');
        }

        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
    }, [currentPage, pageSize]);


    // Calculate total pages from paginator info 
    const calculateTotalPages = (pagination) => {
        const totalItems = parseInt(pagination?.total) || 0;
        const pageSize = parseInt(pagination?.pageSize) || defaultPageSize;
        setTotalResults(totalItems);
        return Math.ceil(totalItems / pageSize);
    }


    // Update pagination state from API pagination info.
    const setPagination = (pagination) => {
        setTotalResults(parseInt(pagination?.total) || 0);
        setTotalPages(calculateTotalPages(pagination) || 1);
    }


    return {
        totalPages,
        setTotalPages,
        totalResults,
        setTotalResults,
        pageSize,
        setPageSize: (size) => { setPageSize(size); updatePersistedPageSize(size) },
        currentPage,
        setCurrentPage,
        calculateTotalPages,
        setPagination
    };
}


// Function to get persisted page size from local storage or set it to default if not present
function persistedPageSize() {
    if (!localStorage.getItem(PAGE_SIZE_KEY)) {
        localStorage.setItem(PAGE_SIZE_KEY, defaultPageSize);
        return defaultPageSize;
    }

    return parseInt(localStorage.getItem(PAGE_SIZE_KEY), 10);
}


// Function to update persisted page size in local storage
function updatePersistedPageSize(size) {
    localStorage.setItem(PAGE_SIZE_KEY, size);
}

