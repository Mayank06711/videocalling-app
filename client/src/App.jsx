// import { useState, useEffect, useRef } from "react";

// import { Socket } from "./socket/socket";

// const App = () => {

//   const [myId, setMyId] = useState("");

//   const [status, setStatus] = useState("");

//   const [users, setUsers] = useState([]);

//   const [accept, setAccept] = useState({})

//   const socket = useRef(null);

//   const peer = useRef(null);

//   const localVideoRef = useRef(null);

//   const remoteVideoRef = useRef(null);

//   useEffect(() => {
//     socket.current = Socket;

//     if (!peer.current) {
//       peer.current = new RTCPeerConnection({
//         iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
//       });
//     }

//     const handleIncomingStream = async ({ streams: [stream] }) => {
//       setStatus("Incoming Stream");
//       console.log(stream, "stream");
//       remoteVideoRef.current.srcObject = stream;

//       remoteVideoRef.current.play();

//       const myStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//       });

//       myStream
//         .getTracks()
//         .forEach((track) => peer.current.addTrack(track, myStream));
//     };

    
//     peer.current.ontrack = handleIncomingStream;

//     socket.current.on("users:joined", (id) => {
//       //console.log(id, "users:joined id");

//       setUsers((prevUsers) => {
//         //console.log(prevUsers);

//         // Check if the user is already in the list (avoid duplicates)
//         const isUserExists = prevUsers.includes(id);

//         // If the id is not in the list, add it; otherwise, return the previous list
//         if (!isUserExists) {
//           return [...prevUsers, id];
//         } else {
//           return prevUsers;
//         }
//       });
//     });




    
//     socket.current.on("incoming:answer", async (data) => {
//       setStatus("Incoming Answer");

//       console.log("hii incoming answer data", data);

//       const { answer } = data;

//       try {
//         // Ensure peer connection is in the correct state
//         if (peer.current.signalingState === "have-local-offer") {
//           // Set the remote description with the answer
//           await peer.current.setRemoteDescription(
//             new RTCSessionDescription(answer)
//           );
//         } else {
//           console.warn(
//             "RTCPeerConnection is not in the correct state. Signaling state:",
//             peer.current.signalingState
//           );
//         }
//       } catch (error) {
//         console.error("Error setting remote description:", error.message);
//       }
//     });


//     socket.current.on("user:disconnect", (id) => {
//       //console.log(id, "id is disconnect")
//       setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
//     });




//     // Create a new peer connection for each incoming call
//     socket.current.on("incoming:call", async (data) => {
//       setStatus(`Incoming Call From: ${data.from}`);

//       const { from, offer } = data;
//       //console.log("hii incoming call data", data);

//       try {
//         // Create a new RTCPeerConnection instance
//         const newPeerConnection = new RTCPeerConnection();

//         // Set the new peer connection as the current one
//         peer.current = newPeerConnection;

//         // Set remote description
//         await peer.current.setRemoteDescription(
//           new RTCSessionDescription(offer)
//         );

//         // Create and set the answer
//         const answerOffer = await peer.current.createAnswer();

//         await peer.current.setLocalDescription(
//           new RTCSessionDescription(answerOffer)
//         );

//         // Send the answer back to the caller
//         setAccept({answer: answerOffer, from: from})
//         //socket.current.emit("call:accepted", { answer: answerOffer, to: from });

//         // Get user media and add tracks to peer connection
//         const myStream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });

//         myStream
//           .getTracks()
//           .forEach((track) =>{ peer.current.addTrack(track, myStream)});
//       } catch (error) {
//         console.error("Error during the call setup:", error);
//       }
//     });


//     socket.current.on("hello", ({ id }) => {
//       console.log("id",id, "myid",myId);
//       setMyId(id);
//     });

//     // console.log("myid" ,myId)

//     const getAndUpdateUsers = async () => {
//       const response = await fetch("http://localhost:5000/users", {
//         method: "GET",
//       });

//       const jsonResponse = await response.json();

//       console.log("json", jsonResponse[0]);

//       setUsers(
//         jsonResponse.map((user) => {
//           console.log(user, "<-user: myid ->", myId);
//           if (user !== myId) return user;
//         })
//       );
//     };


//     const getUserMedia = async () => {
//       try {
//         const userMedia = await navigator.mediaDevices.getUserMedia({
//           video: true,
//         });

//         //console.log("usermedia", userMedia);

