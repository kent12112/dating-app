//what this file does
//it creates a context to:
//1, keep track of the current user across the app
//2, load the user if there's a saved token in localStorage
//3, allow other components to log the user out
//4, make user and setUser accessible from anywhere using useContext

//createContext: makes a context object that we'll share globally
//useState: to store the current user data
//useEffect: to run a side effect on app startup(eg. check if user is already logged in)
//axios: for making HTTP requests to your backend
import {createContext, useState, useEffect} from "react";
import axios from "axios";

//creates the context
export const UserContext = createContext();
//this wraps your whole app and provides the user state to its children
export const UserProvider = ({children}) => {
  const [user, setUser] = useState(null);

  //load user info on app start if token exists
  //on component mount(just once)
  //1, gets token from localStorage
  //2, if token exits, it makes a GET request to fetch the current user
  //3, if successful, sets the user with the returned data
  //4, if token is incalid or request fails, it sets user to null
  // this is how the app stays logged in across page reloads
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/auth/me", {
          headers: {"x-auth-token": token}
        })
        .then(res => setUser(res.data))
        .catch(() => setUser(null));
    }
  }, []);
  //1, clears token from local storage
  //2, clear user state
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  //this makes {user, setUser, logout} available to any component wrapped in UserProvider
  //children: everything inside this provider in your app
  
  return (
    <UserContext.Provider value={{user, setUser, logout}}>
      {children}
    </UserContext.Provider>
  );
}

