import {Link, Outlet} from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown";
//Outlet: tells the app, render the child route compoent here
const DashboardLayout = () => {
  return (
    <div style={{padding: "20px"}}>
      {/*Header*/}
      <div className="fixed inset-x-0 top-0 h-[60px] bg-white border-t p-4 flex justify-around items-center md:hidden z-50">
        <div className="flex-grow">
        </div>
        <div>
          <ProfileDropdown />
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 h-[60px] md:top-0 md:bottom-auto bg-white border-t md:border-b md:border-t-0 p-4 flex justify-around">
        <Link to="/app" style={{marginRight: "10px"}}>🏠</Link>
        <Link to="/app/likes-received" style={{marginRight: "10px"}}>❤️</Link>
        <Link to="/app/matches" style={{marginRight: "10px"}}>💬</Link>
        <div className="hidden md:block" style={{marginRight: "10px"}}>
          <ProfileDropdown />
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