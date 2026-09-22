// controllers/addressController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Address from "../models/Address.js";

// ==================== TYPES ====================
interface AuthUser {
  _id: mongoose.Types.ObjectId;
  role?: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

interface CreateAddressBody {
  type?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault?: boolean;
}

interface UpdateAddressBody {
  type?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

interface AddressParams {
  id: string;
}

// ==================== CREATE ====================
// @desc    Create a new address
// @route   POST /api/addresses
// @access  Private
export const createAddress = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { type, street, city, state, zipCode, phoneNumber, isDefault } =
      req.body as CreateAddressBody;

    // 1. Validate required fields
    if (!street || !city || !state || !zipCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Count existing addresses for this user
    const addressCount = await Address.countDocuments({ user: req.user!._id });

    // 3. Enforce max 3 addresses
    if (addressCount >= 3) {
      return res.status(400).json({
        success: false,
        message:
          "You can only have a maximum of 3 addresses. Please delete one to add a new address.",
      });
    }

    // 4. If this is the user's first address, force it to be default
    const shouldBeDefault = addressCount === 0 ? true : isDefault || false;

    // 5. If setting as default, unset all other defaults
    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user!._id }, { isDefault: false });
    }

    // 6. Create the address
    const address = await Address.create({
      user: req.user!._id,
      type,
      street,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating address",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== READ (All) ====================
// @desc    Get all addresses
// @route   GET /api/addresses
// @access  Private/Admin
export const getAllAddresses = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const addresses = await Address.find().populate("user", "name email");

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching addresses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== READ (By User) ====================
// @desc    Get address by user ID
// @route   GET /api/addresses/user
// @access  Private
export const getAddressByUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    console.log("req address user ID", req.user!._id)
    // const addresses = await Address.find({ user: req.user!._id })
    const addresses = await Address.find({ user: "6aad6a58245810a619265d96"})
      .populate("user", "name email")
      .sort({ isDefault: -1, createdAt: -1 }); // default first, then newest

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching addresses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== READ (By ID) ====================
// @desc    Get address by ID
// @route   GET /api/addresses/:id
// @access  Private
export const getAddressById = async (
  req: AuthRequest & Request<AddressParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(id).populate("user", "name email");

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Check ownership
    const addressUser = address.user as unknown as { _id: mongoose.Types.ObjectId };
    if (
      addressUser._id.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this address",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching address",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== UPDATE ====================
// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = async (
  req: AuthRequest & Request<AddressParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { type, street, city, state, zipCode, phoneNumber, isDefault } =
      req.body as UpdateAddressBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Check ownership
    if (
      address.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this address",
      });
    }

    // If setting as default, unset others
    if (isDefault) {
      await Address.updateMany(
        { user: address.user, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    // Update fields (only if provided)
    if (type) address.type = type ;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (phoneNumber) address.phoneNumber = phoneNumber;
    if (typeof isDefault === "boolean") address.isDefault = isDefault;

    const updatedAddress = await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating address",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== DELETE ====================
// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = async (
  req: AuthRequest & Request<AddressParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Check ownership
    if (
      address.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this address",
      });
    }

    await address.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting address",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== SET DEFAULT ====================
// @desc    Set address as default
// @route   PATCH /api/addresses/:id/default
// @access  Private
export const setDefaultAddress = async (
  req: AuthRequest & Request<AddressParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID",
      });
    }

    const address = await Address.findById(id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Check ownership
    if (address.user.toString() !== req.user!._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Unset all other defaults for this user
    await Address.updateMany({ user: req.user!._id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address set successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error setting default address",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};