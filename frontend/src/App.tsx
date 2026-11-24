import { Routes, Route } from "react-router-dom";

import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import ProtectedRoute from "./components/LandingPage/ProtectedRoute";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"element={<Dashboard />}/>
      </Route>
    </Routes>
  );
};

export default App;