// Run with: npx ts-node src/utils/seed.ts
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db";
import Category from "../models/Category.model";

const categories = [
  { name: "Living Room", icon: "sofa", description: "Sofas, coffee tables, TV stands, bookshelves, side tables, display cabinets" },
  { name: "Bedroom", icon: "bed", description: "Beds, wardrobes, dressing tables, nightstands, storage chests, mirrors" },
  { name: "Dining Room", icon: "tools-kitchen-2", description: "Dining tables, dining chairs, benches, buffet sideboards, bar stools" },
  { name: "Office", icon: "briefcase", description: "Desks, office chairs, filing cabinets, bookshelves, meeting tables, stands" },
  { name: "Iron Furniture", icon: "tools", description: "Iron beds, chairs, industrial tables, wrought iron sofas, shelves, gates & grills" },
  { name: "Handicrafts", icon: "paint", description: "Hand-painted trays, carved wooden decor, lacquerware, brass & copper items, pottery" },
  { name: "Outdoor", icon: "garden-cart", description: "Garden chairs, patio tables, swings, outdoor benches, pergolas, planters" },
  { name: "Kids' Room", icon: "puzzle", description: "Bunk beds, study desks, toy storage, play tables, kids chairs, bookshelves" },
  { name: "Custom Orders", icon: "pencil-plus", description: "Any size, any wood, any iron finish, logo engraving, corporate bulk, personalized gifts" },
  { name: "Commercial", icon: "building-store", description: "Restaurant tables, hotel furniture, café chairs, reception desks, retail shelving" },
];

const seed = async () => {
  await connectDB();

  for (const cat of categories) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      console.log(`Created category: ${cat.name}`);
    } else {
      console.log(`Skipped (already exists): ${cat.name}`);
    }
  }

  console.log("Seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
