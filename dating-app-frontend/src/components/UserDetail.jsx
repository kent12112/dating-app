import {useEffect, useState} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Slider from "react-slick";

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

  const fromMatches = location.state?.fromMatches === true;
  const [user, setUser] = useState(null);
  const[likedUsers, setLikedUsers] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");

    // Fetch user details
    axios
      .get(`http://localhost:5000/api/user/${id}`, {
        headers: { "x-auth-token": token },
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err));

    // Optionally fetch liked users if you want to check liked state
    axios
      .get(`http://localhost:5000/api/user/likes-sent`, {
        headers: { "x-auth-token": token },
      })
      .then((res) => setLikedUsers(res.data.likeSent || []))
      .catch((err) => console.log(err));
  }, [id]);

  // Handle like button click
  const handleLike = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `http://localhost:5000/api/user/like/${userId}`,
        {},
        { headers: { "x-auth-token": token } }
      );
      setLikedUsers((prev) => [...prev, userId]);
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  if (!user) return <div>User not found</div>;

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
            onClick={() => handleLike(user._id)}
            disabled={likedUsers.includes(user._id)}
            className={`py-1 px-4 rounded text-white ${
              likedUsers.includes(user._id)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
             {likedUsers.includes(user._id) ? "Liked" : "Like"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[30%_70%] w-full gap-4 p-10">
          {/* left side */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-center">
              <img 
                src={ user.photos && user.photos.length > 0
                  ? `http://localhost:5000${user.photos[0]}`
                  : `http://localhost:5000/uploads/default-photo.jpg`} 
                alt={user.name}
                className="w-full max-h-[500px] object-cover rounded"
              />
            </div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4">5'7</div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4">{user.nationality}</div>
            <div className="h-[50px] bg-white border rounded flex items-center p-4">{user.languages}</div>
          </div>
          {/* right side */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[30px] font-bold">{user.name}, {user.age}</div>
              <div className="text-[20px]">Tokyo</div>
            </div>
            <div className="bg-white border rounded flex flex-col p-4">
              <p className="text-[20px] font-bold">About Me</p>
              <p>{user.bio}</p>
            </div>
            <div className="bg-white border rounded flex flex-col p-4">
              <p className="text-[20px] font-bold">Looking For</p>
              <p>{user.lookingFor}</p>
            </div>
            {/* put more photos */}
            {user.photos && user.photos.length > 1 && (
              <Slider {...settings}>
                {user.photos.slice(1).map((photo, i) => (
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