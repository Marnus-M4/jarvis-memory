import { useState, useEffect } from "react";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);

  // ✅ load chat history
  const [allChats, setAllChats] = useState(() => {
    const saved = localStorage.getItem("allChats");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ save history
  useEffect(() => {
    localStorage.setItem("allChats", JSON.stringify(allChats));
  }, [allChats]);

  // ✅ CAPTURE SCREEN
  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

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

    } catch (err) {
      console.log("Screen capture cancelled");
      return null;
    }
  };

  // ✅ SEND MESSAGE (WITH SCREEN)
  const sendMessage = async () => {
    if (!input) return;

    try {
      const screenshot = await captureScreen();

      const res = await fetch("https://jarvis-memory-8w92.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  };

  // ✅ ENTER / SHIFT+ENTER
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ LOAD CHAT
  const loadChat = (index) => {
    setActiveChatIndex(index);
    setChat(allChats[index].messages);
  };

  // ✅ CREATE NEW CHAT
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
    const newName = prompt("Rename chat:");
    if (!newName) return;

    const updated = [...allChats];
    updated[index].title = newName;
    setAllChats(updated);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* ✅ SIDEBAR */}
      <div style={{
        width: 250,
        borderRight: "1px solid #ccc",
        padding: 10
      }}>
        <h2>Chats</h2>

        <button onClick={newChat} style={{ width: "100%" }}>
          + New Chat
        </button>

        {allChats.map((c, i) => (
          <div
            key={i}
            onClick={() => loadChat(i)}
            style={{
              position: "relative",
              padding: 10,
              marginTop: 5,
              cursor: "pointer",
              background: activeChatIndex === i ? "#ddd" : "#f5f5f5"
            }}
          >
            {c.title}

            {/* ✅ MENU */}
            <span
              style={{
                position: "absolute",
                right: 10
              }}
              onClick={(e) => {
                e.stopPropagation();

                const action = prompt("delete or rename");

                if (action === "delete") deleteChat(i);
                if (action === "rename") renameChat(i);
              }}
            >
              ⋮
            </span>
          </div>
        ))}
      </div>

      {/* ✅ MAIN */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column"
      }}>

        {/* ✅ CHAT MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: 20
        }}>
          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.user ? "flex-end" : "flex-start",
                marginBottom: 10
              }}
            >
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
        </div>

        {/* ✅ INPUT */}
        <div style={{
          display: "flex",
          padding: 10,
          borderTop: "1px solid #ccc"
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            style={{
              flex: 1,
              resize: "none",
              padding: 10,
              height: 50
            }}
          />

          <button onClick={sendMessage}>
            Send
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;