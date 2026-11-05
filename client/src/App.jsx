import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Send, Search, Users, UserPlus, Image, Paperclip, 
  Smile, Check, CheckCheck, LogOut, MessageSquare, ShieldCheck, Copy
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('chat_current_user') || 'null'));
  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({ name: '', username: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState({ type: 'global', name: 'General Classroom', id: 'global' });
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Socket connection
  useEffect(() => {
    if (!user) return;
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('user_join', user);

    newSocket.on('presence_update', (users) => setOnlineUsers(users));
    newSocket.on('directory_update', (allUsers) => setDirectory(allUsers));
    newSocket.on('message_history', (history) => setMessages(history));
    newSocket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    newSocket.on('message_read', ({ messageId, status }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, status } : m));
    });

    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setAuthError('Please fill in all fields');
      return;
    }
    const cleanUser = {
      name: formData.name || formData.username,
      username: formData.username.replace('@', '').toLowerCase().trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`
    };
    localStorage.setItem('chat_current_user', JSON.stringify(cleanUser));
    setUser(cleanUser);
    setAuthError('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const newMsg = {
      sender: user.username,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: inputText,
      target: currentChat.id,
      targetType: currentChat.type
    };

    socket.emit('send_message', newMsg);
    setInputText('');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 bg-indigo-600/20 text-indigo-400 rounded-2xl mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Classroom Real-Time Chat</h2>
          <p className="text-slate-400 text-center text-sm mb-6">
            {authMode === 'signup' ? 'Create an account to join your classmates' : 'Sign in to continue chatting'}
          </p>

          {authError && <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800 rounded-lg">{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Alex Miller" 
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                placeholder="e.g. alex_m" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" 
                placeholder="••••••••" 
                required 
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition">
              {authMode === 'signup' ? 'Sign Up & Join' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')} className="text-indigo-400 hover:underline">
              {authMode === 'signup' ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredDirectory = directory.filter(u => 
    u.username !== user.username && 
    (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayedMessages = messages.filter(m => {
    if (currentChat.type === 'global') return m.targetType === 'global';
    return (m.sender === user.username && m.target === currentChat.id) || 
           (m.sender === currentChat.id && m.target === user.username);
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-full ring-2 ring-indigo-500" />
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{user.name}</p>
              <p className="text-xs text-indigo-400">@{user.username}</p>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('chat_current_user'); setUser(null); }}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Share Link Banner */}
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between">
          <span className="text-[11px] text-indigo-300">Share with classmates:</span>
          <button 
            onClick={copyShareLink} 
            className="flex items-center space-x-1 text-[11px] text-white bg-indigo-600 px-2.5 py-1 rounded-md hover:bg-indigo-500"
          >
            <Copy className="w-3 h-3" />
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Find classmate by @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Channels & Friends List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1">Channels</div>
          <button
            onClick={() => setCurrentChat({ type: 'global', name: 'General Classroom', id: 'global' })}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition ${currentChat.id === 'global' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium flex-1">General Classroom</span>
          </button>

          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 py-1">Direct Messages</div>
          {filteredDirectory.map((peer) => {
            const isOnline = onlineUsers.some(u => u.username === peer.username);
            const isSelected = currentChat.id === peer.username;
            return (
              <button
                key={peer.username}
                onClick={() => setCurrentChat({ type: 'direct', name: peer.name, id: peer.username, avatar: peer.avatar })}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              >
                <div className="relative">
                  <img src={peer.avatar} alt={peer.username} className="w-7 h-7 rounded-full" />
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{peer.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">@{peer.username}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-sm">
          <div>
            <h3 className="font-semibold text-sm text-white">{currentChat.name}</h3>
            <p className="text-xs text-slate-400">
              {currentChat.type === 'global' ? `${onlineUsers.length} classmates online now` : `@${currentChat.id}`}
            </p>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayedMessages.map((m) => {
            const isMe = m.sender === user.username;
            return (
              <div key={m.id} className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && <img src={m.senderAvatar} alt="" className="w-7 h-7 rounded-full" />}
                <div className={`max-w-md px-4 py-2.5 rounded-2xl text-xs ${isMe ? 'bg-indigo-600 text-white rounded-br-xs' : 'bg-slate-800 text-slate-200 rounded-bl-xs'}`}>
                  {!isMe && <p className="font-semibold text-[10px] text-indigo-400 mb-1">{m.senderName}</p>}
                  <p className="leading-relaxed">{m.text}</p>
                  <div className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    <span>{m.timestamp}</span>
                    {isMe && (m.status === 'read' ? <CheckCheck className="w-3 h-3 text-cyan-300" /> : <Check className="w-3 h-3" />)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
          <input 
            type="text" 
            placeholder={`Message ${currentChat.name}...`} 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
