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

  // ✅ ONLY save when page is closed (NOT on click)
  useEffect(() => {
    const handleUnload = () => {
      if (chat.length > 0 && activeChatIndex === null) {
        const updated = [...allChats, chat];
        localStorage.setItem("allChats", JSON.stringify(updated));
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [chat, allChats, activeChatIndex]);

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

    } catch {
      setChat(prev => [...prev, { user: input, ai: "Error: backend not reachable" }]);
    }
  };

  // ✅ Load chat
  const loadChat = (index) => {
    setActiveChatIndex(index);
    setChat(allChats[index]);
  };

  // ✅ New chat
  const newChat = () => {
    if (chat.length > 0 && activeChatIndex === null) {
      setAllChats(prev => [...prev, chat]);
    }
    setChat([]);
    setActiveChatIndex(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* ✅ SIDEBAR */}
      <div style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        padding: "10px",
        overflowY: "auto"
      }}>
        <h2>Chats</h2>

        <button onClick={newChat} style={{ width: "100%", marginBottom: 10 }}>
          + New Chat
        </button>

        {allChats.map((c, i) => (
          <div
            key={i}
            onClick={() => loadChat(i)}
            style={{
              padding: 10,
              marginBottom: 5,
              cursor: "pointer",
              background: activeChatIndex === i ? "#ddd" : "#f5f5f5"
            }}
          >
            Chat {i + 1}
          </div>
        ))}
      </div>

      {/* ✅ MAIN CHAT AREA */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh"
      }}>

        {/* ✅ MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px"
        }}>
          {chat.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.user ? "flex-end" : "flex-start",
              marginBottom: "10px"
            }}>
              <div style={{
                maxWidth: "60%",
                padding: "10px",
                borderRadius: "10px",
                background: msg.user ? "#007bff" : "#e5e5ea",
                color: msg.user ? "white" : "black"
              }}>
                {msg.user ? msg.user : msg.ai}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ INPUT AT BOTTOM */}
        <div style={{
          padding: "10px",
          borderTop: "1px solid #ccc",
          display: "flex"
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            style={{
              flex: 1,
              padding: "10px",
              marginRight: "10px"
            }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;
