import mongoose, { Document, Schema } from "mongoose";
import slugify from "slugify";

export interface IVariationOption {
  label: string; // e.g. "Sheesham Wood", "6ft", "Walnut Finish"
  priceModifier: number; // added/subtracted from basePrice
  stock: number;
}

export interface IVariation {
  name: string; // e.g. "Wood Type", "Size", "Finish/Color", "Hardware Style"
  options: IVariationOption[];
}

export interface IAssemblyGuide {
  productCode: string;
  videoUrl?: string;
  manualPdfUrl?: string;
  instructions?: string;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  category: mongoose.Types.ObjectId;
  images: string[];
  basePrice: number;
  material?: string;
  dimensions?: string;
  stock: number;
  variations: IVariation[];
  isCustomizable: boolean;
  tags: string[];
  assemblyGuide?: IAssemblyGuide;
  ratingsAverage: number;
  numReviews: number;
  isFeatured: boolean;
  status: "active" | "draft" | "out_of_stock";
}

const variationOptionSchema = new Schema<IVariationOption>(
  {
    label: { type: String, required: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
  },
  { _id: true }
);

const variationSchema = new Schema<IVariation>(
  {
    name: { type: String, required: true },
    options: { type: [variationOptionSchema], default: [] },
  },
  { _id: true }
);

const assemblyGuideSchema = new Schema<IAssemblyGuide>(
  {
    productCode: { type: String, required: true },
    videoUrl: { type: String },
    manualPdfUrl: { type: String },
    instructions: { type: String },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    images: { type: [String], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    material: { type: String },
    dimensions: { type: String },
    stock: { type: Number, default: 0 },
    variations: { type: [variationSchema], default: [] },
    isCustomizable: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    assemblyGuide: { type: assemblyGuideSchema },
    ratingsAverage: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "draft", "out_of_stock"], default: "active" },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", tags: "text" });

productSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + "-" + Date.now().toString(36);
  }
  next();
});

export default mongoose.model<IProduct>("Product", productSchema);
