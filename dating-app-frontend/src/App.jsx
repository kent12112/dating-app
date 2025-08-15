import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import Home from "./components/Home";
import Profile from "./components/Profile";
import MatchingGrid from "./components/MatchingGrid"; 
import DashboardLayout from "./components/DashboardLayout";
import UserDetail from "./components/UserDetail";
import ReceivedLikes from "./components/ReceivedLikes";
import MatchesPage from "./components/MatchesPage";
import ChatWindow from "./components/ChatWindow.jsx";
import MyProfile from "./components/MyProfile.jsx";
function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Home />}/>
        {/* Protected Routes using Clerk*/}
        <Route 
          path="/app"
          element={
            <SignedIn>
              < DashboardLayout/>
            </SignedIn>
          }
        >
          <Route index element={<MatchingGrid/>}/>
          <Route path="user/:id" element={<UserDetail/>}/>
          <Route path="edit-profile" element={<Profile/>}/>
          <Route path="view-profile" element={<MyProfile/>}/>
          <Route path="likes-received" element={<ReceivedLikes/>}/>
          <Route path="matches" element={<MatchesPage/>}/>
          <Route path="chat/:matchId" element={<ChatWindow/>}/>
        </Route>
        {/* Redirect signed-out users to Clerk Sign In */}
        <Route
          path="/app/*"
          element={<RedirectToSignIn />}
        />
      </Routes>  
    </Router>
  )
}
export default App
