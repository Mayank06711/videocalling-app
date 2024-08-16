import React from 'react';
import Button from '@mui/material/Button';

// eslint-disable-next-line react/prop-types
const UserList = ({ users = [], createCall }) => {
  return (
    <div id="users" className="flex flex-col gap-2 p-5 border rounded-md border-red-500 w-[30vw]">
      <h3 className="text-center text-black font-semibold">Online Users (click to connect)</h3>
      {users.map((user) => (
        <Button variant="contained" key={user} onClick={() => createCall(user)}>
          {"==>Call  " + user}
        </Button>
      ))}
    </div>
  );
};

export default UserList;
