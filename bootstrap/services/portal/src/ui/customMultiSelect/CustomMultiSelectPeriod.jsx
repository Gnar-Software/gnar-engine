import React, {useState, useEffect, useRef} from "react";

const CustomMultiSelectPeriod = ({placeholder, name, options, icon = null, setSelectedOption, selectedOptions}) => {

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
        {placeholder && name && options && setSelectedOption && selectedOptions &&
            <div className={`custom-select ${isOpen && "open"} ${isClosing ? "closing" : ""}`}>
                <div className="custom-select-input" id={name} name={name} onClick={handleClick}>
                    {icon && <img src={icon} alt="icon" />}
                    {selectedOptions.length >= 1 && selectedOptions[0] && selectedOptions[0].period_name ? (
                        selectedOptions.map((selectedPeriod, index) => (
                            <span>{selectedPeriod.period_name} {selectedPeriod.calendar_year} {index + 1 !== selectedOptions.length && ', '}</span>
                        ))
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </div>
                {isOpen && (
                    <div className="custom-select-options" onMouseLeave={closeDropdown}>
                        <div className="custom-select-options-inner">
                            {options.map((period, index) => (
                                <div key={index} className="custom-select-option" onClick={() => {setSelectedOption(period)}}> 
                                    <span>{period.period_name} {period.calendar_year}</span>
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

export default CustomMultiSelectPeriod;