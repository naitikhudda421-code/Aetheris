
import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { LogoIcon, ExternalLinkIcon } from './Icons';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-12 md:px-24 py-8 space-y-10">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-red-500 rounded-2xl flex items-center justify-center animate-pulse">
            <LogoIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-semibold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Hello, how can I help you today?
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {[
              "Plan a 3-day trip to Tokyo",
              "Write code for a landing page",
              "Explain quantum computing",
              "Help me summarize this article"
            ].map((hint, idx) => (
              <button 
                key={idx}
                className="p-4 bg-[#1e1f20] border border-[#333537] rounded-xl text-left text-sm text-gray-300 hover:bg-[#282a2c] transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 sm:gap-6 animate-fade-in ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === Role.USER ? 'bg-[#333537]' : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              {msg.role === Role.USER ? (
                <span className="text-xs font-bold text-white">ME</span>
              ) : (
                <LogoIcon className="w-5 h-5 text-white" />
              )}
            </div>
            
            <div className={`flex flex-col max-w-[85%] space-y-2 ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                msg.role === Role.USER ? 'bg-[#282a2c] text-white' : 'text-gray-200'
              }`}>
                {msg.parts.map((part, i) => (
                  <React.Fragment key={i}>
                    {part.text && <span>{part.text}</span>}
                    {part.inlineData && (
                      <div className="mt-4">
                        <img 
                          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                          alt="Uploaded content" 
                          className="max-w-full rounded-lg border border-[#333537]"
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {msg.groundingSources && msg.groundingSources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {msg.groundingSources.slice(0, 4).map((source, i) => (
                    <a 
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1f20] border border-[#333537] rounded-full text-xs text-blue-400 hover:bg-[#333537] transition-colors max-w-[200px]"
                    >
                      <span className="truncate">{source.title}</span>
                      <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
