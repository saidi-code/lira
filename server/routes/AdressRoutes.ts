// routes/addressRoutes.js
import express from "express";
import {
  createAddress,
  getAllAddresses,
  getAddressByUser,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/AddressController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== Admin only ====================
// GET /api/addresses  — get all addresses (admin)
router.get("/", authorize("admin"), getAllAddresses);

// ==================== User routes ====================
// POST   /api/addresses          — create address (max 3)
router.post("/", createAddress);

// GET    /api/addresses/user     — get logged-in user's addresses
router.get("/user", getAddressByUser);

// GET    /api/addresses/:id      — get a single address by id
router.get("/:id", getAddressById);

// PUT    /api/addresses/:id      — update an address
router.put("/:id", updateAddress);

// DELETE /api/addresses/:id      — delete an address
router.delete("/:id", deleteAddress);

// PATCH  /api/addresses/:id/default — set address as default
router.patch("/:id/default", setDefaultAddress);

export default router;



// Method	Endpoint	Description	Access
// GET	/api/addresses	Get all addresses	Admin
// POST	/api/addresses	Create address (max 3)	Private
// GET	/api/addresses/user	Get logged-in user's addresses	Private
// GET	/api/addresses/:id	Get address by ID	Private
// PUT	/api/addresses/:id	Update address	Private
// DELETE	/api/addresses/:id	Delete address	Private
// PATCH	/api/addresses/:id/default	Set as default	Private