//         // Assign the stream to the video element
//         localVideoRef.current.srcObject = userMedia;

//         // Wait until the stream is fully set before calling play
//         localVideoRef.current.onloadedmetadata = () => {
//           localVideoRef.current.play();
//         };
//       } catch (error) {
//         console.error("Error accessing user media:", error);
//       }
//     };


   

//     getAndUpdateUsers();

//     getUserMedia();

//     return () => {
//       // socket.current.disconnect();
//     };
//   }, []);
 

  

//   const acceptCall = async () => {
//     if (accept.from && accept.answer) {
//       socket.current.emit("call:accepted", { accept });
//       setStatus("Call Accepted");

//       // Set up a listener for the incoming:answer event after the call is accepted
//       // socket.current.on("incoming:answer", async (data) => {
//       //   setStatus("Incoming Answer");

//       //   const { answer } = data;
//       //   console.log(data, "answer:", answer)
//       //   try {
//       //     if (peer.current.signalingState === "have-local-offer") {
//       //       await peer.current.setRemoteDescription(new RTCSessionDescription(answer));
//       //     } else {
//       //       console.warn("RTCPeerConnection is not in the correct state. Signaling state:", peer.current.signalingState);
//       //     }
//       //   } catch (error) {
//       //     console.error("Error setting remote description:", error.message);
//       //   }
//       // });

//       setAccept({});
//     }
//   };

//   const createCall = async (to) => {
//     setStatus(`Calling ${to}`);

//     const localOffer = await peer.current.createOffer();

//     await peer.current.setLocalDescription(
//       new RTCSessionDescription(localOffer)
//     );

//     socket.current.emit("outgoing:call", { fromOffer: localOffer, to });
//   };




//   return (
//     <div>
//       <h2 className=" m-4 text-red-900 text-3xl font-semibold ">
//         Your Id : <span className=" text-blue-600 text-2xl "> {myId} </span>
//       </h2>
//       <h3 className=" m-4 text-center text-black-500 text-4xl font-bold">
//         Online Users (click to connect)
//       </h3>

//       <div id="users" className="text-center">
//         <table className="table-auto mx-auto border-collapse border border-gray-200">
//           <thead>
//             <tr>
//               <th className="border border-gray-300 px-4 py-2">User ID</th>
//               <th className="border border-gray-300 px-4 py-2">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {users.map((user) => (
//               <tr key={user}>
//                 <td className="border border-gray-300 px-4 py-2">{user}</td>
//                 <td className="border border-gray-300 px-4 py-2">
//                   <button
//                     className="bg-blue-500 text-white px-4 py-2 rounded"
//                     onClick={() => createCall(user)}
//                   >
//                     Call {user}
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="flex p-4 space-x-4">
//       <video 
//        ref={localVideoRef} 
//        id="local-video" 
//       className="w-80 h-80 object-cover border-2 border-gray-300" 
//      />
//      <video 
//        ref={remoteVideoRef} 
//        id="remote-video" 
//        className="w-80 h-80 object-cover border-2 border-gray-300" 
//      />
//    </div>
//       <p id="status">{status}</p>
//       <div>
//       {accept.answer && (
//         <div>
//           <button
//             className="bg-blue-500 text-white px-4 py-2 rounded"
//             onClick={acceptCall}
//           >
//             Accept Call
//           </button>
//         </div>
//       )}
//     </div>
//     </div>
   
//   );

// };

// export default App;






