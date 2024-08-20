import React from 'react';
 // eslint-disable-next-line react/prop-types
const VideoPlayer = ({ videoRef, title, statusMessage, color }) => {
  console.log(videoRef, "Video")
  return (
    <div className="h-80 w-80">
      <h3 className="text-xl text-black font-semibold">{title}</h3>
      {videoRef && <video ref={videoRef} style={{borderColor: `${color}`, borderStyle: "solid", borderRadius: "0.375rem",  borderWidth: "4px",}}  controls autoPlay/>}
      {statusMessage && <p className="text-center text-red-600 mt-2">{statusMessage}</p>}
    </div>
  );
};

export default VideoPlayer;
