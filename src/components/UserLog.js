import * as React from "react"

const UserLog = ({messages}) => {

    return (
        <div className="flex flex-col max-h-40 overflow-y-auto justify-end">
            {messages.map((msg,index) => (
                <div key={index}>
                    {msg.processingMessage}
                </div>
            ))
            }
        </div>
    );
}
export default UserLog