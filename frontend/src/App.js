import { useState } from "react";

function App() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!input) return;

    const res = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: input })
    });

    const data = await res.json();

    setChat([...chat, { user: input, ai: data.response }]);
    setInput("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Jarvis AI</h1>

      {chat.map((msg, i) => (
        <div key={i}>
          <p><b>You:</b> {msg.user}</p>
          <p><b>Jarvis:</b> {msg.ai}</p>
        </div>
      ))}

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;