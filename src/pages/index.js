import * as React from "react";
import * as SockJs from "sockjs-client";
import * as Stomp from "stompjs";
import {useEffect, useState} from "react";
import Button from "../components/Button";
import UserTable from "../components/UserTable";
// styles
const pageStyles = {
    color: "#232129",
    padding: 96,
    fontFamily: "-apple-system, Roboto, sans-serif, serif",
}

const APIPort = "https://poc-websocket-api.moreira.tech"

// markup
const IndexPage = () => {
    const [registerFunction, setRegisterFunction] = useState(() => () => "");
    const [deleteFunction, setDeleteFunction] = useState(() => () => "");
    const [userName, setUsername] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [userList, setUserList] = useState([]);
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
        const socket = new SockJs(APIPort+"/websocket", null, {transports: ["websocket"]});
        const stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/user/queue/register-user', function (ok) {
                console.log("User registered:" + ok.body)
            });
            stompClient.subscribe('/user/queue/delete-user', function (ok) {
                console.log("User deleted:" + ok.body)
            });
            stompClient.subscribe('/topic/user-event', consumeUserEvent);
        });
        setStompClient(stompClient);
        return function () {
            stompClient.disconnect();
        }
    }, []);

    useEffect(() => {
        setRegisterFunction(() => x => {
            stompClient.send("/app/register-user", {}, JSON.stringify({username: userName}));
        });
        setDeleteFunction(() => x => {
            stompClient.send("/app/delete-user", {}, JSON.stringify({username: userName}));
        })
    }, [userName, stompClient]);

    useEffect(() => {
        fetch(APIPort+"/list-user")
            .then(res => res.json())
            .then((result) => {
                    setUserList(result);
                },
                (error) => {
                    console.error(error)
                })
    }, []);

    return (
        <main style={pageStyles}>
            <title>User Administration</title>
            <UserTable data={userList}/>
            <div>
                <input id="user" type="text" onChange={(e) => setUsername(e.target.value)}/>
                <Button onClick={registerFunction}>Register User</Button>
                <Button onClick={deleteFunction}>Delete User</Button>
            </div>
        </main>
    )
}

export default IndexPage
