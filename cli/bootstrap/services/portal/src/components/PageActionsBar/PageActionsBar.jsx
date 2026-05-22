export default function PageActionsBar({ header, classNames = '', children }) {
    return (
        <div className={`page-actions-bar flex justify-space align-center ${classNames}`}>
            
            <h1>{header}</h1>

            {/* Children on the right side */}
            <div className='actions-bar-actions flex gap-2 align-center'>
                {children}
            </div>

        </div>
    )
}