import * as React from "react";
import * as SockJs from "sockjs-client";
import {Stomp} from "@stomp/stompjs";
import {useEffect, useState} from "react";
import UserTable from "../components/UserTable";
import NavBar from "../components/NavBar";

const APIPort = "https://poc-websocket-api.moreira.tech"

// markup
const IndexPage = () => {
    const [registerFunction, setRegisterFunction] = useState(() => () => "");
    const [deleteFunction, setDeleteFunction] = useState(() => () => "");
    const [userName, setUsername] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [userList, setUserList] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState({connected: false});
    const [loading, setLoading] = useState(false);

    const consumeUserEvent = function (data) {
        console.log("Consumed user event", data);
        const user = JSON.parse(data.body);
        console.log("User:" + user);
        if (user.status === "DELETED") {
            setUserList(prev => prev.filter(u => u.username !== user.username))
        } else if (user.status === "REGISTERED") {
            setUserList(prev => [...prev, user])
        }
    };

    useEffect(() => {
        const stompClient = Stomp.over(function () {
            return new SockJs(APIPort + "/websocket", null, {transports: ["websocket"]});
        });
        stompClient.reconnect_delay = 10000;
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/user/queue/register-user', function (ok) {
                console.log("User registered:" + ok.body)
                setLoading(false);
            });
            stompClient.subscribe('/user/queue/delete-user', function (ok) {
                console.log("User deleted:" + ok.body)
                setLoading(false);
            });
            stompClient.subscribe('/topic/user-event', consumeUserEvent);
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
                stompClient.send("/app/register-user", {}, JSON.stringify({username: userName}));
            }
        });
        setDeleteFunction(() => x => {
            if (connectionStatus.connected) {
                setLoading(true);
                stompClient.send("/app/delete-user", {}, JSON.stringify({username: userName}));
            }
        })
    }, [userName, stompClient, connectionStatus]);

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
        <main className={(loading ? "cursor-wait" : "cursor-default") +"h-screen"}>
            <title>User Administration</title>
            <NavBar conStatus={connectionStatus}/>
            <div class="mx-10">
                <UserTable data={userList}/>
                <div class="flex mb-4">
                    <div className="flex-initial align-middle">
                        <label htmlFor="user">Username:</label>
                    </div>
                    <div class="flex-initial align-middle">
                        <input class="align-middle border-solid border-2 border-slate-300 mx-4" id="user" type="text"
                               onChange={(e) => setUsername(e.target.value)}/>
                    </div>
                    <div class="flex-initial align-middle mx-8">
                        <button class={(loading ? "cursor-wait disabled" : "cursor-hover") + " bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                                onClick={registerFunction}>Register User
                        </button>
                    </div>
                    <div className="flex-initial mx-8">
                        <button class={(loading ? "cursor-wait disabled" : "cursor-hover") + " bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                                onClick={deleteFunction}>Delete User
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default IndexPage
