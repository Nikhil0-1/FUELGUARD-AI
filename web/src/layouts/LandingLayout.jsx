import React from 'react';
import { Outlet } from 'react-router-dom';

export const LandingLayout = () => {
  return (
    <div className="min-h-screen bg-russian-white flex flex-col">
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};
