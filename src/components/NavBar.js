import * as React from "react";

const NavBar = ({conStatus}) => {

    return (
        <nav className="flex items-center justify-between flex-wrap bg-blue-500 p-4 text-white">
            <div>
                <span className="font-semibold text-xl tracking-tight">User Administration</span>
            </div>
            <div>
                Websocket status : {conStatus && conStatus.connected === true ? "Connected": "Disconnected"}
            </div>
        </nav>
    )
}
export default NavBar