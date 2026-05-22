export default function ActionLink({handleClick, label, icon}) {
    return (
        <div className="action-link flex align-center gap-1 cursor-pointer" onClick={handleClick}>
            {icon && <img src={icon} alt="action-icon" />}
            <span>{label}</span>
        </div>        
    )
}