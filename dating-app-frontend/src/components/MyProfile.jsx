import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import { useUser, useClerk } from "@clerk/clerk-react";
import Slider from "react-slick";

const MyProfile = () => {
  const [userData, setUserData] = useState(null);
  const { user } = useUser(); 
  const clerk = useClerk(); 
  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: false,
    variableWidth: false,
  };
  const getToken = async () => { 
    if (!clerk || !clerk.session) return null;
    return await clerk.session.getToken();
  };
  
  useEffect(() => {
    if (!user) return; 

    const fetchUser = async () => {
      const token = await getToken(); 
      if (!token) {
        console.error("No Clerk token found"); 
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }, 
        });
        setUserData(res.data); 
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
  }, [user, clerk]);

  if (!userData) return <div>User not found</div>;

  return (
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
        <div className="h-[50px] bg-white border rounded flex items-center p-4">{userData.height}</div>
        <div className="h-[50px] bg-white border rounded flex items-center p-4">{userData.nationality}</div>
        <div className="h-[50px] bg-white border rounded flex items-center p-4">{userData.languages}</div>
      </div>
      {/* right side */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="text-[30px] font-bold">{userData.name}, {userData.age}</div>
          <div className="text-[20px]">{userData.location}</div>
        </div>
        <div className="bg-white border rounded flex flex-col p-4">
          <p className="text-[20px] font-bold">About Me</p>
          <p>{userData.bio}</p>
        </div>
        <div className="bg-white border rounded flex flex-col p-4">
          <p className="text-[20px] font-bold">Looking For</p>
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
  )
}

export default  MyProfile;