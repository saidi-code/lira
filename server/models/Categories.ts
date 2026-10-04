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
      // Bounded here as well as in the controller. The controller's message is
      // better, but the schema is the guarantee: any other write path — a script,
      // a future handler — is bounded too, and a violation is a ValidationError,
      // which the central handler already maps to 400.
      maxlength: 100,
    },
    icon: {
      type: String,
      required: [true, 'Icon path is required'],
      maxlength: 100,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

// 3. Create and export the model
const Category: Model<ICategory> = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;