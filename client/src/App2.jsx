import { useState, useEffect, useRef, useCallback } from "react";
import Button from "@mui/material/Button";
import UserList from "./components/User";
import VideoPlayer from "./components/Video";
import { io } from "socket.io-client";

const App2 = () => {
  const [myId, setMyId] = useState("");
  const [recId, setRecId] = useState("");
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [callRunning, setCallRunning] = useState(false);
  const socket = useRef(null);
  const peer = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [show, setShow] = useState(true);
  const [dataC, setDataC] = useState();
  const [callFrom, setCallFrom] = useState();
  const [selectedMessage, setSelectedMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [callerVoiceStatus, setCallerVoiceStatus] = useState("");
  const [calleeVoiceStatus, setCalleeVoiceStatus] = useState("");
  const [isReceiverOrCallerStatus, setisReceiverOrCallerStatus] =useState("Receiver");
  const [connected, setConected] = useState(false);
  const [userName, setUserName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [myStream1, setMyStream1] = useState() // har jagah ye rhega
  const [remoteStream1, setRemoteStream1] = useState() // keval ek jagah ye aaega dusre ka 


  
  let myStream;


  const sendStreams = useCallback(() => {
    for (const track of myStream1.getTracks()) {
      peer.current.addTrack(track, myStream1);
    }
  }, [myStream1]);



  const handleCall = useCallback(async () => {
    try {
      console.log("trying to accept call");
      console.log(dataC);
      const { from, offer } = dataC;
  
      // Set the remote description with the offer received from the caller
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
  
      // Create an answer and set the local description
      const answerOffer = await peer.current.createAnswer();
      await peer.current.setLocalDescription(new RTCSessionDescription(answerOffer));
  
      // Emit the call accepted event to the server
      socket.current.emit("call:accepted", { answer: answerOffer, to: from });
  
      // Get the user's media stream (just for audio or video if needed)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, // You can set this to `false` if you only want to accept audio
        audio: true,
      });
  
      // Add tracks from the stream to the peer connection
      stream.getTracks().forEach((track) => peer.current.addTrack(track, stream));
      
      setRemoteStream1(stream);

      // Set the incoming stream to the remote video element
      peer.current.ontrack = ({ streams: [remoteStream] }) => {
        if (remoteVideoRef.current) {
          console.log("Remote video", remoteStream)
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current
            .play()
            .catch((err) =>
              console.error("Error playing the remote stream", err)
            );
        }
      };
  
      setCallRunning(true);
      setCallFrom(from);
      setRemoteStream1(stream);
    } catch (error) {
      console.log(error);
    }
  }, [dataC]);
  

   
  const callingAccept = ()=>{
    handleCall(); 
  }


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
      socket.current.emit("call:accepted", { answer: answerOffer, to: from });

      myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
      console.log("accepted call");
      setCallRunning(true);
      setCallFrom(from);
    } catch (error) {
      console.log(error);
    }
  }









  const rejectCall = () => {
    const { from } = dataC;
    const message =
    selectedMessage === "custom" ? customMessage : selectedMessage;
    socket.current.emit("call:rejected", { to: from, msg: message });
    setStatus("Call rejected");
  };



   // Function to handle the incoming stream
const handleIncomingStream = (stream, remoteVideoRef) => {
  console.log("Incoming Stream", stream, remoteVideoRef.current);

  if (stream) {
    logExistingTracks(stream);
    attachTrackAddedListener(stream);
  }

  setRemoteVideoStream(remoteVideoRef, stream);
}

// Function to log existing tracks in the stream
const logExistingTracks = (stream) => {
  console.log("Incoming Streams xtc", stream.length)
  stream.getTracks().forEach(track => {
    console.log("Existing track:", track);
  });
}

// Function to attach a listener for added tracks
const attachTrackAddedListener = (stream) => {
  stream.onaddtrack = (event) => {
    console.log("Track added:", event.track);
  }
}

