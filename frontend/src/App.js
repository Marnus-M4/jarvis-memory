import { useState, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");

  // ✅ current active chat
  const [chat, setChat] = useState([]);

  // ✅ all previous chats (history)
  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem("allChats");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ persist history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }, [allChats]);

  // ✅ save chat when page reloads (important fix)
  useEffect(() => {
    return () => {
      if (chat.length > 0) {
        setAllChats(prev => {
          const updated = [...prev, chat];
          localStorage.setItem("allChats", JSON.stringify(updated));
          return updated;
        });
      }
    };
  }, [chat]);

  // ✅ send message to backend
  const sendMessage = async () => {
    if (!input) return;

    try {
      const res = await fetch("https://jarvis-memory-8w92.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: input })
      });

      const data = await res.json();

      setChat(prev => [...prev, { user: input, ai: data.response }]);
      setInput("");

    } catch (error) {
      console.error(error);
      setChat(prev => [...prev, { user: input, ai: "Error: backend not reachable" }]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Jarvis AI</h1>

      {/* ✅ CURRENT CHAT */}
      <h2>Current Chat</h2>
      {chat.map((msg, i) => (
        <div key={i}>
          <p><b>You:</b> {msg.user}</p>
          <p><b>Jarvis:</b> {msg.ai}</p>
        </div>
      ))}

      {/* ✅ INPUT */}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>

      {/* ✅ NEW CHAT BUTTON */}
      <br /><br />
      <button onClick={() => setChat([])}>
        Start New Chat
      </button>

      {/* ✅ CHAT HISTORY */}
      <h2>Chat History</h2>
      {allChats.map((c, index) => (
        <div
          key={index}
          style={{ border: "1px solid gray", padding: 10, margin: 5 }}
        >
          <p><b>Chat {index + 1}</b> ({c.length} messages)</p>
        </div>
      ))}
    </div>
  );
}

export default App;
