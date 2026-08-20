
function TextInput({ label, value, onChange, placeholder, type = 'text' }) {

    return (
        <div className="text-input">
            {label && <label>{label}</label>}
            <input 
                type={type}
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
            />
        </div>
    );
}

export default TextInput;
