import {Link} from "react-router-dom";

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Dating App</h1>
      <p>
        <Link to="/login">Login</Link> or <Link to="/register">Register</Link>
      </p>
    </div>
  )
};

export default Home;