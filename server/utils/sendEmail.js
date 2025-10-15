import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    console.log("📧 Preparing to send email...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_USER:", process.env.SMTP_MAIL);
    console.log("SMTP_PASS:", process.env.SMTP_PASSWORD);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      requireTLS: true,
      logger: true,
      debug: true,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ sendEmail() failed:", error);
    throw new Error(error.message);
  }
};
