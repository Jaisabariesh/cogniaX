window.global = window;
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'

import Login from './login.jsx'
import ParentComponent from './COGNIA.jsx'
import VaultHome from './VaultHome.jsx' // <- ✅ Import this
import ProtectedRoute from './ProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
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
