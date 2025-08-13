import { useParams, useNavigate } from "react-router-dom";
import {useEffect, useState} from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";

export default function ChatWindow() {
  const navigate = useNavigate();
  const {matchId} = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:5000/api/messages/conversation/${matchId}`,
        {headers: {"x-auth-token": token}}
      );
      setUserName(res.data.userName)
      setMessages(res.data.message)
    };
    fetchMessages();
  }, [matchId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");
    await axios.post(
      `http://localhost:5000/api/messages/send/`,
      {
        recipientId: matchId,
        content: text
      },
      {headers: {"x-auth-token": token}}
    );
    setMessages(prev => [...prev, {sender: "me", content: text, createdAt: new Date().toISOString()}]);
    setText("");
  };

  return (
    <div className="flex flex-col  h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
         X
        </button>
        <div>
          <Link to={`/app/user/${matchId}`} className="text-black font-bold">{userName}</Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.map((msg, idx) => {
           const date = msg.createdAt
           ? format(parseISO(msg.createdAt), "MM/dd/yyyy")
           : "";
          const time = msg.createdAt
            ? format(parseISO(msg.createdAt), "hh:mm a")
            : "";

          return (
            <div
              key={idx}
              className={`mb-2 flex ${
                msg.sender === matchId ? "justify-start" : "justify-end"
              }`}
            >
              <div className="flex flex-col max-w-[70%]">
                <div
                  className={`p-2.5 rounded-2xl ${
                    msg.sender === matchId
                      ? "bg-gray-300 text-left"
                      : "bg-purple-500 text-white text-right"
                  }`}
                >
                  {msg.content}
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                    {date}
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                    {time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t flex">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 border p-2 rounded mr-2"
        />
        <button
          onClick={sendMessage}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>

  )
}
