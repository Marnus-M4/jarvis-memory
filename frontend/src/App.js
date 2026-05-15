import { useState, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");

  const [chat, setChat] = useState([]);
  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem("allChats");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChatIndex, setActiveChatIndex] = useState(null);

  // ✅ Save history
  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }, [allChats]);

  // ✅ Save current chat on refresh
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

  // ✅ Send message
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
      setChat(prev => [...prev, { user: input, ai: "Error: backend not reachable" }]);
    }
  };

  // ✅ Load previous chat when clicked
  const loadChat = (index) => {
    setActiveChatIndex(index);
    setChat(allChats[index]);
  };

  // ✅ Start new chat
  const newChat = () => {
    setChat([]);
    setActiveChatIndex(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* ✅ LEFT SIDEBAR */}
      <div style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        padding: "10px",
        overflowY: "auto"
      }}>
        <h2>Chats</h2>

        <button onClick={newChat} style={{ width: "100%", marginBottom: "10px" }}>
          + New Chat
        </button>

        {allChats.map((c, index) => (
          <div
            key={index}
            onClick={() => loadChat(index)}
            style={{
              padding: "10px",
              marginBottom: "5px",
              cursor: "pointer",
              background: activeChatIndex === index ? "#ddd" : "#f5f5f5"
            }}
          >
            Chat {index + 1}
          </div>
        ))}
      </div>

      {/* ✅ RIGHT CHAT AREA */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h1>Jarvis AI</h1>

        <div style={{ marginBottom: "20px" }}>
          {chat.map((msg, i) => (
            <div key={i}>
              <p><b>You:</b> {msg.user}</p>
              <p><b>Jarvis:</b> {msg.ai}</p>
            </div>
          ))}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;