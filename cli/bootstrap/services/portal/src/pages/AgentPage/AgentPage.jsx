import AgentInterface from "../../components/AgentInterface/AgentInterface.jsx";
import { agentEnabled } from "../../config.js";

function AgentPage() {
    return (
        <div className="agent-page">
            {agentEnabled ? 
                ( 
                    <AgentInterface />
                ) : (
                    <p>Agent disabled</p>
                )
            }
        </div>
    );
}

export default AgentPage;
