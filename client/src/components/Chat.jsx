import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Chat({ socket, lobbyId, gameId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!open) setUnread((n) => n + 1);
    };

    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, [socket, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  function send(e) {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('send_chat_message', { lobbyId, gameId, message: input.trim() });
    setInput('');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-72 h-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-600 flex flex-col mb-2">
          <div className="p-2 border-b border-gray-600 font-semibold text-sm text-gray-300 flex justify-between">
            <span>Chat</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-1 ${m.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-2 py-1 max-w-[80%] break-words ${
                  m.userId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                }`}>
                  {m.userId !== user?.id && (
                    <span className="block text-xs text-gray-400 mb-0.5">{m.username || 'Player'}</span>
                  )}
                  {m.message}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="p-2 border-t border-gray-600 flex gap-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 bg-gray-700 rounded-lg px-2 py-1 text-sm text-white placeholder-gray-400 outline-none"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-lg text-sm">
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="relative bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
      >
        💬
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
