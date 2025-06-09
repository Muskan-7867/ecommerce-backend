import transporter from "./transporter.js";

export const sendGenericEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, message: "Failed to send email" };
  }
};

// Example usage for contact form
export const sendContactEmail = async (data) => {
  const html = `
    <h3>New Contact Form Submission</h3>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phone}</p>
    <p><strong>Message:</strong> ${data.message}</p>
  `;
  return sendGenericEmail({
    to: process.env.RECEIVING_EMAIL,
    subject: `New Contact Form Submission from ${data.name}`,
    html
  });
};
