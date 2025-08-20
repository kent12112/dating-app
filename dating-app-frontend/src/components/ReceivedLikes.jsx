import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react";

const ReceivedLikes = () => {
  const [likedByUsers, setLikedByUsers] = useState([]);
  const navigate = useNavigate();
  const { user } = useUser();
  const clerk = useClerk(); 

  const getToken = async () => { 
    if (!clerk || !clerk.session) return null; 
    return await clerk.session.getToken();
  };

  useEffect(() => {
    if (!user) return;

    const fetchLikes = async () => {
      const token = await getToken();
      if (!token) {
        console.error("No Clerk token found");
        return
      }
      try {
        const res =  await axios.get("http://localhost:5000/api/user/likes-received", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLikedByUsers(res.data.likes || []);
      } catch (err) {
        console.error("Failed to fetch received likes:", err.response?.data || err.message);
        setLikedByUsers([]);
      }
    }
    fetchLikes();
  }, [user, clerk]);

  const handleMatch = async (otherUserId) => {
    const token = await getToken();
    if (!token) {
      console.error("No Clerk token found");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/user/match/${otherUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      //remove matched user from the like received list
      setLikedByUsers(prev => prev.filter(user => user._id !== otherUserId));
      navigate(`/app/chat/${otherUserId}`);
    } catch (err) {
      console.error("Failed to match user:", err.response?.data || err.message);
    }
  }

  return (
    <div>
      <h1 className="text-[30px] font-bold mb-5">Likes You</h1>
      <div className="flex flex-wrap gap-4 justify-center">
      {likedByUsers.length === 0 ? (
          <p className="text-gray-600 text-center">You haven't received any likes yet.</p>
        ) : (
          likedByUsers.map(u => (
            <div
              key={u._id} 
              className="w-[220px] h-[300px] border border-gray-300 rounded flex flex-col bg-white transition duration-200 ease-in-out hover:shadow-lg hover:scale-105 items-center"
            >
              <Link
                to={`/app/user/${u._id}`}
                className="w-[210px] h-[250px] flex flex-col bg-white p-3 transition duration-200 ease-in-out hover:scale-105"
              >
                <div className="flex justify-center">
                  <img 
                    src={`http://localhost:5000${u.photos?.[0] || 'default-photo.jpg'}`}
                    alt={u.name} 
                    className="w-[180px] h-[200px] object-cover rounded" />
                </div>
                <h2 className="text-lg font-semibold text-black text-center">
                  {u.name}, {u.age}
                </h2>
              </Link>
              <button
                onClick={() => handleMatch(u._id)}
                className="mt-2 w-full py-1 rounded text-white bg-red-400 hover:bg-red-500"
              >
                Match
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReceivedLikes;