import { useState, useRef, useEffect, useLayoutEffect } from "react";

const CustomSelect = ({
    placeholder,
    name,
    options,
    labelKey,
    icon = null,
    setSelectedOption,
    selectedOption,
    errorMessage = null,
    // When omitted, the dropdown auto-flips based on available viewport space.
    // Passing 'top'/'bottom' forces a fixed placement.
    dropdownPlacement = null,
}) => {

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const [dropDirection, setDropDirection] = useState('down');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const optionsRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const isAutoPlacement = dropdownPlacement !== 'top' && dropdownPlacement !== 'bottom';


    // Flip the options above the input when there isn't enough room below and
    // there is more space above. Mirrors the CustomMultiSelect behaviour.
    const updateDropDirection = () => {
        if (!isAutoPlacement || !inputRef.current) return;

        const inputRect = inputRef.current.getBoundingClientRect();
        const optionsHeight = Math.min(optionsRef.current?.scrollHeight || 400, 400); // select max-height is 400px, so we don't need to check beyond that
        const viewportBuffer = 12;
        const spaceBelow = window.innerHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;

        setDropDirection(
            spaceBelow < optionsHeight + viewportBuffer && spaceAbove > spaceBelow
                ? 'up'
                : 'down'
        );
    };


    // Close dropdown
    const closeDropdown = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        setIsClosing(true);
        setIsOpen(false);
        closeTimeoutRef.current = setTimeout(() => {
            setIsClosing(false);
            closeTimeoutRef.current = null;
        }, 300);
    };


    // Open dropdown
    const openDropdown = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        // Direction is resolved in the layout effect below, once the options are
        // actually rendered and their real height can be measured. Measuring here
        // (before render) would fall back to the 400px max and flip up needlessly.
        setIsOpen(true);
        setIsClosing(false);
    };


    // Handle click for opening
    const handleClick = () => {
        if (!isOpen) {
            openDropdown();
        }
        else {
            closeDropdown();
        }
    };


    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);


    // Resolve the flip direction once the options are in the DOM, measuring
    // their real height, and keep it in sync while the page scrolls or resizes
    // underneath the open dropdown. useLayoutEffect runs after commit but before
    // paint, so the corrected direction is applied without a visible flip.
    useLayoutEffect(() => {
        if (!isOpen || !isAutoPlacement) return;

        updateDropDirection();
        window.addEventListener('resize', updateDropDirection);
        window.addEventListener('scroll', updateDropDirection, true);

        return () => {
            window.removeEventListener('resize', updateDropDirection);
            window.removeEventListener('scroll', updateDropDirection, true);
        };
    }, [isOpen, isAutoPlacement, options]);


    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);


    // Show validation feedback until the user interacts with the select.
    useEffect(() => {
        if (errorMessage) {
            setErrorVisible(true);
        }
    }, [errorMessage])


    const handleErrorHide = () => {
        setErrorVisible(false);
    }

    const shouldOpenUp = dropdownPlacement === 'top' || (isAutoPlacement && dropDirection === 'up');


    return (
        <>
            <div
                className="custom-select-cont"
                onClick={handleErrorHide}
            >
                {placeholder && name && options && labelKey && setSelectedOption &&
                    <div
                        className={`custom-select ${isOpen ? "open" : ""} ${isClosing ? "closing" : ""} ${shouldOpenUp ? "open-up" : ""}`}
                        ref={dropdownRef}
                    >
                        <div
                            className={`custom-select-input ${errorVisible ? "select-error" : ""}`}
                            ref={inputRef}
                            id={name}
                            name={name}
                            onClick={handleClick}
                        >
                            {icon && <img src={icon} alt="icon" />}
                            {selectedOption && selectedOption[labelKey] ? (
                                <span>{selectedOption[labelKey]}</span>
                            ) : (
                                <span>{placeholder}</span>
                            )}
                        </div>

                        {(isOpen || isClosing) && (
                            <div className="custom-select-options" ref={optionsRef}>
                                <div className="custom-select-options-inner">
                                    {options.map((option, index) => {
                                        return (
                                            <div key={index} className="custom-select-option" onClick={() => { setSelectedOption(option); closeDropdown() }}>
                                                {option[labelKey]}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                }
            </div>

            {errorVisible && errorMessage &&
                <div className="error-cont">
                    <p>{errorMessage}</p>
                </div>
            }
        </>

    )
}

export default CustomSelect;
