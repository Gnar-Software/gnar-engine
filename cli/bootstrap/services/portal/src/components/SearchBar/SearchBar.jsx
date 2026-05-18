import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

import searchIcon from '../../assets/icons/search-01.svg';


/**
 * Results should be an array of object with the following structure:
 * [
 *   {
 *     label: 'Properties',
 *     data: [
 *       {
 *         id: 1,
 *         name: 'Property 1',
 *         town: 'Town A',
 *         postcode: '12345',
 *         path: '/portal/properties/1/details'
 *       },
 *       ...
 *     ]
 *   },
 * ]
 * @param {Object} param0 
 * @param {Function} param0.performSearch
 * @param {Array} param0.results
 * @param {boolean} param0.dropDownVisible
 * @param {Function} param0.setDropDownVisible
 */
export default function SearchBar({
    performSearch,
    results = [],
    dropDownVisible,
    setDropDownVisible,
    onSelectResult,
    placeholder = "Search properties or people",
    classNames=''
}) {
    const [focused, setFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const debouncedRef = useRef(null);
    const dropdownRef = useRef(null);

    const navigate = useNavigate();

    const hasResults = results.some(group => group.data?.length > 0);


    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (debouncedRef.current) {
            clearTimeout(debouncedRef.current)
        };

        debouncedRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };


    useEffect(() => {
        if (!hasResults) {
            return
        };

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropDownVisible(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [hasResults]);


    return (
        <div
            ref={dropdownRef}
            className={`search-bar flex-row align-center ${focused ? 'focused' : ''} ${classNames}`}
        >
            <label htmlFor="search-input">
                <img src={searchIcon} alt="Search Icon" />
            </label>

            <input
                type="text"
                placeholder={placeholder}
                className="search-input mb-0"
                id="search-input"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => {
                    setFocused(true);
                    setDropDownVisible(true);
                }}
                onBlur={() => setFocused(false)}
            />

            {hasResults && dropDownVisible && (

                <div className="results-dropdown">

                    {results.map(({ label, data }) => {

                        if (!data || data.length === 0) {
                            return null;
                        }

                        return (

                            <ul key={label}>
                                <span>{label}</span>
                                {data.map((result, index) => (
                                    <li key={index} onClick={() => {
                                        if (result.path) {
                                            navigate(result.path);
                                        } else {
                                            onSelectResult(result);
                                        }
                                        setDropDownVisible(false);
                                    }}>
                                        {result.name}
                                        {result.town ? `, ${result.town}` : ''}
                                        {result.postcode ? `, ${result.postcode}` : ''}
                                        {result.reference ? ` (${result.reference})` : ''}
                                        {result.leaseholderName ? ` - ${result.leaseholderName}` : ''}
                                    </li>
                                ))}
                            </ul>
                        );

                    })}

                </div>
            )}
        </div>
    );
}