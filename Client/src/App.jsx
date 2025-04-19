// src/App.jsx
import { useEffect, useState } from "react";
import socket from "./socket";

function App() {
  const [code, setCode] = useState("");
  const roomId = "reverse-a-string"; // You can make this dynamic later
  const user = "Yossi"; // Can be replaced with user input or authentication later

  useEffect(() => {
    // Emit join_room event when the component mounts
    socket.emit("join_room", { roomId, user });

    // Receive the initial code (baseCode) from the server
    socket.on("load_code", (initialCode) => {
      setCode(initialCode);
    });

    // Listen for real-time updates from other users
    socket.on("code_update", (newCode) => {
      setCode(newCode);
    });

    // Clean up event listeners on unmount
    return () => {
      socket.off("load_code");
      socket.off("code_update");
    };
  }, []);

  // Emit code_change event on every local change
  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    socket.emit("code_change", { roomId, content: newCode });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Real-time Code Editor</h2>
      <textarea
        value={code}
        onChange={handleChange}
        rows={15}
        cols={80}
        style={{ fontFamily: "monospace", fontSize: "1rem" }}
      />
    </div>
  );
}

export default App;
