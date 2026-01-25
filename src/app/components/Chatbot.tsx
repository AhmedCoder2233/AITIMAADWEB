'use client';

import { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
      const botMsg = { sender: "bot", text: data.reply || "Error" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error connecting to bot." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 max-w-full bg-white shadow-xl rounded-xl flex flex-col overflow-hidden z-50">
      <div className="bg-blue-600 text-white p-3 font-bold">💬 Chatbot</div>

      <div className="flex-1 p-3 overflow-y-auto h-64 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded-md ${msg.sender === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="text-gray-500">Typing...</div>}
      </div>

      <div className="flex border-t border-gray-300">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-2 outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
