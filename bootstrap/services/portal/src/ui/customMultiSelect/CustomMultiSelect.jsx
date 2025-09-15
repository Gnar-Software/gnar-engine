import React, { useState } from "react";

const CustomMultiSelect = ({placeholder, name, options, labelKey, icon = null, setSelectedOption, selectedOptions}) => {

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

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

    return (
        <>
        {placeholder && name && setSelectedOption && 
            <div className={`custom-select ${isOpen && "open"} ${isClosing ? "closing" : ""}`}>
                <div className="custom-select-input" id={name} name={name} onClick={handleClick}>
                    {icon && <img src={icon} alt="icon" />}
                    {selectedOptions && selectedOptions.length >= 1 && selectedOptions[0] && selectedOptions[0][labelKey] ? (
                        selectedOptions.map((selectedOption, index) => (
                            <span>{selectedOption[labelKey]} {index + 1 !== selectedOptions.length && ', '}</span>
                        ))
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </div>
                {isOpen && (
                    <div className="custom-select-options" onMouseLeave={closeDropdown}>
                        <div className="custom-select-options-inner">
                            {options && options.map((option, index) => (
                                <div key={index} className="custom-select-option" onClick={() => {setSelectedOption(option)}}> 
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

export default CustomMultiSelect;