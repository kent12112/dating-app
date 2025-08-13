import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom"
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import Profile from "./components/Profile";
import MatchingGrid from "./components/MatchingGrid"; 
import DashboardLayout from "./components/DashboardLayout";
import PrivateRoute from "./components/PrivateRoute";
import UserDetail from "./components/UserDetail";
import ReceivedLikes from "./components/ReceivedLikes";
import MatchesPage from "./components/MatchesPage";
import ChatWindow from "./components/ChatWindow.jsx";
import MyProfile from "./components/MyProfile.jsx";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/register" element={<Register />}/>
        <Route path="/login" element={<Login />}/>
        {/* Protected Routes */}
        <Route 
          path="/app"
          element={
            <PrivateRoute>
              < DashboardLayout/>
            </PrivateRoute>
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
      </Routes>  
    </Router>
  )
}
export default App
