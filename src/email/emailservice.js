// import transporter from "./transporter.js";
const transporter = require("./transporter.js");


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

const sendVerificationEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4a4a4a;">Email Verification</h2>
      <p>Thank you for registering with us. Please verify your email address by entering the following OTP:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
        ${otp}
      </div>
      
      <p style="font-size: 14px; color: #666;">This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
      
      <p style="margin-top: 30px;">Best regards,<br/>The Team</p>
    </div>
  `;

  return sendGenericEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html
  });
};


 const sendWelcomeEmail = async (userData) => {
  const html = `
    <h2>Welcome to Omeg-Bazaar, ${userData.username}!</h2>
    <p>Thank you for registering with us. Your account has been successfully created.</p>
    
  
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br/>The Team</p>
  `;
   return sendGenericEmail({
    to: userData.email,
    subject: 'Welcome to Our Platform!',
    html
  });
}

const sendOrderConfirmationEmail = async (data) => {
  const { order, user, address } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .total-row { font-weight: bold; background-color: #f2f2f2; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order, ${user.name}!</p>
      </div>
      
      <div class="content">
        <p>Your order <strong>#${order._id}</strong> was placed on ${order.date} and is currently <strong>${order.status}</strong>.</p>
        
        <h3>Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
             
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
               
                <td>Rs.${item.total} /-</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">Subtotal:</td>
              <td>Rs.${order.subtotal} /-</td>
            </tr>
            <tr>
              <td colspan="3">Delivery:</td>
              <td>Rs. ${order.delivery} /-</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Total:</td>
              <td>Rs. ${order.grandTotal}/-</td>
            </tr>
          </tfoot>
        </table>

        <h3>Payment Information</h3>
        <p><strong>Method:</strong> ${order.paymentMethod.replace(/_/g, ' ').toUpperCase()}</p>
        
        <h3>Shipping Information</h3>
        <p>${address}</p>

        <p>We'll notify you when your order has shipped. If you have any questions, please contact our support team.</p>
        
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendGenericEmail({
    to: user.email,
    subject: `Order Confirmation #${order._id}`,
    html
  });
};

const sendOrderStatusUpdateEmail = async (data) => {
  const { order, user, address, updateType, newStatus } = data;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px; }
        .footer { margin-top: 20px; font-size: 0.9em; color: #777; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Order Update Notification</h2>
      </div>
      
      <div class="content">
        <p>Hello ${user.name},</p>
        <p>Your order <strong>#${order._id}</strong> has been updated:</p>
        
        <h3>Update Details</h3>
        <p><strong>${updateType}:</strong> ${newStatus}</p>
        <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
        
        <h3>Order Summary</h3>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Payment Status:</strong> ${order.payment.paymentStatus}</p>
        <p><strong>Total:</strong> Rs. ${order.totalPrice}/-</p>
        
        <h3>Shipping Information</h3>
        <p>${address}</p>

        <p>If you have any questions, contact our support team.</p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendGenericEmail({
    to: user.email,
    subject: `Order #${order._id} Status Update`,
    html
  });
};

module.exports =  { sendContactEmail, sendWelcomeEmail, sendGenericEmail , sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendVerificationEmail}