import {useEffect, useState, useCallback} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";


const Profile = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  //this local state holds the editable form values
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    nationality: "",
    languages: "",
    height: "",
    location: "",
    lookingFor: "",
    bio: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [message, setMessage] = useState("");

  const { user: clerkUser } = useUser();
  const clerk = useClerk(); 

  //load profile on component mount
  //uses axios to GET the user's profile from /api/user/profile
  //sets the data into the form using setFormData
  useEffect(() => {
    if (!clerkUser) return; 

    const fetchProfile = async () => {
      const token = await getToken();
      if (!token) return; 
      try {
        const res = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }, 
        });
        setFormData(res.data);
        setUploadedPhotos(res.data.photos || []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, [clerkUser, clerk]);
  //when the user types
  //tracks what the user types into each field.
  //updates the corresponding key in formData
  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };
  //when the usere clicks "update profile"
  //sends PUT request to the backend with updated form data
  //on success, updates the global user state and shows profile updated!

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) return; 
    try {
      const res = await axios.put(
        "http://localhost:5000/api/user/profile",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/app");

    } catch (err) {
      console.log(err);
      setMessage("Update failed");
    }
  };

  //photo upload
  const handlePhotoUpload = async (e) => {
    const token = await getToken(); 
    if (!token) return;
    //calculate how many photos
    const maxPhotos = 6;
    const availableSlots = maxPhotos - uploadedPhotos.length;

    const files = Array.from(e.target.files)
    if (availableSlots <= 0) {
      setMessage("You have reached the maximum of 6 photos");
      return;
    }
    //only allow up to availableSlots file to be uploaded
    const filesToUpload = files.slice(0, availableSlots)
    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const res = await axios.post(
        "http://localhost:5000/api/user/upload",
        formData,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploadedPhotos(res.data.photos);
      setMessage(res.data.msg || "Photos uploaded!");
      e.target.value = null;
    } catch (err) {
      console.error(err);
      setMessage("Photo upload failed");
    }
  };

  //photo delete
  const handleDeletePhoto = async (photoPath) => {
    const token = await getToken(); 
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/user/photo`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {photoPath}, // send photo path in body
        }
      );
      //refetch user profile
      const res = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedPhotos(res.data.photos || []);
      setMessage("Photo deleted!");
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete photo");
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
       {/*LEFT SIDE*/}
      <div className="md:basis-4/12">
        {/*Upload button*/}
        <div>
          <label 
            className="text-3xl text-gray-500 hover:text-purple-600 cursor-pointer transition-colors duration-300 select-none"
            htmlFor="photo-upload">+
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            />
        </div>
        {/* uploaded photo previews*/}
        {uploadedPhotos.length > 0 && (
          <div className="flex flex-wrap gap-4 w-full rounded-md justify-center">
            {uploadedPhotos.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  key={idx}
                  src={`http://localhost:5000${url}`}
                  alt={`Uploaded ${idx}`}
                  className="w-[200px] h-[300px] object-cover"
                />
                <button
                  onClick={() => handleDeletePhoto(url)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
                  title="Delete photo"
                  >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Profile form */}
        {/*RIGHT SIDE*/}
      <form onSubmit={handleSubmit} className="md:basis-8/12">
        <p className="w-full font-semibold">Name</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="name" value={formData.name || ""} onChange={handleChange} placeholder="Name" className="bg-white w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Age</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="age" value={formData.age || ""} onChange={handleChange} placeholder="Age" className="bg-white w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Gender</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="gender" value={formData.gender || ""} onChange={handleChange} placeholder="Gender" className="bg-white  w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Nationality</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="nationality" value={formData.nationality || ""} onChange={handleChange} placeholder="Nationality" className="bg-white  w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Languages</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="languages" value={formData.languages || ""} onChange={handleChange} placeholder="Languages" className="bg-white  w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Height</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="height" value={formData.height || ""} onChange={handleChange} placeholder="Height" className="bg-white  w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Where do you live?</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="location" value={formData.location || ""} onChange={handleChange} placeholder="Location" className="bg-white w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">What I am looking for...</p>
        <div className="border border-solid border-gray-400 mb-2">
        <textarea name="lookingFor" value={formData.lookingFor || ""} onChange={handleChange} placeholder="Looking For..." className="bg-white  w-full h-[100px]"/>
        </div>
        <p className="w-full font-semibold">Tell us about yourself</p>
        <div className="border border-solid border-gray-400">
        <textarea name="bio" value={formData.bio || ""} onChange={handleChange} placeholder="Bio" className="bg-white  w-full h-[100px]"/>
        </div>
        <br />
        <button type="submit" className="bg-purple-300">Update Profile</button>
      </form>
    </div>
  );
};

export default Profile;