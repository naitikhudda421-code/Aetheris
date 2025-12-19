
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import { 
  SendIcon, 
  MicIcon, 
  ImageIcon, 
  MenuIcon, 
  LogoIcon,
  PlusIcon 
} from './components/Icons';
import { 
  Message, 
  Role, 
  ChatSession, 
  ModelType 
} from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with a new chat session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    } else if (!currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New chat',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: Role.USER,
      parts: [
        { text: input },
        ...(selectedImage ? [{ inlineData: selectedImage }] : [])
      ],
      timestamp: Date.now()
    };

    // Update session with user message
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const newMessages = [...s.messages, userMessage];
        // Auto-title the chat based on first message
        const title = s.messages.length === 0 ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : s.title;
        return { ...s, messages: newMessages, title };
      }
      return s;
    }));

    const currentInput = input;
    const currentImg = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    const botMessageId = uuidv4();
    const botMessage: Message = {
      id: botMessageId,
      role: Role.MODEL,
      parts: [{ text: '' }],
      timestamp: Date.now()
    };

    // Add empty bot message for streaming
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return { ...s, messages: [...s.messages, botMessage] };
      }
      return s;
    }));

    try {
      const history = currentSession?.messages || [];
      const generator = geminiService.streamChat(
        model,
        history,
        currentInput,
        currentImg || undefined
      );

      for await (const chunk of generator) {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === botMessageId 
                  ? { ...m, parts: [{ text: chunk.text }], groundingSources: chunk.sources }
                  : m
              )
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error(err);
      // Handle error UI if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const data = base64Data.split(',')[1];
      setSelectedImage({
        data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen w-full bg-[#131314] overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[#131314] z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-[#282a2c] rounded-full text-white transition-colors"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            )}
            <div className="flex items-center gap-2 group cursor-pointer">
              <span className="text-xl font-medium text-gray-200">Aetheris</span>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value as ModelType)}
                className="bg-transparent border-none text-gray-400 text-sm focus:ring-0 cursor-pointer hover:text-white transition-colors outline-none"
              >
                <option value={ModelType.FLASH} className="bg-[#1e1f20]">Aetheris Flash</option>
                <option value={ModelType.PRO} className="bg-[#1e1f20]">Aetheris Pro</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#282a2c] hover:bg-[#333537] rounded-full text-sm text-gray-200 transition-colors">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
              <span>Premium</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-lg">
              USER
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <MessageList messages={currentSession?.messages || []} />

        {/* Input Area */}
        <div className="p-4 sm:px-12 md:px-24 pb-8 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            {selectedImage && (
              <div className="relative inline-block animate-fade-in">
                <img 
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                  alt="Preview" 
                  className="h-20 w-auto rounded-lg border-2 border-indigo-500 shadow-xl"
                />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                >
                  <PlusIcon className="w-3 h-3 rotate-45" />
                </button>
              </div>
            )}
            
            <div className="relative bg-[#1e1f20] rounded-3xl border border-[#333537] shadow-2xl focus-within:border-indigo-500 transition-all duration-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Aetheris..."
                className="w-full bg-transparent text-white px-6 py-4 pr-32 focus:outline-none resize-none min-h-[60px] max-h-[300px] text-[15px] leading-relaxed custom-scrollbar"
                rows={Math.min(input.split('\n').length || 1, 8)}
              />
              <div className="absolute right-4 bottom-3 flex items-center gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#333537] rounded-full transition-all"
                  title="Upload image"
                >
                  <ImageIcon className="w-6 h-6" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#333537] rounded-full transition-all"
                  title="Voice input"
                >
                  <MicIcon className="w-6 h-6" />
                </button>
                {input.trim() || selectedImage ? (
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    <SendIcon className="w-6 h-6" />
                  </button>
                ) : null}
              </div>
            </div>
            
            <p className="text-[11px] text-gray-500 text-center px-4">
              Aetheris can make mistakes. Verify important information. 
              <a href="#" className="underline ml-1">Privacy & Terms</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
