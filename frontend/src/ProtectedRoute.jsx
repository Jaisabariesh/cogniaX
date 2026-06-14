// ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { supabase } from "./supabase";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      const token = Cookies.get("sb-access-token");
      if (!token) {
        setChecking(false);
        return;
      }
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        setAuthenticated(true);
      }
      setChecking(false);
    };
    verifyUser();
  }, []);

  if (checking) return <p>Loading...</p>;

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
