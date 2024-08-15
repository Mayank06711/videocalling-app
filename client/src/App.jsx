import { useState, useEffect, useRef } from "react";
import { Socket} from "./socket/socket"
const App = () => {
  const [myId, setMyId] = useState("");
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState([]);
  const socket = useRef(null);
  const peer = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    socket.current = Socket

    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    const handleIncomingStream = async ({ streams: [stream] }) => {
      setStatus("Incoming Stream");
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play();

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
    };

    peer.current.ontrack = handleIncomingStream;

    socket.current.on("users:joined", (id) => {
      console.log(id, "id is useer ")
      setUsers((prevUsers) => [...prevUsers, id]);
    });

    socket.current.on("incoming:answer", async (data) => {
      setStatus("Incoming Answer");
      console.log("hii", data)
      const { offer } = data;
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
    });

    socket.current.on("user:disconnect", (id) => {
      console.log(id, "id is disconnect")
      setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
    });

    socket.current.on("incoming:call", async (data) => {
      setStatus(`Incoming Call ${data}`);
      const { from, offer } = data;
      console.log("hii", data)
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));

      const answerOffer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(
        new RTCSessionDescription(answerOffer)
      );
      socket.current.emit("call:accepted", { answer: answerOffer, to: from });

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
    });

    socket.current.on("hello", ({ id }) =>{ console.log(id) ; setMyId(id)});

    const getAndUpdateUsers = async () => {
      const response = await fetch("/users", { method: "GET" });
      const jsonResponse = await response.json();
      setUsers(jsonResponse.map((user) => user[0]));
    };

    const getUserMedia = async () => {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      console.log("usermedia",userMedia);
      localVideoRef.current.srcObject = userMedia;
      localVideoRef.current.play();
    };

    getAndUpdateUsers();
    getUserMedia();

    return () => {
      // socket.current.disconnect();
    };
  }, []);

  const createCall = async (to) => {
    setStatus(`Calling ${to}`);
    const localOffer = await peer.current.createOffer();
    await peer.current.setLocalDescription(
      new RTCSessionDescription(localOffer)
    );
    socket.current.emit("outgoing:call", { fromOffer: localOffer, to });
  };

  return (
    <div>
      <h3>
        Your Id: <span>{myId}</span>
      </h3>
      <h3>Online Users (click to connect)</h3>
      <div id="users" className=" text-center">
        {users.map((user) => (
          <div key={user}>
            <button onClick={() => createCall(user)}>{user.replace(user, user+ " call Him")}</button>
            <br />
            <br />
            <hr />  
          </div>
        ))}
      </div>
      <video ref={localVideoRef} id="local-video" />
      <video ref={remoteVideoRef} id="remote-video" />
      <p id="status">{status}</p>
    </div>
  );
};

export default App;