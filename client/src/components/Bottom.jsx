import React from 'react';
import Button from '@mui/material/Button';
import CallActions from './Call';
// eslint-disable-next-line no-unused-vars, react/prop-types
const BottomBar = ({ show, setShow, callRunning, toggleMute, hangUpCall, muted, callFrom, acceptCall, rejectCall }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-3 flex justify-center gap-4">
      <Button variant="contained" onClick={() => setShow(true)}>Show Users</Button>
      <Button variant="contained" onClick={() => setShow(false)}>Hide Users</Button>

      {callRunning && (
        <>
          <Button variant="contained" onClick={toggleMute}>
            {muted ? "Unmute" : "Mute"}
          </Button>
          <Button variant="contained" onClick={hangUpCall}>
            Hang Up
          </Button>
        </>
      )}

      {!callRunning && callFrom && (
        <CallActions
          callFrom={callFrom}
          acceptCall={acceptCall}
          rejectCall={rejectCall}
        />
      )}
    </div>
  );
};

export default BottomBar;
