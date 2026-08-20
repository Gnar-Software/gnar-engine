import UserInfo from "../UserInfo/UserInfo";
import { Link } from "react-router-dom";

function Sidebar() {

    return (
        <div className="portal-sidebar">
            <div className="inner">
                <ul>
                    <li className="icon-dashboard"><Link to="/portal/dashboard">Dashboard</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-agent"><Link to="/portal/agent">Agent</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-users"><Link to="/portal/users">Users</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-users"><Link to="/portal/pages">Pages</Link></li>
                    <li><Link to="/portal/blocks">Blocks</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-cog"><span>System</span></li>
                    <li><Link to="/portal/tasks">Tasks</Link></li>
                    <li><Link to="/portal/recurring-tasks">Recurring Tasks</Link></li>
                </ul>
            </div>

            <UserInfo />
        </div>
    )
}

export default Sidebar;
