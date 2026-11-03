import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Auth Views
import Login from './views/Login';
import Register from './views/Register';

// Cashier View
import CashierDashboard from './views/CashierDashboard';

// Admin Views
import AdminLayout from './views/AdminLayout';
import AdminSummary from './views/AdminSummary';
import ProductCrud from './views/ProductCrud';
import CategoryCrud from './views/CategoryCrud';
import StockManagement from './views/StockManagement';
import EmployeeManagement from './views/EmployeeManagement';
import TransactionHistory from './views/TransactionHistory';
import SalesReport from './views/SalesReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Kasir Route */}
        <Route path="/cashier" element={<CashierDashboard />} />

        {/* Admin Routes - wrapped in AdminLayout for sidebar & auth guard */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/summary" replace />} />
          <Route path="summary" element={<AdminSummary />} />
          <Route path="products" element={<ProductCrud />} />
          <Route path="categories" element={<CategoryCrud />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="sales" element={<SalesReport />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
