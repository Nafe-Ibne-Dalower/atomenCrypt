import React, { useState, useEffect, useRef } from "react";
import {io} from "socket.io-client";
import { BiSend } from "react-icons/bi";

// Connect to the backend server
const socket = io('https://atomencrypt.onrender.com/');

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [previousMessages, setPreviousMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleNewMessage = (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      playNotificationSound();
    };

    socket.on("message", handleNewMessage);

    return () => {
      socket.off("message", handleNewMessage);
    };
  }, []);

  useEffect(() => {
    socket.on("previousMessages", (previousMessages) => {
      setPreviousMessages(previousMessages);
    });

    return () => {
      socket.off("previousMessages");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, previousMessages]);

  // Function to play notification sound
  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play();
  };

  const handleLogin = () => {
    if (username.trim() !== "") {
      setIsLoggedIn(true);
      const timestamp = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      socket.emit("message", { username, timestamp, content: "Connected" });
    }
  };

  const handleMessageSend = () => {
    if (inputMessage.trim() !== "") {
      const timestamp = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      socket.emit("message", { username, timestamp, content: inputMessage });
      setInputMessage("");
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (!isLoggedIn) {
        handleLogin();
      } else {
        handleMessageSend();
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(45deg, #ffffff, #ffe7ec, #ffffff)",
        color: "#333",
        padding: "20px",
        boxSizing: "border-box",
        overflowY: "hidden",
      }}
    >
      {!isLoggedIn ? (
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginBottom: "20px", color: "#333" }}>
            Welcome to AtomenCrypt
          </h1>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              marginBottom: "20px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              backgroundColor: "#5300e2",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: "800px" }}>
          <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
            AtomenCrypt
          </h1>
          <div
            style={{
              marginBottom: "20px",
              borderRadius: "10px",
              background: "#fff",
              padding: "20px",
              overflowY: "scroll",
              maxHeight: "400px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            {previousMessages.map((message, index) => (
              <div key={index}>
                <div
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "10px",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {message.username}
                  </span>{" "}
                  - {message.timestamp}
                  <br />
                  {message.content}
                </div>
              </div>
            ))}
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#D1E8FF",
                    borderRadius: "10px",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {message.username}
                  </span>{" "}
                  - {message.timestamp}
                  <br />
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div
            style={{
              display: "flex",
              marginBottom: "20px",
              width: "100%",
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                marginRight: "10px",
                padding: "10px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
              placeholder="Type your message here..."
            />
            <button
              onClick={handleMessageSend}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#5300e2",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              <BiSend />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
