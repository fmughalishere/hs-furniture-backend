import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: MailOptions): Promise<void> => {
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!smtpConfigured) {
    // Dev fallback — no SMTP set up yet, just log it so the flow still works end-to-end
    console.log("---- EMAIL (SMTP not configured, logging instead) ----");
    console.log("To:", options.to);
    console.log("Subject:", options.subject);
    console.log("Body:", options.html);
    console.log("--------------------------------------------------------");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "HS Furniture <no-reply@hsfurniture.pk>",
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};
