import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { BiMicrophone, BiPause, BiSend } from "react-icons/bi";

const socket = io("http://192.168.0.106:4000");

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [previewAudioURL, setPreviewAudioURL] = useState("");
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      const timestamp = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      socket.emit("message", `${username} - ${timestamp} - Connected`);
      socket.on("message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
        setShowNotification(true);
      });
      socket.on("voice_message", (audioData) => {
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        const audioURL = URL.createObjectURL(audioBlob);
        setMessages((prevMessages) => [
          ...prevMessages,
          { audioURL, username, timestamp: new Date().toLocaleString() },
        ]);
        setPreviewAudioURL(audioURL);
        setShowNotification(true);
      });

      return () => {
        socket.off("message");
        socket.off("voice_message");
      };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (showNotification) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("New message received!");
        }
      });
      setShowNotification(false);
    }
  }, [showNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = () => {
    if (username.trim() !== "") {
      setIsLoggedIn(true);
    }
  };

  const handleMessageSend = () => {
    if (inputMessage.trim() !== "") {
      const timestamp = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      socket.emit("message", `${username} - ${timestamp} - ${inputMessage}`);
      setInputMessage("");
    }
  };

  const handleVoiceMessageSend = (audioData) => {
    socket.emit("voice_message", audioData);
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

  const startRecording = () => {
    setRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(audioChunks);
          const audioURL = URL.createObjectURL(audioBlob);
          setAudioURL(audioURL);
          handleVoiceMessageSend(audioBlob);
          setRecording(false);
        });

        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
        }, 5000); // Stop recording after 5 seconds
      })
      .catch((error) => {
        console.error("Error recording:", error);
        setRecording(false);
      });
  };

  const pauseRecording = () => {
    // Pausing recording logic
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
            {messages.map((message, index) => (
              <div key={index}>
                {message.audioURL ? (
                  <audio src={message.audioURL} controls />
                ) : (
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
                      {message.split(" - ")[0]}
                    </span>{" "}
                    - {message.split(" - ")[1]}
                    <br />
                    {message.split(" - ")[2]}
                  </div>
                )}
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
            <button
              onClick={recording ? pauseRecording : startRecording}
              disabled={!isLoggedIn}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: recording ? "#ff0000" : "#008000",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {recording ? <BiPause /> : <BiMicrophone />}
              {recording ? "Pause Recording" : ""}
            </button>
          </div>
          {previewAudioURL && (
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#fff",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
                zIndex: 9999,
              }}
            >
              <audio src={previewAudioURL} controls />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={() => {
                    setPreviewAudioURL("");
                    setRecording(false);
                  }}
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    backgroundColor: "#f00",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Pause Recording
                </button>
                <button
                  onClick={() => {
                    handleVoiceMessageSend(new Blob([])); // Send an empty blob as voice message
                    setRecording(false);
                    setPreviewAudioURL("");
                  }}
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
                  Send Recording
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
