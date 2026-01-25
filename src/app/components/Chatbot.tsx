'use client';

import { useState, useEffect, useRef } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "bot", text: "👋 Welcome to AITIMAAD.PK! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const primaryColor = "#15803D";
  const lightGreen = "#DCFCE7";
  const darkGreen = "#166534";
  const subtleGreen = "#F0FDF4";

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      const botMsg = { sender: "bot", text: data.reply || "I apologize, I couldn't process that request." };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  // Minimized state for mobile/desktop
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}
        aria-label="Open chat"
      >
        <div className="relative">
          <div 
            className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="text-white text-2xl">💬</div>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
        </div>
      </button>
    );
  }

  // Mobile fullscreen or desktop modal
  return (
    <div className={`fixed z-50 ${isMobile ? 'inset-0' : 'bottom-6 right-6 w-[350px] sm:w-[380px] max-w-[calc(100vw-2rem)]'} bg-white flex flex-col`}>
      {/* Header */}
      <div 
        className="p-4 text-white flex items-center justify-between border-b border-white/20 shrink-0"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">AITIMAAD.PK</h2>
            <p className="text-xs opacity-90">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {!isMobile && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Minimize"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-gray-50/50 ${
          isMobile ? 'h-[calc(100vh-136px)]' : 'max-h-[400px] min-h-[300px]'
        }`}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 ${msg.sender === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
              style={{
                backgroundColor: msg.sender === "user" ? primaryColor : lightGreen,
                color: msg.sender === "user" ? "white" : "#1F2937",
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <div className="text-sm font-medium mb-1 flex items-center gap-2">
                <span className="opacity-80">
                  {msg.sender === "user" ? "You" : "AITIMAAD.PK"}
                </span>
                <span className="text-xs opacity-60">
                  {msg.sender === "user" ? "👤" : "🤖"}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div 
              className="max-w-[85%] rounded-xl rounded-bl-md p-3"
              style={{ backgroundColor: lightGreen }}
            >
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <span className="text-sm text-gray-600">Typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 text-base"
            style={{ 
              backgroundColor: subtleGreen
            }}
            placeholder="Type your message..."
            aria-label="Type your message"
          />
          <button
            onClick={sendMessage}
            className={`px-4 ${isMobile ? 'px-5' : 'px-4'} rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
            style={{ 
              backgroundColor: primaryColor,
              color: "white"
            }}
            disabled={loading || !input.trim()}
          >
            {isMobile ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            ) : (
              <span className="text-sm">Send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;