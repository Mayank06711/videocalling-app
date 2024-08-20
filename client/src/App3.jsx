import { useState, useEffect, useRef, useCallback } from "react";
import Button from "@mui/material/Button";
import UserList from "./components/User";
import VideoPlayer from "./components/Video";
import { io } from "socket.io-client";
import Peer from "./service/peer";
import ReactPlayer from "react-player";
const App3 = () => {
    const [myStream1, setMyStream1] = useState() // har jagah ye rhega
    const [remoteStream1, setRemoteStream1] = useState() // keval ek jagah ye aaega dusre ka 
  
    
    const sendStreams = useCallback(() => {
        for (const track of myStream1.getTracks()) {
          Peer.peer.addTrack(track, myStream1);
        }
      }, [myStream1]);
    
    return <div>

    </div>
}


export default App3;