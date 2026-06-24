import mongoose, { Document, Schema } from "mongoose";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  channel: "website_form" | "whatsapp" | "email" | "call" | "live_chat";
  status: "new" | "in_progress" | "resolved";
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ["website_form", "whatsapp", "email", "call", "live_chat"],
      default: "website_form",
    },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
  },
  { timestamps: true }
);

export default mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
