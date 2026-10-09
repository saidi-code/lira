import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { RequireCapability } from "@/components/RequireCapability";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { PurchasingPage } from "@/pages/PurchasingPage";
import { TransfersPage } from "@/pages/TransfersPage";
import { WarehousesPage } from "@/pages/WarehousesPage";
import { StaffPage } from "@/pages/StaffPage";
import { DeniedPage } from "@/pages/DeniedPage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";

export function App() {
  return (
    <Routes>
      <Route path="/denied" element={<DeniedPage />} />
      <Route element={<AdminLayout />}>
        <Route
          path="/"
          element={
            <RequireCapability capability="dashboard">
              <DashboardPage />
            </RequireCapability>
          }
        />
        <Route
          path="/products"
          element={
            <RequireCapability capability="products">
              <ProductsPage />
            </RequireCapability>
          }
        />
        <Route
          path="/announcements"
          element={
            <RequireCapability capability="announcements">
              <AnnouncementsPage />
            </RequireCapability>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireCapability capability="orders">
              <OrdersPage />
            </RequireCapability>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireCapability capability="inventory.read">
              <InventoryPage />
            </RequireCapability>
          }
        />
        <Route
          path="/purchasing"
          element={
            <RequireCapability capability="purchasing">
              <PurchasingPage />
            </RequireCapability>
          }
        />
        <Route
          path="/transfers"
          element={
            <RequireCapability capability="transfers">
              <TransfersPage />
            </RequireCapability>
          }
        />
        <Route
          path="/warehouses"
          element={
            <RequireCapability capability="warehouses">
              <WarehousesPage />
            </RequireCapability>
          }
        />
        <Route
          path="/staff"
          element={
            <RequireCapability capability="users">
              <StaffPage />
            </RequireCapability>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
export default App;