import { useState, useEffect, useRef } from "react";
import { Socket } from "./socket/socket";
import Button from "@mui/material/Button";
const App = () => {
  const [myId, setMyId] = useState("");
  const [recId, setRecId] = useState("")
  const [status, setStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [muted, setMuted] = useState(true);
  const [callRunning, setCallRunning] = useState(false);
  const socket = useRef(null);
  const peer = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [show, setShow] = useState(true);
  const [dataC , setDataC]= useState();
  const [callFrom , setCallFrom] = useState();

  

  let myStream;
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
    const { from } = dataC; // Assuming `dataC` contains the caller's information
    socket.current.emit('call:rejected', { to: from });
    console.log("Call rejected");
};

  useEffect(() => {
    socket.current = Socket;

    peer.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.stunprotocol.org" }],
    });

    const handleIncomingStream = async ({ streams: [stream] }) => {
      setStatus("Incoming Stream");
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play();

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      myStream
        .getTracks()
        .forEach((track) => peer.current.addTrack(track, myStream));
    };

    peer.current.ontrack = handleIncomingStream;

    socket.current.on("users:joined", (id) => {
      console.log(id, "id is useer ");
      setUsers((prevUsers) => [prevUsers, id]);
    });
 

    socket.current.on('call:rejected', (data) => {
      console.log(data.message); // "Call was rejected by the recipient."
      setStatus('Call was rejected');
  });

    socket.current.on("incoming:answer", async (data) => {
      console.log("recieved call");
      setStatus("Incoming Answer");
      console.log("hii", data);
      const { offer } = data;
      await peer.current.setRemoteDescription(new RTCSessionDescription(offer));
    });



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
      setCallRunning(false)
      // Clear the remote video element
      remoteVideoRef.current.srcObject = null;
    
      // Update the UI
      setStatus('Call ended by the other user');
      console.log("call ended by the other user");
    });

    socket.current.on("user:disconnect", (id) => {
      console.log(id, "id is disconnect");
      setUsers((prevUsers) => prevUsers.filter((userId) => userId !== id));
    });

    socket.current.on("incoming:call", async (data) => {
      console.log("call coming");
      setStatus(`Incoming Call ${data}`);
      console.log("hii", data);
      setDataC(data);
      setCallRunning(false);
    });

    socket.current.on("hello", ({ id }) => {
      console.log(id);
      setMyId(id);
    });

    // const getAndUpdateUsers = async () => {
    //   const response = await fetch("/users", { method: "GET" });
    //   const jsonResponse = await response.json();
    //   setUsers(jsonResponse.map((user) => user[0]));
    // };

    const getUserMedia = async () => {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("usermedia", userMedia);
      localVideoRef.current.srcObject = userMedia;
      localVideoRef.current.play();
    };

    //  getAndUpdateUsers();
    getUserMedia();

    return () => {
      // socket.current.disconnect();
    };
  }, []);

  const createCall = async (to) => {
    setStatus(`Calling ${to}`);
    setRecId(to);
    console.log("calling started");
    setCallRunning(true);
    const localOffer = await peer.current.createOffer();
    await peer.current.setLocalDescription(
      new RTCSessionDescription(localOffer)
    );
    socket.current.emit("outgoing:call", { fromOffer: localOffer, to });
  };

  const toggleMute = () => {
    setMuted(!muted);

    // Emit mute/unmute event
    socket.current.emit("mute", { isMuted: muted });
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
    console.log("call ended");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow p-5">
        <div className="flex gap-5">
          <>
            {show && (
              <div
                id="users"
                className="flex flex-col gap-2 p-5 border rounded-md border-red-500 w-[30vw]"
              >
              <h3 className=" text-center text-black font-semibold">Online Users (click to connect)</h3>
              
                {users.map((user) => (
                  <Button
                    variant="contained"
                    key={user}
                    onClick={() => createCall(user)}
                  >
                    {"==>Call  " + user}
                  </Button>
                ))}
              </div>
            )}
          </>

          <div className="bg-gray-200 border border-gray-200 rounded-md">
            <div className=" h-80 w-80 ">
              <h3 className=" text-xl text-black font-semibold ">
                Your Id: <span className=" text-green-800 ">{myId}</span>
              </h3>
              <video
                ref={localVideoRef}
                id="local-video"
                className="rounded-md border-4  border-green-400"
              />
            </div>

            <div className="h-80 w-80"> 
              <h3 className=" text-xl text-black font-semibold">Receiver Id {recId} </h3>
              <video
                ref={remoteVideoRef}
                id="remote-video"
                className="rounded-md border-4 border-blue-400"
              />
            </div>

            <p id="status" className=" text-center text-cyan-800 ">{status}</p>
          </div>
        </div>
      </div>
      {callRunning ? (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>

          <Button
            variant="contained"
            onClick={() => socket.current.disconnect()}
          >
            Disconnect
          </Button>

          <Button variant="contained" onClick={toggleMute}>
            {muted ? "Unmute" : "Mute"}
          </Button>

          <Button
            variant="contained"
            onClick={hangUpCall}
          >
            Hang Up
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
          <Button variant="contained" onClick={() => setShow(true)}>
            Show Users
          </Button>

          <Button variant="contained" onClick={() => setShow(false)}>
            Hide Users
          </Button>

          <Button variant="contained" onClick={acceptCall}>
            Accept
          </Button>

          <Button
            variant="contained"
            onClick={rejectCall}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

export default App;