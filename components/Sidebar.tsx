
import React from 'react';
import { ChatSession } from '../types';
import { PlusIcon, HistoryIcon, MenuIcon } from './Icons';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  setIsOpen
}) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0 overflow-hidden'} flex-shrink-0 bg-[#1e1f20] flex flex-col transition-all duration-300 ease-in-out h-full border-r border-[#333537]`}>
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-[#333537] rounded-full text-white"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="px-3 mb-6">
        <button 
          onClick={onNewChat}
          className="flex items-center gap-3 w-full p-4 bg-[#282a2c] hover:bg-[#333537] rounded-full text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        <h3 className="text-xs font-semibold text-gray-400 px-4 mb-2 mt-4 uppercase tracking-wider">Recent</h3>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm text-left truncate transition-colors ${
              currentSessionId === session.id 
                ? 'bg-[#333537] text-white' 
                : 'text-gray-300 hover:bg-[#282a2c]'
            }`}
          >
            <HistoryIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{session.title || 'Untitled Chat'}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No recent chats
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#333537] space-y-1">
        <button className="flex items-center gap-3 w-full p-3 rounded-lg text-sm text-gray-300 hover:bg-[#282a2c]">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Help</span>
        </button>
        <button className="flex items-center gap-3 w-full p-3 rounded-lg text-sm text-gray-300 hover:bg-[#282a2c]">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
