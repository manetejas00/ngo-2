import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ModalProvider } from './context/ModalContext';
import ModalContainer from './components/modals/ModalContainer';
import HomePage from './pages/HomePage';
import DoctorsPage from './pages/DoctorsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/doctors.html" element={<DoctorsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin.html" element={<AdminPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <ModalContainer />
      </BrowserRouter>
    </ModalProvider>
  );
}
