import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import MainLayout from './App/Mainlayout';
import Login from './App/Login';
import Price from './App/Price';
import Candle from './App/Candle';

function App() {
  // const isDark = localStorage.getItem('darkMode') === 'true' ? true : false;

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : true; // mặc định dark = true
  });

  const handle_dark_mode_toggle = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Main Layout with Nested Routes */}
        <Route path="/" element={<MainLayout handle_dark_mode_toggle={handle_dark_mode_toggle} />}>
          {/* Default redirect to /price */}
          <Route index element={<Navigate to="/price" replace  />} />

          {/* Home Page */}   
          {/* <Route path="home" element={<Price isDark={isDark}  />} /> */}
          
          {/* Price Page */}
          <Route path="price" element={<Price isDark={isDark} />} />
          
          {/* Candle Page */}
          <Route path="candle" element={<Candle isDark={isDark} />} />
        </Route>
        
        {/* Catch all - redirect to price */}
        <Route path="*" element={<Navigate to="/price" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;