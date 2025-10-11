import React, { useState } from "react";

const CustomSelect = ({placeholder, name, options, labelKey, icon = null, setSelectedOption, selectedOption}) => {

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
        {placeholder && name && options && labelKey && setSelectedOption &&
            <div className={`custom-select ${isOpen && "open"} ${isClosing ? "closing" : ""}`}>
                <div className="custom-select-input" id={name} name={name} onClick={handleClick}>
                    {icon && <img src={icon} alt="icon" />}
                    {selectedOption && selectedOption[labelKey] ? (
                        <span>{selectedOption[labelKey]}</span>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </div>
                {isOpen && (
                    <div className="custom-select-options" onMouseLeave={closeDropdown} >
                        <div className="custom-select-options-inner">
                            {options.map((option, index) => {
                                return (
                                    <div key={index} className="custom-select-option" onClick={() => {setSelectedOption(option); setIsOpen(false)}}>
                                        {option[labelKey]}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        }
        </>
    )
}

export default CustomSelect;