import React, { useState } from 'react';
import AgentInterface from "../AgentInterface/AgentInterface";


function Topbar() {

    const [dropDownOpen, setDropdownOpen] = useState(false);

    return (
        <div className={`portal-topbar ${dropDownOpen ? 'dropdown-open' : ''}`}>
            <div className="content flex-row">
                {!dropDownOpen ? (
                <button
                    className="agents-button"
                    type="button"
                    aria-expanded={dropDownOpen}
                    onClick={() => setDropdownOpen(!dropDownOpen)}
                >
                    Agent
                </button>
                ) : (
                    <button
                        className="agents-button active"
                        type="button"
                        aria-expanded={dropDownOpen}
                        onClick={() => setDropdownOpen(!dropDownOpen)}
                    >
                        Close
                    </button>
                )}
            </div>

            <div className="agent-dropdown">
                <div className="agent-dropdown-inner">
                    <AgentInterface />
                </div>
            </div>
        </div>
    )
}

export default Topbar;
