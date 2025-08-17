import {useEffect, useState} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Ruler, Flag, Languages, MapPin } from "lucide-react";
import axios from "axios";
import Slider from "react-slick"
import { useUser, useClerk } from "@clerk/clerk-react";;

const settings = {
  dots: true,
  infinite: true,
  slidesToShow: 3,
  slidesToScroll: 1,
  centerMode: false,
  variableWidth: false,
};

const UserDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {id} = useParams();
  const { user } = useUser();
  const clerk = useClerk();

  const fromMatches = location.state?.fromMatches === true;
  const [userData, setUserData] = useState(null);
  const[likedUsers, setLikedUsers] = useState([]);

  async function getToken() {
    return await clerk.session.getToken();
  }
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const token = await getToken(); // ✅ Clerk token

      try {
        // Fetch user details
        const userRes = await axios.get(
          `http://localhost:5000/api/user/${id}`,
          { headers: { Authorization: `Bearer ${token}` } } // ✅ Authorization header
        );
        setUserData(userRes.data);

        // Fetch likes
        const likesRes = await axios.get(
          `http://localhost:5000/api/user/likes-sent`,
          { headers: { Authorization: `Bearer ${token}` } } // ✅ Authorization header
        );
        setLikedUsers(likesRes.data.likeSent || []);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchData();
  }, [id, user]);

  // Handle like button click
  const handleLike = async (userId) => {
    const token = await getToken();
    try {
      await axios.post(
        `http://localhost:5000/api/user/like/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikedUsers((prev) => [...prev, userId]);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  if (!userData) return <div>User not found</div>;

  return (
    <div>
      {/* Exit button container */}
      <div className="flex justify-between w-full mb-4 items-center">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold"
        >
          {"<"} Back
        </button>
        {fromMatches && (
          <button
            onClick={() => handleLike(userData._id)}
            disabled={likedUsers.includes(userData._id)}
            className={`py-1 px-4 rounded text-white ${
              likedUsers.includes(userData._id)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
             {likedUsers.includes(userData._id) ? "Liked" : "Like"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[30%_70%] w-full gap-4 p-10">
          {/* left side */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <img 
                src={ userData.photos && userData.photos.length > 0
                  ? `http://localhost:5000${userData.photos[0]}`
                  : `http://localhost:5000/uploads/default-photo.jpg`} 
                alt={userData.name}
                className="w-full max-h-[500px] object-cover rounded"
              />
            </div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4"><Ruler className="w-5 h-5 text-gray-500 mr-[5px]"/>{userData.height}</div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4"><Flag className="w-5 h-5 text-gray-500 mr-[5px]"/>{userData.nationality}</div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4"><Languages className="w-5 h-5 text-gray-500 mr-[5px]"/> {userData.languages}</div>
          </div>
          {/* right side */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[30px] font-bold">{userData.name}, {userData.age}</div>
              <div className="text-[20px] flex items-center"><MapPin className="w-5 h-5 text-gray-500 mr-[5px]"/> {userData.location}</div>
            </div>
            <div className="bg-white border rounded flex flex-col p-4">
              <p className="text-gray-700 text-[15px] font-bold">About Me</p>
              <p>{userData.bio}</p>
            </div>
            <div className="bg-white border rounded flex flex-col p-4">
              <p className="text-gray-700 text-[15px] font-bold">Looking For</p>
              <p>{userData.lookingFor}</p>
            </div>
            {/* put more photos */}
            {userData.photos && userData.photos.length > 1 && (
              <Slider {...settings}>
                {userData.photos.slice(1).map((photo, i) => (
                  <div key={i} className="px-1">
                    <div
                      className="flex items-center justify-center rounded overflow-hidden"
                      style={{ height: 250 }}
                    >
                      <img
                        src={`http://localhost:5000${photo}`}
                        alt={`Photo ${i + 1}`}
                        className="max-w-full max-h-full object-cover rounded"
                      />
                    </div>
                  </div>
                ))}
              </Slider>
            )}
          </div>
        </div>
    </div>
  )
}

export default UserDetail;