import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";

const ReceivedLikes = () => {
  const [likedByUsers, setLikedByUsers] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchLikes = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return
      }
      try {
        const res =  await axios.get("http://localhost:5000/api/user/likes-received", {
          headers: {"x-auth-token": token},
        });
        console.log(res.data.likes);
        setLikedByUsers(res.data.likes || []);
        console.log(likedByUsers);
      } catch (err) {
        console.error("Failed to fetch received likes:", err.response?.data || err.message);
        setLikedByUsers([]);
      }
    }
    fetchLikes();
  }, []);

  const handleMatch = async (otherUserId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/user/match/${otherUserId}`,
        {},
        {
          headers: {"x-auth-token": token},
        }
      );
      //remove matched user from the like received list
      setLikedByUsers(prev => prev.filter(user => user._id != otherUserId));
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
          likedByUsers.map(user => (
            <div
              key={user._id} 
              className="w-[220px] h-[300px] border border-gray-300 rounded flex flex-col bg-white transition duration-200 ease-in-out hover:shadow-lg hover:scale-105 items-center"
            >
              <Link
                to={`/app/user/${user._id}`}
                className="w-[210px] h-[250px] flex flex-col bg-white p-3 transition duration-200 ease-in-out hover:scale-105"
              >
                <div className="flex justify-center">
                  <img 
                    src={`http://localhost:5000${user.photos?.[0] || 'default-photo.jpg'}`}
                    alt={user.name} 
                    className="w-[180px] h-[200px] object-cover rounded" />
                </div>
                <h2 className="text-lg font-semibold text-black text-center">
                  {user.name}, {user.age}
                </h2>
              </Link>
              <button
                onClick={() => handleMatch(user._id)}
                className="mt-2 w-full py-1 rounded text-white bg-purple-400 hover:bg-purple-500"
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