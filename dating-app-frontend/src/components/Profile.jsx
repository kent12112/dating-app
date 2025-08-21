import {useEffect, useState, useCallback} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./utils/cropImage.jsx"; 
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Select from "react-select";
import countryList from "react-select-country-list";
import ISO6391 from "iso-639-1";
import React, { useMemo } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const options = useMemo(() => countryList().getData(), []);
  const languageOptions = ISO6391.getAllCodes().map(code => ({
    value: code, 
    label: ISO6391.getName(code)
  }));
  const ageOptions = Array.from({ length: 83 }, (_, i) => ({
    value: i + 18,
    label: `${i + 18}`,
  }));
  const heightOptions = Array.from({ length: 91 }, (_, i) => ({
    value: i + 140, // 140 cm to 230 cm
    label: `${i + 140} cm`,
  }));
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "other", label: "Other" },
    { value: "prefer-not-to-say", label: "Prefer not to say" }
  ];
  //this local state holds the editable form values
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    nationality: "",
    languages: [],
    height: "",
    location: "",
    lookingFor: "",
    bio: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [message, setMessage] = useState("");

  // Crop states
  const [selectedImage, setSelectedImage] = useState(null); // raw preview
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

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
        setFormData({
          name: res.data.name || "",
          age: res.data.age || "",
          gender: res.data.gender || "",
          nationality: res.data.nationality || "",
          languages: res.data.languages || "",
          height: res.data.height || "",
          location: res.data.location || "",
          lookingFor: res.data.lookingFor || "",
          bio: res.data.bio || "",
        });
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

  // intercept photo upload -> open cropper
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if(uploadedPhotos.length >= 6) {
      setMessage("You have reached the maximum of 6 photos");
      return;
    }

    const file = files[0];
    setSelectedImage(URL.createObjectURL(file));
    setShowCropModal(true);
    e.target.value = null;
  }
  // Crop complete
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  //save cropped image
  const handleCropSave = async () => {
    const token = await getToken(); 
    if (!token || !croppedAreaPixels || !selectedImage) return;
    try {
      setLoading(true);

      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
      const formDataUpload = new FormData();
      formDataUpload.append("photos", croppedImage);


      const res = await axios.post(
        "http://localhost:5000/api/user/upload",
        formDataUpload,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploadedPhotos(res.data.photos);
      setMessage(res.data.msg || "Photos uploaded!");
    } catch (err) {
      console.error(err);
      setMessage("Photo upload failed");
    } finally {
      setLoading(false);
      setShowCropModal(false);
      setSelectedImage(null);
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(uploadedPhotos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setUploadedPhotos(items);

    try {
      const token = await getToken();
      if (!token) return;

      await axios.put(
        "http://localhost:5000/api/user/photos/order",
        { photos: items },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error("Failed to save photo order:", err);
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
            multiple={false}
            onChange={handlePhotoUpload}
            className="hidden"
            />
        </div>
        {/* uploaded photo previews*/}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="photos" direction="horizontal">
            {(provided) => (
              <div
                className="flex flex-wrap gap-4 items-center justify-center overflow-hidden"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {uploadedPhotos.map((url, index) => (
                  <Draggable key={url} draggableId={url} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative"
                      >
                        <img
                          src={`http://localhost:5000${url}`}
                          alt={`Uploaded ${index}`}
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
        {/* Crop Modal */}
        {showCropModal && selectedImage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="w-[400px] h-[400px] bg-black p-4 rounded-md relative">
            <Cropper
              image={selectedImage}
              crop={crop}               // use state
              zoom={zoom}               // use state
              aspect={2 / 3}
              onCropChange={setCrop}    // update state on drag
              onZoomChange={setZoom}    // optional: update zoom
              onCropComplete={onCropComplete}
              />
              <button
                onClick={handleCropSave}
                disabled={loading}
                className="absolute top-2 left-2  px-2 py-1 bg-gray-600 text-white rounded"
              >
                {loading ? "Uploading..." : "Save"}
              </button>
              <button
                onClick={() => setShowCropModal(false)}
                className="absolute top-2 right-2 px-2 py-1 text-red-500"
              >
                X
              </button>
            </div>
          </div>
        )}
      {/* Profile form */}
        {/*RIGHT SIDE*/}
      <form onSubmit={handleSubmit} className="md:basis-8/12">
        <p className="w-full font-semibold">Name</p>
        <div className="border border-solid border-gray-400 mb-2">
          <input name="name" value={formData.name || ""} onChange={handleChange} placeholder="Name" className="bg-white w-full h-[40px]"/>
        </div>
        <p className="w-full font-semibold">Age</p>
        <div className="border border-solid border-gray-400 mb-2">
          <Select
            options={ageOptions}
            value={ageOptions.find(opt => opt.value === formData.age) || null}
            onChange={(selected) => 
              setFormData(prev => ({...prev, age: selected?.value || ""}))
            }
            placeholder="Select age..."
            isClearable
          >

          </Select>
        </div>
        <p className="w-full font-semibold">Gender</p>
        <div className="border border-solid border-gray-400 mb-2">
          <Select
            options={genderOptions}
            value={genderOptions.find(opt => opt.value === formData.gender) || null}
            onChange={(selected) =>
              setFormData(prev => ({ ...prev, gender: selected?.value || "" }))
            }
            placeholder="Select gender..."
            isClearable
          />
        </div>
        <p className="w-full font-semibold">Nationality</p>
        <div className="border border-solid border-gray-400 mb-2">
          <Select
            options={options}
            value={options.find(opt => opt.value === formData.nationality) || null}
            onChange={(selected) =>
              setFormData(prev => ({...prev, nationality: selected?.value || ""}))
            }
            placeholder="Select nationality..."
            isClearable
          >
          </Select>
        </div>
        <p className="w-full font-semibold">Languages</p>
        <div className="border border-solid border-gray-400 mb-2">
          <Select
            options={languageOptions}
            value={languageOptions.filter(opt => (formData.languages || []).includes(opt.value))}
            onChange={(selected) => 
              setFormData(prev => ({
                ...prev, 
                languages: selected ? selected.map(opt => opt.value) : []
              }))
            }
            isMulti
            placeholder="Select languages..."
          />
        </div>
        <p className="w-full font-semibold">Height</p>
        <div className="border border-solid border-gray-400 mb-2">
          <Select
            options={heightOptions}
            value={heightOptions.find(opt => opt.value === formData.height) || null}
            onChange={(selected) =>
              setFormData(prev => ({ ...prev, height: selected?.value || "" }))
            }
            placeholder="Select height..."
            isClearable
          />
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