import { useState, useEffect, useRef } from "react";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useScreen, setUseScreen] = useState(false);

  const chatEndRef = useRef(null);

  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem("allChats");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }, [allChats]);

  // ✅ AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // ✅ SCREEN CAPTURE
  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const image = canvas.toDataURL("image/png");

      stream.getTracks().forEach(track => track.stop());

      return image;
    } catch {
      return null;
    }
  };

  // ✅ SEND MESSAGE
  const sendMessage = async () => {
    if (!input) return;

    setLoading(true);

    try {
      const screenshot = useScreen ? await captureScreen() : null;

      const res = await fetch("https://jarvis-memory-8w92.onrender.com/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: input,
          image: screenshot
        })
      });

      const data = await res.json();

      setChat(prev => [...prev, { user: input, ai: data.response }]);
      setInput("");

    } catch {
      setChat(prev => [...prev, { user: input, ai: "Error sending message" }]);
    }

    setLoading(false);
  };

  // ✅ ENTER / SHIFT ENTER
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadChat = (index) => {
    setActiveChatIndex(index);
    setChat(allChats[index].messages);
  };

  const newChat = () => {
    if (chat.length > 0 && activeChatIndex === null) {
      const title = chat[0]?.user?.slice(0, 30) || "New Chat";
      setAllChats(prev => [...prev, { title, messages: chat }]);
    }
    setChat([]);
    setActiveChatIndex(null);
  };

  const deleteChat = (index) => {
    const updated = allChats.filter((_, i) => i !== index);
    setAllChats(updated);
  };

  const renameChat = (index) => {
    const newName = prompt("Rename chat:");
    if (!newName) return;

    const updated = [...allChats];
    updated[index].title = newName;
    setAllChats(updated);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>

      {/* ✅ SIDEBAR */}
      <div style={{
        width: 260,
        borderRight: "1px solid #ccc",
        padding: 10
      }}>
        <h3>Chats</h3>

        <button onClick={newChat} style={{
          width: "100%",
          padding: "8px",
          borderRadius: "6px",
          border: "none",
          background: "#007bff",
          color: "white",
          cursor: "pointer"
        }}>
          + New Chat
        </button>

        {allChats.map((c, i) => (
          <div
            key={i}
            onClick={() => loadChat(i)}
            style={{
              padding: 10,
              marginTop: 5,
              cursor: "pointer",
              background: activeChatIndex === i ? "#ddd" : "#f5f5f5",
              position: "relative",
              borderRadius: "6px"
            }}
          >
            {c.title}

            {/* ✅ HOVER MENU */}
            <div className="menu" style={{
              position: "absolute",
              right: 10,
              top: 10,
              display: "none"
            }}>
              <span onClick={(e) => { e.stopPropagation(); renameChat(i); }}>✏️</span>
              <span onClick={(e) => { e.stopPropagation(); deleteChat(i); }}>❌</span>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ MAIN */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>

        {/* ✅ CHAT */}
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
                padding: 10,
                borderRadius: 10,
                background: msg.user ? "#007bff" : "#e5e5ea",
                color: msg.user ? "white" : "black",
                maxWidth: "60%"
              }}>
                {msg.user ?? msg.ai}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ color: "#888" }}>Jarvis is thinking...</div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* ✅ PROFESSIONAL INPUT BAR */}
        <div style={{
          padding: "15px",
          borderTop: "1px solid #ddd",
          background: "#f9f9f9"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            borderRadius: "12px",
            padding: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>

            {/* ✅ TEXTAREA */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jarvis anything..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: "14px",
                padding: "8px",
                minHeight: "40px",
                background: "transparent"
              }}
            />

            {/* ✅ SCREEN TOGGLE */}
            <label style={{
              display: "flex",
              alignItems: "center",
              marginRight: "10px",
              fontSize: "12px",
              color: "#555"
            }}>
              <input
                type="checkbox"
                checked={useScreen}
                onChange={() => setUseScreen(!useScreen)}
                style={{ marginRight: 5 }}
              />
              Screen
            </label>

            {/* ✅ SEND BUTTON */}
            <button
              onClick={sendMessage}
              style={{
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ➤
            </button>

          </div>
        </div>
      </div>

      {/* ✅ HOVER STYLE */}
      <style>
        {`
          div:hover > .menu {
            display: flex !important;
            gap: 6px;
          }

          button:hover {
            opacity: 0.9;
          }
        `}
      </style>

    </div>
  );
}

export default App;