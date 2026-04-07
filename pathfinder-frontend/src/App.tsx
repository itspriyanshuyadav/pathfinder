import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MissionProvider } from "./context/MissionContext";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ResultsPage from "./pages/ResultsPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <MissionProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </MissionProvider>
    </BrowserRouter>
  );
}
