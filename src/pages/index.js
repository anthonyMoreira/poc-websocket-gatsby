import * as React from "react";
import * as SockJs from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import {useEffect, useState, useReducer, Fragment} from "react";
import UserTable from "../components/UserTable";
import NavBar from "../components/NavBar";
import UserLog from "../components/UserLog";

const APIPort = "https://poc-websocket-api.moreira.tech"

// markup
const IndexPage = () => {
    const [registerFunction, setRegisterFunction] = useState(() => () => "");
    const [updateFunction, setUpdateFunction] = useState(() => () => "");
    const [userName, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [userList, setUserList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState({connected: false});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [requestCount, setRequestCount] = useState(0);
    const [totalConnectedUsers, setTotalConnectedUsers] = useState(0);

    const initialUserStateUpdate = {type: "REGISTER", email: "", username: ""};
    const stateReducer = function (userStateUpdate, action) {
        setUsername(action.username);
        setEmail(action.email);
        return action;
    }
    const [userStateUpdate, dispatchUserState] = useReducer(stateReducer, initialUserStateUpdate);

    const deleteCall = function (username) {
        if (connectionStatus.connected) {
            setLoading(true);
            setErrorMessage(null);
            stompClient.send("/app/delete-user", {}, JSON.stringify({"username": username}));
        }
    }

    const consumeUserEvent = function (data) {
        console.log("Consumed user event", data);
        const user = JSON.parse(data.body);
        console.log("User:" + user);
        if (user.status === "DELETED") {
            setUserList(prev => prev.filter(u => u.username !== user.username))
        } else if (user.status === "REGISTERED") {
            setUserList(prev => [...prev, user])
        } else if (user.status === "UPDATED") {
            setUserList(prevList => {
                return prevList.map(u => {
                    if (u.username === user.username) {
                        return {...u, email: user.email};
                    }
                    return u;
                });
            })
        }
        setMessages(prev => [...prev, user]);
    };

    useEffect(() => {
        const stompClient = Stomp.over(function () {
            return new SockJs(APIPort + "/websocket", null, {transports: ["websocket"]});
        });
        stompClient.reconnect_delay = 1000;
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/user/queue/register-user', function (ok) {
                console.log("User registered:" + ok.body)
                setLoading(false);
                const user = JSON.parse(ok.body);
                if (user.status === "INVALID_REGISTER") {
                    setErrorMessage(user.processingMessage);
                }
            });
            stompClient.subscribe('/user/queue/delete-user', function (ok) {
                console.log("User deleted:" + ok.body)
                setLoading(false);
            });
            stompClient.subscribe('/user/queue/update-user', function (ok) {
                console.log("User updated:" + ok.body)
                setLoading(false);
                const user = JSON.parse(ok.body);
                if (user.status === "INVALID_UPDATE") {
                    setErrorMessage(user.processingMessage);
                }
            });
            stompClient.subscribe('/topic/user-event', consumeUserEvent);
            stompClient.subscribe("/topic/analytics-event", function (msg) {
                console.log("Analytics update :"+msg.body);
                const analytics = JSON.parse(msg.body);
                if (analytics.count30Sec) {
                    setRequestCount(analytics.count30Sec);
                }
                if (analytics.totalConnectedUsers) {
                    setTotalConnectedUsers(analytics.totalConnectedUsers);
                }
            });
            setConnectionStatus({connected: true});
        }, function (err) {
            console.error("Stomp error", err);
        }, function (err) {
            console.error("Websocket is closed", err);
            setConnectionStatus({connected: false});
        });
        setStompClient(stompClient);
        return function () {
            stompClient.disconnect();
        }
    }, []);

    useEffect(() => {
        setRegisterFunction(() => x => {
            if (connectionStatus.connected) {
                setLoading(true);
                setErrorMessage(null);
                stompClient.send("/app/register-user", {}, JSON.stringify({username: userName, "email": email}));
                dispatchUserState({type: "REGISTER", email: "", username: ""});
            }
        });
        setUpdateFunction(() => x => {
            if (connectionStatus.connected) {
                setLoading(true);
                setErrorMessage(null);
                stompClient.send("/app/update-user", {}, JSON.stringify({username: userName, "email": email}));
                dispatchUserState({type: "REGISTER", email: "", username: ""});
            }
        })
    }, [userName, stompClient, connectionStatus, email]);

    useEffect(() => {
        setLoading(true);
        fetch(APIPort + "/list-user")
            .then(res => res.json())
            .then((result) => {
                    setUserList(result);
                    setLoading(false);
                },
                (error) => {
                    console.error(error)
                })
    }, [connectionStatus]);

    return (
        <main className={(loading ? "cursor-wait" : "cursor-default") + " h-screen text-black"}>
            <title>User Administration</title>
            <NavBar conStatus={connectionStatus}/>
            <div className="bg-gray-200 py-5 h-full px-10 border-t-2 border-blue-200 shadow flex flex-wrap">
                <div className="flex-initial md:flex-1">
                    <UserTable data={userList}
                               updateCallback={(row) => dispatchUserState({
                                   type: "UPDATE",
                                   email: row.email,
                                   username: row.username
                               })}
                               deleteCallback={(row) => {
                                   deleteCall(row.username);
                               }}
                    />
                    <div className="flex flex-col md:mr-16 mt-10 mb-5">
                        <div
                            className={(errorMessage !== null ? "visible" : "hidden") + " text-red-500"}>{errorMessage}</div>
                        <label htmlFor="user"
                               className="text-gray-800 dark:text-gray-100 text-sm font-bold leading-tight tracking-normal mb-2">
                            Username
                        </label>
                        <input id="user"
                               value={userName}
                               onChange={(e) => setUsername(e.target.value)}
                               className="text-gray-600 dark:text-gray-400 focus:outline-none focus:border focus:border-indigo-700 dark:focus:border-indigo-700 dark:border-gray-700 dark:bg-gray-800 bg-white font-normal w-64 h-10 flex items-center pl-3 text-sm border-gray-300 rounded border shadow"
                               placeholder="Bob"/>
                        <label htmlFor="user"
                               className="text-gray-800 dark:text-gray-100 text-sm font-bold leading-tight tracking-normal mb-2">
                            Email
                        </label>
                        <input id="email"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                               className="text-gray-600 dark:text-gray-400 focus:outline-none focus:border focus:border-indigo-700 dark:focus:border-indigo-700 dark:border-gray-700 dark:bg-gray-800 bg-white font-normal w-64 h-10 flex items-center pl-3 text-sm border-gray-300 rounded border shadow"
                               placeholder="Alice"/>
                    </div>
                    <div className="flex">
                        {userStateUpdate.type === "REGISTER" &&
                            <div
                                className={(userStateUpdate.type === "REGISTER" ? "visible" : "hidden") + " flex-initial"}>
                                <button
                                    className={(loading ? "cursor-wait disabled" : "cursor-hover") + " bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                                    onClick={registerFunction}>
                                    Register
                                </button>
                            </div>
                        }
                        {userStateUpdate.type === "UPDATE" &&
                            <Fragment>
                                <div className={"flex-initial"}>
                                    <button
                                        className={(loading ? "cursor-wait disabled" : "cursor-hover") + " bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                                        onClick={updateFunction}>
                                        Update
                                    </button>
                                </div>
                                <div className={"flex-initial mx-8"}>
                                    <button
                                        className={(loading ? "cursor-wait disabled" : "cursor-hover") + " bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                                        onClick={() => dispatchUserState(initialUserStateUpdate)}>
                                        Cancel
                                    </button>
                                </div>
                            </Fragment>
                        }
                    </div>
                </div>
                <div className="flex-initial w-64">
                    <div>
                        Last 30 seconds request count : {requestCount}
                    </div>
                    <div>
                        Total connected users : {totalConnectedUsers}
                    </div>
                </div>
                <div className="flex-initial w-64">
                    <UserLog messages={messages}/>
                </div>

            </div>
        </main>
    )
}

export default IndexPage
