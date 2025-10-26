
import { Outlet } from "react-router-dom";
import NavBar from "./Navbar.tsx";
import BreadcrumbsBar from "./BreadcrumbsBar.tsx";

const MainLayout: React.FC = () => {
  return (
    <>
      <NavBar />
      <BreadcrumbsBar />
      <Outlet /> {/* renders the child route content */}
    </>
  );
};

export default MainLayout;