import "./App.css";
import { useState } from "react";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

function App() {
  const [showAnalytics, setShowAnalytics] = useState(false);
  return (
    <div>
      <h1>Hello, World!</h1>
      <p>This is my basic App component.</p>
      <button onClick={() => setShowAnalytics((s) => !s)} style={{ marginTop: 12 }}>
        {showAnalytics ? "Hide" : "Show"} Analytics Dashboard
      </button>
      {showAnalytics && <AnalyticsDashboard />}
    </div>
  );
}

export default App;
