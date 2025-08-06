const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'omegbazaar.com', // cPanel mail server
  port: 465,
  secure: true,
  auth: {
    user: "contact@omegbazaar.com",
    pass: "a]~zxqb#KzEv"
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP server ready');
    
    // Send test email when run directly
    if (require.main === module) {
      sendTestEmail().catch(console.error);
    }
  }
});

// Test email function
async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"Omega Bazaar" <contact@omegbazaar.com>',
      to: 'ckulbir1@gmail.com',
      subject: 'SMTP Configuration Test',
      text: 'This is a test email from your cPanel server',
      html: `<b>SMTP Configuration Success!</b>
             <p>Your Omega Bazaar email is working properly</p>
             <p>Server: ${transporter.options.host}</p>
             <p>Port: ${transporter.options.port}</p>`
    });

    console.log('Test email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Test email failed:', error);
    throw error;
  }
}

module.exports = transporter;

// Run test if executed directly
if (require.main === module) {
  console.log('Running email test...');
  // Add 3s delay to ensure verification completes
  setTimeout(sendTestEmail, 3000);
}