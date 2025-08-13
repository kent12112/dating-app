import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";

const MyProfile = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:5000/api/auth/me`, {
        headers: {"x-auth-token": token},
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.log(err));
  }, []);

  if (!user) return <div>User not found</div>;

  return (
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
      </div>
    </div>
  )
}

export default  MyProfile;