// Function to set the remote video element's stream
const setRemoteVideoStream = (remoteVideoRef, stream) => {
  if (remoteVideoRef.current && stream) {
    if (remoteVideoRef.current.srcObject !== stream) {
      remoteVideoRef.current.srcObject = stream;
    }
    
    remoteVideoRef.current.onloadedmetadata = () => {
      remoteVideoRef.current
        .play()
        .catch((err) =>
          console.error("Error playing the remote stream: line 141", err)
        );
    };
  }
}






  useEffect(() => {
    // Initialize socket and peer connection
    if (connected && userName) {


    socket.current = io('http://localhost:5000', {
            query: { userName: userName }, // Send the name as a query parameter
    });
    
    

    socket.current.on('updateUserList', (users) => {
            setOnlineUsers(users);
    });

      if (!peer.current) {
        peer.current = new RTCPeerConnection({
          iceServers: [
            {
              urls: [
                "stun:stun.l.google.com:19302",
                "stun:global.stun.twilio.com:3478",
              ],
            },
          ],
        });
      }

      socket.current.on("user-muted", (data) => {
        const { message, mutedBy } = data;
        console.log(message);

        // Update the status for the caller or callee based on who muted/unmuted
        if (mutedBy === myId) {
          setCalleeVoiceStatus(message);
          //setTimeout(() => setCalleeVoiceStatus(''), 1000); // Hide "Unmuted" after 1 sec
        } else {
          setCallerVoiceStatus(message);
          setTimeout(() => setCallerVoiceStatus(""), 1000); // Hide "Unmuted" after 1 sec
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
            localVideoRef.current
              .play()
              .catch((err) =>
                console.log(err, "\n in playing loalvideo, line 114")
              );
            console.log(localVideoRef.current.play(), "local video");
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

    //  // Set up the ontrack handler for incoming remote media
    //   peer.current.ontrack = ({ streams: [stream] }) => {
    //     setStatus("Incoming Stream");
    //     console.log("Incoming Stream", stream, remoteVideoRef.current);
    //     if (stream) {
    //       stream.getTracks().forEach(track => {
    //      console.log("Existing track:", track);
    // });
    //       stream.onaddtrack = (event) => {
    //         console.log("Track added:", event.track);
    //     }
    //   }
    //     // Set the incoming stream to the remote video element
    //     if (remoteVideoRef.current && stream) {
    //       //from here to
    //       if (remoteVideoRef.current.srcObject !== stream) {
    //         remoteVideoRef.current.srcObject = stream;
    //       }
    //       // Wait for the previous stream to stop before playing the new one
    //       remoteVideoRef.current.onloadedmetadata = () => {
    //         remoteVideoRef.current
    //           .play()
    //           .catch((err) =>
    //             console.error("Error playing the remote stream: line 141", err)
    //           );
    //         //  here , before this code block all thing was working
    //         // remoteVideoRef.current.srcObject = stream;
    //         // remoteVideoRef.current.play();
    //       };
         
    //     }
    //   };


    // Event handler for the ontrack event
peer.current.ontrack = ({ streams: [stream] }) => {
  setStatus("Incoming Stream");
  handleIncomingStream(stream, remoteVideoRef);
};

      
      



      // Socket event listeners
      socket.current.on("users:joined", (id) => {
        console.log(id, "id is useer ");
        setUsers((prevUsers) => [...prevUsers, id]);
      });

      socket.current.on("call:rejected", (data) => {
        console.log(data.message); // "Call was rejected by the recipient."
        setStatus("Call was rejected");
      });

      socket.current.on("incoming:answer", async (data) => {
        console.log("received call");
        setStatus("Incoming Answer");
        const { offer } = data;
        await peer.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
      });

      //Done
      socket.current.on("call:hangup", () => {
        // Close the peer connection
        if (peer.current) {
          peer.current.close();
          peer.current = null;
        }

        // Stop the local video and audio streams
        if (myStream) {
          myStream.getTracks().forEach((track) => track.stop());
          myStream = null;
        }

        // Ensure only the "Show Users" and "Hide Users" buttons are shown
        setCallRunning(false);
        setCallFrom(null); // Reset any incoming call info

        // Clear the remote video element
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }

        setStatus("Call ended by the other user");
        console.log("Call ended by the other user");
        setRecId("");
        setisReceiverOrCallerStatus("Receiver ");
      });

      socket.current.on("user:disconnect", (id) => {
        console.log(id, "id is disconnect");
        setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
      });

      socket.current.on("incoming:call", async (data) => {
        console.log("call coming", data);
        setStatus(`Incoming Call ${data.from}`);
        // setRecId(data.toWhome)
        setisReceiverOrCallerStatus("Caller ");
        setRecId(data.from);
        setDataC(data); //  data has from toWhome and offfer
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
        socket.current.off("call:hangup");
      };
    }
  }, [connected]);


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
    socket.current.emit("call:hangup", { to: callFrom });

    // Close the peer connection
    if (peer.current) {
      peer.current.close();
      peer.current = null;
    }

    setCallRunning(false);
    setCallFrom(null);

    // Stop the local video and audio streams
    if (myStream) {
      myStream.getTracks().map((track) => track.stop());
      myStream = null;
    }

    // Clear the remote video element
    remoteVideoRef.current.srcObject = null;

    // Update the UI (e.g., reset the status, hide the video elements, etc.)
    setStatus("Call ended");
    setRecId("");
    setisReceiverOrCallerStatus("Receiver ");
    console.log("call ended");
  };


  console.log(muted, "Call mutes");

  const handleSubmit = (e)=>{
    e.preventDefault();
    setConected(true);
  }

  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-5">
        <div className="flex gap-5">
          <>    
            {/* {show && <UserList users={users} createCall={createCall} />} */}
            {
                !connected ?
                <div className="flex justify-center items">
                <form 
                  onSubmit={handleSubmit} 
                  className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
                >
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Enter your UserName to connect:
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500 transition duration-200"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
                  >
                    Connect
                  </button>
                </form>
              </div> :<UserList users={onlineUsers} createCall={createCall} />
            }
          </>

          <div className="bg-gray-200 border border-gray-200 rounded-md">
            <VideoPlayer
              videoRef={localVideoRef}
              title={`Your Id: ${myId}`}
              statusMessage={calleeVoiceStatus}
              color={"green"}
            />
            {remoteVideoRef && <VideoPlayer
              videoRef={remoteVideoRef}
              title={`${isReceiverOrCallerStatus} Id ${recId}`}
              statusMessage={callerVoiceStatus}
              color={"blue"}
            />}
            <p id="status" className="text-center text-cyan-800">
              {status}
            </p>
          </div>
        </div>
      </div>

      {callRunning || callFrom ? (
        
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>

          {callRunning && (
            <>
              <Button
                variant="contained"
                onClick={() => socket.current.disconnect()}
              >
                Disconnect
              </Button>

              <Button variant="contained" onClick={toggleMute}>
                {muted ? "UnMute" : "Mute"}
              </Button>

              <Button variant="contained" onClick={hangUpCall}>
                Hang Up
              </Button>
            </>
          )}

          {!callRunning && callFrom && (
            <>
              <div className="flex gap-2 items-center">
                <select
                  value={selectedMessage}
                  onChange={(e) => setSelectedMessage(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>
                    Select a reason to reject
                  </option>
                  <option value="I will call you later">
                    I will call you later
                  </option>
                  <option value="Busy">Busy</option>
                  <option value="Cannot talk now">Cannot talk now</option>
                  <option value="custom">Custom message</option>
                </select>

                {selectedMessage === "custom" && (
                  <input
                    type="text"
                    placeholder="Enter your custom message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
              <Button variant="contained" onClick={callingAccept}>
                Accept
              </Button>
              <Button
                variant="contained"
                onClick={rejectCall}
                disabled={
                  !selectedMessage ||
                  (selectedMessage === "custom" && !customMessage)
                }
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ) 
      : 
      (

        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>
        </div>
      
      )}
    </div>
  );
};

export default App2;
