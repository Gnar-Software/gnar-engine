import { useState, useEffect, useRef } from "react";

const SELECT_OPTIONS_HEIGHT = 400;

export default function CustomMultiSelect({
    placeholder,
    name,
    options,
    labelKey,
    icon = null,
    setSelectedOption,
    selectedOptions,
    classNames = '',
}) {

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [dropDirection, setDropDirection] = useState('down');

    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const optionsRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    const updateDropDirection = () => {
        if (!inputRef.current) return;

        const inputRect = inputRef.current.getBoundingClientRect();
        const optionsHeight = Math.min(optionsRef.current?.scrollHeight || SELECT_OPTIONS_HEIGHT, SELECT_OPTIONS_HEIGHT);
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
        updateDropDirection();
        setIsOpen(true);
        setIsClosing(false);
    };


    // Handle click for opening and closing
    const handleClick = () => {
        if (!isOpen) {
            openDropdown();
        } else {
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

    useEffect(() => {
        if (!isOpen) return;

        const animationFrameId = requestAnimationFrame(updateDropDirection);
        window.addEventListener('resize', updateDropDirection);
        window.addEventListener('scroll', updateDropDirection, true);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', updateDropDirection);
            window.removeEventListener('scroll', updateDropDirection, true);
        };
    }, [isOpen, options]);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {placeholder && name && setSelectedOption &&
                <div
                    className={`custom-select filter ${isOpen ? "open" : ""} ${isClosing ? "closing" : ""} ${dropDirection === 'up' ? "open-up" : ""} ${classNames}`}
                    ref={dropdownRef}
                >
                    <div
                        className="custom-select-input"
                        ref={inputRef}
                        id={name}
                        name={name}
                        onClick={handleClick}
                    >
                        {icon && <img src={icon} alt="icon" />}

                        <span>{placeholder}</span>

                    </div>
                    {(isOpen || isClosing) && (
                        <div
                            className="custom-select-options"
                            ref={optionsRef}
                        >
                            <div className="custom-select-options-inner">

                                {options && options.map((option, index) => (
                                    <div
                                        key={index}
                                        className={`custom-select-option ${selectedOptions && selectedOptions.some(selectedOption => selectedOption[labelKey] === option[labelKey]) ? "selected" : ""}`}
                                        onClick={() => { setSelectedOption(option) }}
                                    >
                                        <span>{option[labelKey]}</span>
                                    </div>
                                ))}

                            </div>
                        </div>
                    )}
                </div>
            }
        </>
    )
}
