import { Request, Response } from 'express';
import Category, { ICategory } from '../models/Categories.ts';

// ============ GET all categories ============
export const getCategories = async (req: Request, res: Response): Promise<Response> => {
  try {
    const categories: ICategory[] = await Category.find().sort({ title: 1 });
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============ GET single category by ID ============
export const getCategoryById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============ GET category by title (optional) ============
export const getCategoryByTitle = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { title } = req.params;
    const category = await Category.findOne({ title });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============ CREATE a new category ============
export const createCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { title, icon } = req.body;

    // Validation (basic)
    if (!title || !icon) {
      return res.status(400).json({ message: 'Title and icon are required' });
    }

    // Check for duplicate title
    const existing = await Category.findOne({ title });
    if (existing) {
      return res.status(409).json({ message: 'Category with this title already exists' });
    }

    const newCategory = new Category({ title, icon });
    await newCategory.save();
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============ UPDATE a category ============
export const updateCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { title, icon } = req.body;

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If title is changing, check for duplicates (excluding current)
    if (title && title !== category.title) {
      const duplicate = await Category.findOne({ title });
      if (duplicate) {
        return res.status(409).json({ message: 'Category with this title already exists' });
      }
    }

    // Update fields (only provided ones)
    if (title) category.title = title;
    if (icon) category.icon = icon;

    await category.save();
    return res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============ DELETE a category ============
export const deleteCategory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ message: 'Category deleted successfully', category });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};