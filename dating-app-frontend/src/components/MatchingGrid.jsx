import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Heart, HeartOff } from "lucide-react"; 

// Helper function: Haversine formula (distance in km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) + 
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const LOCATION_CACHE_KEY = "cachedUserLocation";
const LOCATION_DISTANCE_THRESHOLD_KM = 0.1; // 100 meters

const MatchingGrid = () => {
  const [users, setUsers] = useState([]);
  const [likedUsers, setLikedUsers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const { user } = useUser();
  const clerk = useClerk();

  async function getToken() {
    return await clerk.session.getToken();
  }

  // Load cached location from localStorage
  function getCachedLocation() {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }
  // Save location to localStorage
  function cacheLocation(location) {
    try {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
    } catch {}
  }

  // Fetch users + likes and sort by distance
  async function fetchUsers(lat, lon) {
    const token = await getToken();
    if (!token) return;

    try {
      const [usersRes, likesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/user/all", { 
          headers: { "Authorization": `Bearer ${token}` },
          params: {latitude: lat, longitude: lon}
         }),
        axios.get("http://localhost:5000/api/user/likes-sent", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      setLikedUsers(likesRes.data.likeSent || []);

      const sortedUsers = usersRes.data
        .filter(u => u.location?.coordinates?.length === 2)
        .map(user => {
          const [longitude, latitude] = user.location.coordinates; 
          return {
            ...user,
            distance: getDistanceFromLatLonInKm(lat, lon, latitude, longitude), 
          };
        })
        .sort((a, b) => a.distance - b.distance);

      setUsers(sortedUsers);

    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
  
    const cachedLocation = getCachedLocation();
    if (cachedLocation) {
      setCurrentLocation(cachedLocation);
      fetchUsers(cachedLocation.latitude, cachedLocation.longitude);
    } else {
      setLoading(true);
    }
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationDenied(false);
  
          const movedFar =
            !cachedLocation ||
            getDistanceFromLatLonInKm(
              cachedLocation.latitude,
              cachedLocation.longitude,
              latitude,
              longitude
            ) > LOCATION_DISTANCE_THRESHOLD_KM;
  
          // ✅ Always update backend location
          try {
            const token = await getToken();
            await axios.post(
              "http://localhost:5000/api/user/location",
              { latitude, longitude },
              { headers: { "Authorization": `Bearer ${token}` } }
            );
          } catch (err) {
            console.error("Failed to update location", err);
          }

          // ✅ Always fetch users
          fetchUsers(latitude, longitude);
  
          // ✅ Only update cache & re-sort if moved far enough
          if (movedFar) {
            setCurrentLocation({ latitude, longitude });
            cacheLocation({ latitude, longitude });
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setLocationDenied(true);
          setLoading(false);
        }
      );
    } else {
      console.error("Geolocation not supported");
      setLocationDenied(true);
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (locationDenied) return <div>Please allow location services to see other users.</div>;

  //handle the like request
const handleLike = async(userId) => {
  const token = await getToken();
  try {
    const res = await axios.post(`http://localhost:5000/api/user/like/${userId}`, {}, {
      headers: {"Authorization": `Bearer ${token}`},
    });

    setLikedUsers((prev) => [...prev, userId]);

    if (res.data.message === "It's a match!") {
      navigate(`/app/chat/${userId}`)
    } else {
      console.log(res.data.message);
    }
  } catch (err) {
    console.error("Liked failed", err);
  }
}

  return (
    <div className="flex flex-wrap justify-center gap-4 p-4">
      {users.map(user => (
        <div
        key={user._id}
        className="w-[220px] h-[300px] border border-gray-300 rounded flex flex-col bg-white transition duration-200 ease-in-out hover:shadow-lg hover:scale-105 items-center"
        >
          <Link 
            to={`/app/user/${user._id}`}
            state={{fromMatches: true}}
            className="w-[210px] h-[250px] flex flex-col bg-white p-3 transition duration-200 ease-in-out hover:scale-105">
            <div className="flex justify-center">
              <img src={
                    user.photos && user.photos.length > 0
                      ? `http://localhost:5000${user.photos[0]}`
                      : `http://localhost:5000/uploads/default-photo.jpg`
                      } 
                    alt={user.name} 
                    className="w-[170px] h-[220px] object-cover rounded"/>
            </div>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black">
                {user.name}, {user.age}
              </h2>
              <span className="text-sm text-gray-600">
                {user.distance >= 1
                    ? `${user.distance.toFixed(1)} km`
                    : `${Math.round(user.distance * 1000)} m`}
              </span>
            </div>
          </Link>
          <div className="flex w-full justify-end">
            <button
              onClick={() => handleLike(user._id)}
              disabled={likedUsers.includes(user._id)}
              className="mt-2 mr-2 py-[2px] px-[2px] rounded-2xl bg-red-400"
            >
            {likedUsers.includes(user._id) ? (<HeartOff className="w-6 h-6 text-gray-300" />) : (<Heart className="w-6 h-6 text-white fill-white" />)}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


export default MatchingGrid;