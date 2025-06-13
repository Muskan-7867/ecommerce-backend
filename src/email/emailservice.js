import transporter from "./transporter.js";

 const sendGenericEmail = async ({ to, subject, html }) => {
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
 const sendContactEmail = async (data) => {
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


 const sendWelcomeEmail = async (userData) => {
  const html = `
    <h2>Welcome to Our Platform, ${userData.username}!</h2>
    <p>Thank you for registering with us. Your account has been successfully created.</p>
    <p>Here are your account details:</p>
    <ul>
      <li><strong>Username:</strong> ${userData.username}</li>
      <li><strong>Email:</strong> ${userData.email}</li>
    </ul>
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br/>The Team</p>
  `;
   return sendGenericEmail({
    to: userData.email,
    subject: 'Welcome to Our Platform!',
    html
  });
}

export { sendContactEmail, sendWelcomeEmail, sendGenericEmail }