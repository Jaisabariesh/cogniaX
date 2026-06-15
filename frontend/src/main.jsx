window.global = window;
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

import Login from './login.jsx'
import ParentComponent from './LUNA.jsx'
import VaultHome from './VaultHome.jsx'
import ChangePassword from './ChangePassword.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LandingPage from './LandingPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
