import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import './css/chatbot.css';

// API Key (replace with your own key)
const apiKey = 'AIzaSyClO51g8pLssQ2tS22bo70ZO05m3tA1qPU';

// Sample data
const deals = [
  { dealName: "Deal A", status: "COLD", stage: "NEW", contactName: "John Doe", phone: "083861327170", email: "john@example.com" },
  { dealName: "Deal B", status: "WARM", stage: "INITIALMEETING", contactName: "Jane Smith", phone: "083861327171", email: "jane@example.com" },
  { dealName: "Deal C", status: "HOT", stage: "NEGO", contactName: "Emily Johnson", phone: "083861327172", email: "emily@example.com" },
  { dealName: "Deal D", status: "DEAL", stage: "DEAL", contactName: "Michael Brown", phone: "083861327173", email: "michael@example.com" },
  { dealName: "Deal E", status: "LOST", stage: "PAYMENT", contactName: "Sarah Davis", phone: "083861327174", email: "sarah@example.com" }
];

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div>{children}</div>
      </div>
    </div>
  );
};

const SoekarndoBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (deal) => {
    try {
      console.log("Fetching data for deal:", deal);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

      const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };

      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              { text: `Kamu adalah chatbot untuk memberikan broadcast untuk menawarkan jasa marketing dari PT Kode Evolusi Bangsa (Kodegiri). Berikut adalah kategori dan strategi komunikasi berdasarkan status deal:
                1. COLD: Strategi untuk konsumen yang belum aktif dalam jangka waktu lama.
                2. WARM: Strategi untuk konsumen yang menunjukkan minat sebelumnya.
                3. HOT: Strategi untuk konsumen yang sangat tertarik dan siap membeli.
                4. DEAL: Strategi untuk konsumen yang telah menyetujui kesepakatan.
                5. LOST: Strategi untuk konsumen yang telah lama tidak berinteraksi.
                
                Status Deal: ${deal.status}
                Deal Name: ${deal.dealName}
                Nama Kontak: ${deal.contactName}
                No. WA: ${deal.phone}
                Email: ${deal.email}` }
            ],
          },
          {
            role: "model",
            parts: [
              { text: `**Pesan Broadcast untuk ${deal.status}**` }
            ],
          }
        ],
      });

      const result = await chatSession.sendMessage(`Generate message for ${deal.status}`);
      console.log("API Result:", result);

      if (result.response && result.response.text) {
        const botMessage = parseMessage(result.response.text());
        setGeneratedMessage(botMessage);
        setIsModalOpen(true); // Open the modal
      } else {
        console.error("Unexpected API response:", result);
        setGeneratedMessage("Ada kesalahan dalam respon API.");
        setIsModalOpen(true); // Open the modal with error message
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.code === 429) {
        setGeneratedMessage("Maaf limit untuk bertanya.");
      } else {
        setGeneratedMessage("Ada kesalahan.");
      }
      setIsModalOpen(true); // Open the modal with error message
    }
  };

  const parseMessage = (text) => {
    const parts = text.split(/(\*.*?\*|_.*?_|\~.*?\~)/).map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <span key={index} className="bold">{part.slice(1, -1)}</span>;
      } else if (part.startsWith('_') && part.endsWith('_')) {
        return <span key={index} className="italic">{part.slice(1, -1)}</span>;
      } else if (part.startsWith('~') && part.endsWith('~')) {
        return <span key={index} className="underline">{part.slice(1, -1)}</span>;
      } else {
        return part;
      }
    });

    return <>{parts}</>;
  };

  const handleGenerateMessage = (deal) => {
    setSelectedDeal(deal);
    fetchData(deal);
  };

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    const userMessage = {
      role: "user",
      parts: [{ text: input }],
    };

    setMessages([...messages, userMessage]);

    // Clear input field after sending the message
    setInput("");
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
        {isOpen && (
          <div className="chatbot-box">
            <div className="chatbot-header">
              <h3>Saka Bot</h3>
              <button onClick={handleToggleChat} className="close-btn">✕</button>
            </div>
            <div className="chatbot-messages">
              {selectedDeal && (
                <div className="message bot-message">
                  <p><strong>Pesan yang Dihasilkan untuk {selectedDeal.dealName}:</strong></p>
                  <p>{generatedMessage}</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}-message`}>
                  {message.parts.map((part, partIndex) => (
                    <span key={partIndex} className={message.role === 'user' ? 'user-message' : 'bot-message'}>
                      {part.text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="chatbot-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ketik disini"
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>
      <button onClick={handleToggleChat} className="floating-button">
        <i className="bi bi-chat-dots"></i>
      </button>
      <div className="deals-table">
        <table>
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Status</th>
              <th>Stage</th>
              <th>Contact Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, index) => (
              <tr key={index}>
                <td>{deal.dealName}</td>
                <td>{deal.status}</td>
                <td>{deal.stage}</td>
                <td>{deal.contactName}</td>
                <td>{deal.phone}</td>
                <td>{deal.email}</td>
                <td>
                  <button onClick={() => handleGenerateMessage(deal)}>Generate Message</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Generated Message</h3>
        <div>{generatedMessage}</div>
      </Modal>
    </div>
  );
};

export default SoekarndoBot;
