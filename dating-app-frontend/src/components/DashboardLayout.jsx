import {Link, Outlet, useNavigate} from "react-router-dom";
import { UserButton, useUser, useAuth } from "@clerk/clerk-react"; // Clerk user menu
import { useEffect, useState } from "react";
//Outlet: tells the app, render the child route compoent here

const DashboardLayout = () => {
  const { user } = useUser(); 
  const { getToken } = useAuth();
  const navigate = useNavigate(); 
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!user || initialized) return; // only run once
    setInitialized(true);
    async function initUser() {
      if (!user) return;

      try {
        // Get a session token (no template needed)
        const token = await getToken();

        // Use the token in your API request
        const response = await fetch("http://localhost:5000/api/user/init", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = await response.json();
        if (userData.isNewUser){
          navigate("/app/edit-profile");
        }
      } catch (error) {
        console.error("Failed to initialize user –", error);
      }
    }

    initUser();
  }, [user, getToken]);

  return (
    <div style={{padding: "20px"}}>
      {/*Header*/}
      <div className="fixed inset-x-0 top-0 h-[60px] bg-gray-100 border-t p-4 flex justify-around items-center md:hidden z-50">
        <div className="flex-grow">
        </div>
        <div>
            <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="View my profile"
                labelIcon="👤"
                onClick={() =>  navigate("/app/view-profile")}
              />
              <UserButton.Action
                label="Edit my profile"
                labelIcon="👤"
                onClick={() => navigate("/app/edit-profile")} 
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 h-[60px] md:top-0 md:bottom-auto bg-gray-100 border-t md:border-b md:border-t-0 p-4 flex justify-around z-50">
        <Link to="/app" style={{marginRight: "10px"}}>🏠</Link>
        <Link to="/app/likes-received" style={{marginRight: "10px"}}>❤️</Link>
        <Link to="/app/matches" style={{marginRight: "10px"}}>💬</Link>
        <div className="hidden md:block" style={{marginRight: "10px"}}>
          <UserButton>
          <UserButton.MenuItems>
            <UserButton.Action
              label="View my profile"
              labelIcon="👤"
              onClick={() =>  navigate("/app/view-profile")}
            />
            <UserButton.Action
              label="Edit my profile"
              labelIcon="👤"
              onClick={() =>  navigate("/app/edit-profile")}
            />
          </UserButton.MenuItems>
        </UserButton>
        </div>
      </nav>
      {/* Page content */}
      <main className="flex-1 p-4 mt-[40px] mb-16 md:mb-0">
      <Outlet />
      </main>
    </div>
    );
}

export default DashboardLayout;