import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import axios from "axios";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/user/matches", {
        headers: {"x-auth-token": token}
      });
      const sortedMatches = res.data.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      })
      setMatches(sortedMatches);
    };
    fetchMatches();
  }, []);

  return (
    <div className="flex flex-wrap gap-4 p-4 justify-center">
      <div className="text-[30px] font-bold mb-5">Messages</div>
      {matches.map(match => (
        <Link
        to={`/app/chat/${match._id}`}
        key={match._id}
        className="w-full p-3 bg-white shadow rounded hover:scale-105 transition"
      >
        <div className="flex items-center p-1 bg-white">
          <img
            src={match.photos?.[0]
              ? `http://localhost:5000${match.photos[0]}`
              : `http://localhost:5000/uploads/default-photo.jpg`}
            alt={match.name}
            className="w-[100px] h-[100px] object-cover rounded-full flex-shrink-0"
          />
          <div className="ml-4 flex flex-col flex-1">
            <h2 className="text-lg text-black font-semibold ml-4">{match.name}</h2>
            <p className="text-sm text-gray-600 truncate">
              {match.lastMessage || ""}
            </p>
          </div>
        </div>
      </Link>
      ))}
    </div>
  );
}