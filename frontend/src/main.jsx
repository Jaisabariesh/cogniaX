window.global = window;
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

import Login from './login.jsx'
import ParentComponent from './COGNIA.jsx'
import VaultHome from './VaultHome.jsx' // <- ✅ Import this
import ChangePassword from './ChangePassword.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

const RootRedirect = () => {
  const location = useLocation();
  return <Navigate to={{ pathname: '/login', search: location.search, hash: location.hash }} replace />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:uid"
          element={
            <ProtectedRoute>
              <VaultHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/:uid/vault/:vaultId"
          element={
            <ProtectedRoute>
              <ParentComponent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
