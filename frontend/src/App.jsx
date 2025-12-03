import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import RegisterProduct from './pages/RegisterProduct';
import Products from './pages/Products';
import EditProduct from './pages/EditProduct';
import Listings from './pages/Listings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="create-listing" element={
            <ProtectedRoute>
              <CreateListing />
            </ProtectedRoute>
          } />

          <Route path="register-product" element={
            <ProtectedRoute>
              <RegisterProduct />
            </ProtectedRoute>
          } />

          <Route path="products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="edit-product/:id" element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } />

          <Route path="listings" element={
            <ProtectedRoute>
              <Listings />
            </ProtectedRoute>
          } />

          <Route path="orders" element={
            <ProtectedRoute>
              <Dashboard /> {/* Reusing Dashboard for now, or create dedicated Orders page */}
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
