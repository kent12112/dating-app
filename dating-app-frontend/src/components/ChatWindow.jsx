import { useParams, useNavigate } from "react-router-dom";
import {useEffect, useState, useRef} from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useUser, useClerk } from "@clerk/clerk-react";
import { io } from "socket.io-client";

export default function ChatWindow() {
  const navigate = useNavigate();
  const {matchId} = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [userName, setUserName] = useState("");
  const { user } = useUser(); 
  const clerk = useClerk(); 
  const bottomRef = useRef(null);
  const socketRef = useRef(null); 

  const getToken = async () => {     
    if (!clerk || !clerk.session) return null;
    return await clerk.session.getToken();     
  };

  if (!user) return null;
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = await getToken();
      if (!token) return;
  
      const res = await axios.get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUserId(res.data.mongoId);
    };
    fetchCurrentUser();
  }, []);

  // ✅ fetch previous messages & userName
  useEffect(() => {
    const fetchMessages = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/conversation/${matchId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(res.data.messages || []);
        setUserName(res.data.userName || "User"); // ✅ set matched user name
      } catch (err) {
        console.error("Failed to fetch messages:", err.response?.data || err.message);
      }
    };
    fetchMessages();
  }, [matchId, user, clerk]);


  // SOCKET.IO real-time updates
  useEffect(() => {
    if (!currentUserId) return; 
    socketRef.current = io("http://localhost:5000");
    const socket = socketRef.current;

    // ✅ set up listeners first
    socket.on("receiveMessage", (msg) => setMessages(prev => [...prev, msg]));


    const roomId = [currentUserId, matchId].sort().join("_");
    socket.emit("joinRoom", roomId);
  
    return () => {
      socket.off("receiveMessage");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [loading, setLoading] = useState(false);
  const sendMessage = async () => {
    if (!text.trim() || loading) return; // prevent empty or double clicks
    setLoading(true);

    const token = await getToken();          
    if (!token) {                           
      console.error("No Clerk token found"); 
      return;                          
    }


    try {
      const res = await axios.post(
        `http://localhost:5000/api/messages/send/`,
        { recipientId: matchId, content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err.response?.data || err.message);
    } finally {
      setLoading(false); // re-enable button
    }
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
           const isMe = msg.senderClerkId === user.id;
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
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex flex-col max-w-[70%]">
                <div
                  className={`p-2.5 rounded-2xl ${
                    isMe
                      ? "bg-purple-500 text-white text-right"
                      : "bg-gray-300 text-left"
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
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 border p-2 rounded mr-2 bg-gray-300"
          placeholder="Text..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>

  )
}
