import React, {useEffect, useState, useRef} from "react";


export default function Collapsible({children, title, open, classNames}) {

    const [isOpen, setIsOpen] = useState(open);
    const [contentHeight, setContentHeight] = useState("0px");
    const collapsibleContentInner = useRef(null);

    classNames += " collapsible";

    function handleCollapsibleToggle() {
        setIsOpen(!isOpen);
    }

    const handleSetContentHeight = () => {

        if (!collapsibleContentInner.current) {
            return;
        }

        const content = collapsibleContentInner.current;
        const newContentHeight = content.scrollHeight + "px";

        if (isOpen) {
            setContentHeight(newContentHeight);
        }
        else {
            setContentHeight("0px");
        }
        
    }

    const preSetContentHeight = () => {

        if (!collapsibleContentInner.current) {
            return;
        }

        const content = collapsibleContentInner.current;
        const newContentHeight = content.scrollHeight + "px";

        setContentHeight(newContentHeight);
    }

    const unsetMaxHeight = () => {
        setContentHeight("none");
    }

    // handle toggle
    useEffect(() => {

        // closing
        if (!isOpen) {
            preSetContentHeight();
        }

        // opening
        if (isOpen) {
            handleSetContentHeight();
            setTimeout(() => {
                unsetMaxHeight();
            }, (300));    
        }

    }, [isOpen]);

    // handle content height change
    useEffect(() => {

        if (!isOpen) {
            setTimeout(() => {
                handleSetContentHeight();
            }, (0));    
        }
        
    }, [contentHeight]);

    useEffect(() => {
        handleSetContentHeight();
    }, []);


    return (
        <div className={`collapsible-cont ${classNames}`}>
            <div className={`collapsible-header ${isOpen ? "open" : ""}`} onClick={handleCollapsibleToggle}>
                <h3>{title}</h3>
                <span>{isOpen ? "-" : "+"}</span>
            </div>
            <div className={`collapsible-content ${isOpen ? "collapsible-content-open" : ""}`} style={{ maxHeight: contentHeight }}>
                <div className="collapsible-content-inner" ref={collapsibleContentInner}>
                    {children}
                </div>
            </div>
        </div>
    );
}