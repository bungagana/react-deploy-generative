import React, { useState } from "react";
import ReactDOMServer from "react-dom/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import './css/chatbot.css';

// API Key (replace with your own key)
const apiKey =  'AIzaSyClO51g8pLssQ2tS22bo70ZO05m3tA1qPU';

// Sample data
const deals = [
  { dealName: "Deal A", status: "COLD", stage: "NEW", contactName: "John Doe", phone: "083861327170", email: "john@example.com" },
  { dealName: "Deal B", status: "WARM", stage: "INITIALMEETING", contactName: "Jane Smith", phone: "083861327171", email: "jane@example.com" },
  { dealName: "Deal C", status: "HOT", stage: "NEGO", contactName: "Emily Johnson", phone: "083861327172", email: "emily@example.com" },
  { dealName: "Deal D", status: "DEAL", stage: "DEAL", contactName: "Michael Brown", phone: "083861327173", email: "michael@example.com" },
  { dealName: "Deal E", status: "LOST", stage: "PAYMENT", contactName: "Sarah Davis", phone: "083861327174", email: "sarah@example.com" }
];

const Modal = ({ isOpen, onClose, children, onRegenerate, phoneNumber, email, message }) => {
  if (!isOpen) return null;

  const handleWhatsAppClick = () => {
    if (phoneNumber && message) {
      const messageHtml = ReactDOMServer.renderToStaticMarkup(<div>{message}</div>);
      const plainTextMessage = messageHtml.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
      const encodedMessage = encodeURIComponent(plainTextMessage);
      const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(url, '_blank');
    }
  };

  const handleEmailClick = () => {
    if (email && message) {
      const messageHtml = ReactDOMServer.renderToStaticMarkup(<div>{message}</div>);
      const plainTextMessage = messageHtml.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
      const encodedMessage = encodeURIComponent(plainTextMessage);
      const mailtoUrl = `mailto:${email}?subject=Generated Message&body=${encodedMessage}`;
      window.open(mailtoUrl, '_blank');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div>{children}</div>
        {onRegenerate && (
          <button className="regenerate-button" onClick={onRegenerate}>
            Regenerate
          </button>
        )}
        {phoneNumber && (
          <button className="whatsapp-button" onClick={handleWhatsAppClick}>
            Send via WhatsApp
          </button>
        )}
        {email && (
          <button className="email-button" onClick={handleEmailClick}>
            Send via Email
          </button>
        )}
      </div>
    </div>
  );
};

const SoekarndoBot = () => {
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
    const parts = text.split(/(\*.*?\*|_.*?_|\n)/).filter(part => part.trim() !== "");
    return parts.map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return <strong key={index}>{part.slice(1, -1)}</strong>;
      } else if (part.startsWith("_") && part.endsWith("_")) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      } else if (part.startsWith("\n")) {
        return <br key={index} />;
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
  };

  const handleDealClick = (deal) => {
    fetchData(deal);
    setSelectedDeal(deal);
  };

  return (
    <div className="chatbot-container">
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
              <th>Action</th>
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
                  <button onClick={() => handleDealClick(deal)}>Generate Message</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRegenerate={() => fetchData(selectedDeal)}
        phoneNumber={selectedDeal ? selectedDeal.phone : null}
        email={selectedDeal ? selectedDeal.email : null}
        message={generatedMessage}
      >
        <strong>Generated Message:</strong>
        <div>{generatedMessage}</div>
      </Modal>
    </div>
  );
};

export default SoekarndoBot;
