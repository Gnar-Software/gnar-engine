import { useState, useEffect, useRef } from "react";

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

    const dropdownRef = useRef(null);

    // Close dropdown 
    const closeDropdown = () => {
        setIsClosing(true);
        setIsOpen(false);
        setTimeout(() => {
            setIsClosing(false);
        }, 300);
    };


    // Open dropdown
    const openDropdown = () => {
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


    // // Click outside to close
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

    return (
        <>
            {placeholder && name && setSelectedOption &&
                <div className={`custom-select filter ${isOpen && "open"} ${isClosing ? "closing" : ""} ${classNames}`}>
                    <div
                        className="custom-select-input"
                        id={name}
                        name={name}
                        onClick={handleClick}
                    >
                        {icon && <img src={icon} alt="icon" />}

                        <span>{placeholder}</span>

                    </div>
                    {isOpen && (
                        <div
                            className="custom-select-options"
                            ref={dropdownRef}
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