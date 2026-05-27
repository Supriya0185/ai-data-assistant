import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

const App: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
};

export default App;
