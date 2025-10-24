// import "./App.css";

// function App() {
//   return (
//     <>
//       <h1>PUT CODE HERE</h1>
//     </>
//   );
// }

// export default App;

import "./App.css"; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Placeholder for Login route */}
        <Route path="/" element={<h1>PUT CODE HERE</h1>} />

        {/* Your profile dashboard page */}
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
