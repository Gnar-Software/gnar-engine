import React from "react";


const CustomCheckbox = ({name, label, checked, setChecked}) => {
    
    return (
        <div
            className={`custom-checkbox ${checked && 'checked'}`}
            onClick={(e) => e.stopPropagation()} 
        >
            <input type="checkbox" id={name} name={name} checked={checked} onChange={() => setChecked(!checked)} />
            <label htmlFor={name}>{label}</label>
        </div>
    )
}

export default CustomCheckbox;