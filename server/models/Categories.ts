import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Define the interface for TypeScript (optional but recommended)
export interface ICategory extends Document {
  title: string;
  icon: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Define the schema
const CategorySchema = new Schema<ICategory>(
  {
    title: {
      type: String,
      required: [true, 'Category title is required'],
      unique: true,              // ensure no duplicate titles
      trim: true,
    },
    icon: {
      type: String,
      required: [true, 'Icon path is required'],
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// 3. Create and export the model
const Category: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;