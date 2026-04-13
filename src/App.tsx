import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainLayout from './App/Mainlayout';
import Login from './App/Login';
import Price from './App/Price';
import MaintenanceNotice from './App/MaintenanceNotice';
import Candle from './App/Candle';
import ProtectedRoute from './Components/ProtectedRoute';
import PublicRoute from './Components/PublicRoute';
import SystemMaintenance from './App/MaintenanceNotice';

function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : true;
  });

  const handle_dark_mode_toggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - Login */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - Main Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout handle_dark_mode_toggle={handle_dark_mode_toggle} />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to /price */}
          <Route index element={<Navigate to="/price" replace />} />
          
          {/* Price Page */}
          {/* <Route path="price" element={<Price isDark={isDark} />} /> */}
          <Route path="price" element={<SystemMaintenance
            brand="Dino Hunter" 
            etaText="Dự kiến hoàn tất:Chưa biết khi nào , Mọi chi tiết liên hệ a Tuấn" 
            incidentText="Mã thông báo: BA-2026-0604"
            contactText="0383537581 (Zalo/Call)" 
            contactHref="tel:0383537581" 
            autoReloadSeconds={90}
          />} />

          <Route path="price/admin" element={<Price isDark={isDark} />} />
          
          {/* Candle Page */}
          <Route path="candle" element={<Candle isDark={isDark} />} />
        </Route>
        
        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;