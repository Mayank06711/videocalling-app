import { useState, useEffect, useRef } from "react";
import { Socket } from "./socket/socket";
import UserList from "./components/User";
import VideoPlayer from "./components/Video";
import BottomBar from "./components/Bottom";

const Final = () => {
  const [myId, setMyId] = useState("");
  const [users, setUsers] = useState([]);
  const [callRunning, setCallRunning] = useState(false);
  const [show, setShow] = useState(true);
  const [dataC , setDataC]= useState();
  const [callFrom , setCallFrom] = useState();
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState("");

  const socket = useRef(null);
  const peer = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [callerVoiceStatus, setCallerVoiceStatus] = useState('');
  const [calleeVoiceStatus, setCalleeVoiceStatus] = useState('');
  const [recId, setRecId] = useState('');
  const [isReceiverOrCallerStatus, setisReceiverOrCallerStatus] = useState("Receiver");
  let myStream;

  // All the existing logic inside useEffect as well as other functions
  
  async function acceptCall() {
    try {
     console.log("trying to accept call");
     console.log(dataC);
     const { from, offer } = dataC;
     await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
     const answerOffer = await peer.current.createAnswer();
     await peer.current.setLocalDescription(
       new RTCSessionDescription(answerOffer)
     );
     Socket.emit("call:accepted", { answer: answerOffer, to: from });

      myStream = await navigator.mediaDevices.getUserMedia({
       video: true,
       audio: true,
     });
     myStream
       .getTracks()
       .forEach((track) => peer.current.addTrack(track, myStream));
     console.log("accepted call");
     setCallRunning(true);
     setCallFrom(from)
   } catch (error) {
     console.log(error);
   }
   }


 

 const rejectCall = () => {
   const { from } = dataC;
   const message = selectedMessage === 'custom' ? customMessage : selectedMessage;
   socket.current.emit('call:rejected', {  to:from, msg: message });
   setStatus('Call rejected');
 };


 useEffect(() => {
   // Initialize socket and peer connection
   socket.current = Socket;
 
   peer.current = new RTCPeerConnection({
     iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
   });
   


   socket.current.on("user-muted", (data) => {
     const { message, mutedBy } = data;
     console.log(message);

     // Update the status for the caller or callee based on who muted/unmuted
     if (mutedBy === myId){
       setCalleeVoiceStatus(message);
       //setTimeout(() => setCalleeVoiceStatus(''), 1000); // Hide "Unmuted" after 1 sec
     } else {
       setCallerVoiceStatus(message);
       setTimeout(() => setCallerVoiceStatus(''), 1000); // Hide "Unmuted" after 1 sec
     }
   });


   // this is completed:Done 
   socket.current.on("rejected", (data) => {
     const { message, rejectedBy } = data;
     setStatus(`Call was rejected by ${rejectedBy}: ${message}`);
     console.log(`Call was rejected by ${rejectedBy}: ${message}`);
     //alert(`Call was rejected by ${rejectedBy}: ${message}`);
   });


   // Function to capture and display local media
   const getLocalMedia = async () => {
     try {
       const myStream = await navigator.mediaDevices.getUserMedia({
         video: true,
         audio: true,
       });
 
       // Display local video
       if (localVideoRef.current) {
         localVideoRef.current.srcObject = myStream;
         localVideoRef.current.play().catch(err => console.log(err, "\n in playing loalvideo, line 114"));
         console.log(localVideoRef.current.play(), "local video")
       }
 
       // Add local tracks to the peer connection
       myStream.getTracks().forEach((track) => {
         peer.current.addTrack(track, myStream);
       });
     } catch (error) {
       console.error("Error accessing media devices:", error);
     }
   };
 
   // Capture local media when component mounts
   getLocalMedia();
 
   // Set up the ontrack handler for incoming remote media
   peer.current.ontrack = ({ streams: [stream] }) => {
     setStatus("Incoming Stream");
 
     // Set the incoming stream to the remote video element
     if (remoteVideoRef.current) {
       
       //from here to 
       if (remoteVideoRef.current.srcObject !== stream) {
         remoteVideoRef.current.srcObject = stream;
       }
       // Wait for the previous stream to stop before playing the new one
       remoteVideoRef.current.onloadedmetadata = () => {
         remoteVideoRef.current.play().catch((err) =>
           console.error("Error playing the remote stream: line 141", err)
       );
       //  here , before this code block all thing was working
       // remoteVideoRef.current.srcObject = stream;
       // remoteVideoRef.current.play();
     }
   };
   }

   // Socket event listeners
   socket.current.on("users:joined", (id) => {
     console.log(id, "id is useer ");
     setUsers((prevUsers) => [...prevUsers, id]);
   });
 
   socket.current.on('call:rejected', (data) => {
     console.log(data.message); // "Call was rejected by the recipient."
     setStatus('Call was rejected');
   });
 
   
   socket.current.on("incoming:answer", async (data) => {
     console.log("received call");
     setStatus("Incoming Answer");
     const { offer } = data;
     await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
   });
 

   //Done
   socket.current.on('call:hangup', () => {
     // Close the peer connection
     if (peer.current) {
       peer.current.close();
       peer.current = null;
     }
 
     // Stop the local video and audio streams
     if (myStream) {
       myStream.getTracks().forEach(track => track.stop());
       myStream = null;
     }

     
   // Ensure only the "Show Users" and "Hide Users" buttons are shown
     setCallRunning(false);
     setCallFrom(null); // Reset any incoming call info
     
     // Clear the remote video element
     if (remoteVideoRef.current) {
       remoteVideoRef.current.srcObject = null;
     }
 
     setStatus('Call ended by the other user');
     console.log("Call ended by the other user");
     setRecId("")
     setisReceiverOrCallerStatus("Receiver ")
   });
 

   socket.current.on("user:disconnect", (id) => {
     console.log(id, "id is disconnect");
     setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
   });
 

   socket.current.on("incoming:call", async (data) => {
     console.log("call coming", data);
     setStatus(`Incoming Call ${data.from}`);
     // setRecId(data.toWhome) 
     setisReceiverOrCallerStatus("Caller ")
     setRecId(data.from)
     setDataC(data);
     setCallFrom(data.from);
     setCallRunning(false);
   });
 


   socket.current.on("hello", ({ id }) => {
     console.log(id);
     setMyId(id);
   });
 

  

   // Clean up when component unmounts
   return () => {
     if (peer.current) {
       peer.current.ontrack = null;
       peer.current.close();
       peer.current = null;
     }
 
     if (socket.current) {
       socket.current.disconnect();
     }

     socket.current.off("rejected");
     socket.current.off("user-muted");
     socket.current.off('call:hangup');
   };
   
 }, []);
  

 const createCall = async (to) => {
   setStatus(`Calling ${to}`);
   setRecId(to);
   console.log("calling started");
   setCallRunning(true);
   
   // this is for test
   myStream = await navigator.mediaDevices.getUserMedia({
     video: true,
     audio: true,
   });
   myStream
     .getTracks()
     .forEach((track) => peer.current.addTrack(track, myStream));
   
   // above is for test

   const localOffer = await peer.current.createOffer();
   await peer.current.setLocalDescription(
     new RTCSessionDescription(localOffer)
   );
   socket.current.emit("outgoing:call", { fromOffer: localOffer, to });
 };
 

 const toggleMute = () => {
   setMuted((prevMuted) => {
     const newMute = !prevMuted;
     socket.current.emit("mute", { isMuted: newMute, mutedTo: recId });
     return newMute;
   });
 };

 
 const hangUpCall = () => {
   // Notify the other user about the call hangup
   socket.current.emit('call:hangup', { to: callFrom });
 
   // Close the peer connection
   if (peer.current) {
     peer.current.close();
     peer.current = null;
   }

   setCallRunning(false)
   setCallFrom(null)
 
   // Stop the local video and audio streams
   if (myStream) {
     myStream.getTracks().map(track => track.stop());
     myStream = null;
   }
 
   // Clear the remote video element
   remoteVideoRef.current.srcObject = null;
 
   // Update the UI (e.g., reset the status, hide the video elements, etc.)
   setStatus('Call ended');
   setRecId("")
   setisReceiverOrCallerStatus("Receiver ")
   console.log("call ended");
 };



  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-5">
        <div className="flex gap-5">
         
          {show && <UserList users={users} createCall={createCall} />}
          <div className="bg-gray-200 border border-gray-200 rounded-md">
            <VideoPlayer videoRef={localVideoRef} title={`Your Id: ${myId}`} statusMessage={calleeVoiceStatus} color={"green"}/>
            <VideoPlayer videoRef={remoteVideoRef} title={`${isReceiverOrCallerStatus} Id ${recId}`} statusMessage={callerVoiceStatus} color={"blue"} />
            <p id="status" className="text-center text-cyan-800">{status}</p>
          </div>

        </div>
      </div>

      <BottomBar
        show={show}
        setShow={setShow}
        callRunning={callRunning}
        toggleMute={toggleMute}
        hangUpCall={hangUpCall}
        muted={muted}
        callFrom={callFrom}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
      />
    </div>
  );
};

export default Final;
