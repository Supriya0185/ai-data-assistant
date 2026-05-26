import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

const App: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
};

export default App;
