import React from 'react';
import ReactPlayer from "react-player"
 // eslint-disable-next-line react/prop-types
const VideoPlayer = ({ videoRef, title, statusMessage, color }) => {
  console.log(videoRef, "Video")
  return (
    <div className="h-80 w-80">
      <h3 className="text-xl text-black font-semibold">{title}</h3>
      {videoRef && <video ref={videoRef} className={`rounded-md border-4 border-${color}-400`} />}
      {statusMessage && <p className="text-center text-red-600 mt-2">{statusMessage}</p>}
    </div>
  );
};

export default VideoPlayer;
