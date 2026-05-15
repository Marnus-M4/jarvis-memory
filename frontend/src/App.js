import { useState, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem("allChats");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeChatIndex, setActiveChatIndex] = useState(null);

  // ✅ Save to localStorage
  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }, [allChats]);

  // ✅ Save chat on page refresh
  useEffect(() => {
    const handleUnload = () => {
      if (chat.length > 0 && activeChatIndex === null) {
        const title = chat[0]?.user?.slice(0, 30) || "New Chat";

        const updated = [
          ...allChats,
          { title, messages: chat }
        ];

        localStorage.setItem("allChats", JSON.stringify(updated));
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [chat, allChats, activeChatIndex]);

  // ✅ SEND MESSAGE
  const sendMessage = async () => {
    if (!input) return;

    try {
      const res = await fetch("https://jarvis-memory-8w92.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });

      const data = await res.json();

      setChat(prev => [...prev, { user: input, ai: data.response }]);
      setInput("");

    } catch {
      setChat(prev => [...prev, { user: input, ai: "Error: backend not reachable" }]);
    }
  };

  // ✅ LOAD CHAT
  const loadChat = (index) => {
    setActiveChatIndex(index);
    setChat(allChats[index].messages);
  };

  // ✅ NEW CHAT
  const newChat = () => {
    if (chat.length > 0 && activeChatIndex === null) {
      const title = chat[0]?.user?.slice(0, 30) || "New Chat";

      setAllChats(prev => [
        ...prev,
        { title, messages: chat }
      ]);
    }

    setChat([]);
    setActiveChatIndex(null);
  };

  // ✅ DELETE CHAT
  const deleteChat = (index) => {
    const updated = allChats.filter((_, i) => i !== index);
    setAllChats(updated);

    if (activeChatIndex === index) {
      setChat([]);
      setActiveChatIndex(null);
    }
  };

  // ✅ RENAME CHAT
  const renameChat = (index) => {
    const newName = prompt("Enter new name:");
    if (!newName) return;

    const updated = [...allChats];
    updated[index].title = newName;
    setAllChats(updated);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* ✅ SIDEBAR */}
      <div style={{
        width: "250px",
        borderRight: "1px solid #ccc",
        padding: "10px"
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
              position: "relative",
              padding: 10,
              marginBottom: 5,
              cursor: "pointer",
              background: activeChatIndex === i ? "#ddd" : "#f5f5f5",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            {/* ✅ TITLE */}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {c.title}
            </span>

            {/* ✅ 3 DOT MENU */}
            <span
              style={{
                cursor: "pointer",
                visibility: "hidden"
              }}
              className="menu-btn"
              onClick={(e) => {
                e.stopPropagation();

                const action = prompt("Type 'delete' or 'rename'");

                if (action === "delete") deleteChat(i);
                if (action === "rename") renameChat(i);
              }}
            >
              ⋮
            </span>
          </div>
        ))}
      </div>

      {/* ✅ MAIN CHAT */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>

        {/* ✅ MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 20
        }}>
          {chat.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: msg.user ? "flex-end" : "flex-start",
              marginBottom: 10
            }}>
              <div style={{
                maxWidth: "60%",
                padding: "10px",
                borderRadius: "10px",
                background: msg.user ? "#007bff" : "#e5e5ea",
                color: msg.user ? "white" : "black"
              }}>
                {msg.user ?? msg.ai}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ INPUT */}
        <div style={{
          padding: "10px",
          borderTop: "1px solid #ccc",
          display: "flex"
        }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // prevents newline
              sendMessage();
              }
              }}
              placeholder="Ask something..."
              style={{
              flex: 1,
              padding: "10px",
              resize: "none",
              height: "50px"
              }}
            />
          <button onClick={sendMessage}>Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;
