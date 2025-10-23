/*import "./App.css";

function App() {
  return (
    <>
      
    </>
  );
}

export default App;*/


import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      {/* Home page */}
      <Route
        path="/"
        element={
          <div style={{ textAlign: "center", marginTop: "150px" }}>
            <h1>Welcome to ATS for Candidates! </h1>
            <p> Please click on register to create your account</p>
            <Link to="/register">
  <button
    style={{
      marginTop: "20px",
      padding: "12px 28px",
      backgroundColor: "#007bff",
      border: "none",
      borderRadius: "6px",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
      transition: "background-color 0.3s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0056b3")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#007bff")}
  >
    Register
  </button>
</Link>

          </div>
        }
      />

      {/* Register page */}
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
