import {useState} from "react";
import axios from "axios";

const Register = () => {
  //formData: the current value of the state
  //setFormData: a function you use to update that state
  //you use useState when you want your component to
  //1, remember something between renders
  //2, react to user input or events
  //3, uodate the UI when something changes
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  //tgese manage messages shown to the user depending on what happens
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  //this runs every time an input changes
  //this function is attached to the "onChange" event
  const handleChange = (e) => {
    setFormData((prev) => ({
      //...copies all previous values
      //[e.target.name]: updates only the field the user changed
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }; 
  //e.preventDefault(): stops the page from refreshing
  const handleSubmit = async (e) => {
    e.preventDefault();
    //baasic validation before sending anything
    if (!formData.name || !formData.email || !formData.password){
      setError("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      //save the returned JWT token in localStorage for later use
      localStorage.setItem("token", res.data.token);
      setSuccess("Registration successful!");
      setError("");
    } catch (err) {
      //?: try to get msg, but don't crush if response or date is mising. just return undefined instead
      setError(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <p style={{color: "red"}}>{error}</p>}
      {success && <p style={{color: "green"}}>{success}</p>}
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <br />
      <input
         type="email"
         name="email"
         placeholder="Email"
         value={formData.email}
         onChange={handleChange}
         required
      />
      <br />
      <input
         type="password"
         name="password"
         placeholder="Password"
         value={formData.password}
         onChange={handleChange}
         required
      />
      <br />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;