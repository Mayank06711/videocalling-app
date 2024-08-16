import React, { useState } from 'react';
import Button from '@mui/material/Button';

// eslint-disable-next-line no-unused-vars, react/prop-types
const CallActions = ({ callFrom, acceptCall, rejectCall }) => {
  const [selectedMessage, setSelectedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  return (
    <>
      <div className="flex gap-2 items-center">
        <select
          value={selectedMessage}
          onChange={(e) => setSelectedMessage(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="" disabled>Select a reason to reject</option>
          <option value="I will call you later">I will call you later</option>
          <option value="Busy">Busy</option>
          <option value="Cannot talk now">Cannot talk now</option>
          <option value="custom">Custom message</option>
        </select>

        {selectedMessage === 'custom' && (
          <input
            type="text"
            placeholder="Enter your custom message"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          />
        )}
      </div>
      <Button variant="contained" onClick={acceptCall}>
        Accept
      </Button>
      <Button
        variant="contained"
        onClick={rejectCall}
        disabled={!selectedMessage || (selectedMessage === 'custom' && !customMessage)}
      >
        Reject
      </Button>
    </>
  );
};

export default CallActions;
