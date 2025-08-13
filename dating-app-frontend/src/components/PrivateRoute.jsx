//userContext: lets you access the UserContext to get the current user
//Navigate: from React Router, used to redirect users to another route
//UserContext: stores the current logged-in user info
import {useContext} from "react";
import {Navigate} from "react-router-dom";
import {UserContext} from "../context/UserContext";

//children: whatever component you are trying to protect(e.g. profile)
// user ? children: if a user exists, show the protected page
// if user is null, redirect to login page
const PrivateRoute = ({children}) => {
  const {user} = useContext(UserContext);
  return user ? children: <Navigate to="/login"/>
}

export default PrivateRoute;