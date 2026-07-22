const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"MovieBook" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your MovieBook Login Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background-color: #1a1a1a; border-radius: 16px;">
        <h1 style="color: white; text-align: center;">🎬 MovieBook</h1>
        <p style="color: #aaa; text-align: center;">Your login verification code:</p>
        <div style="background-color: #e50914; color: white; font-size: 2rem; font-weight: bold; text-align: center; padding: 1rem; border-radius: 8px; letter-spacing: 0.5rem;">
          ${otp}
        </div>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem; margin-top: 1rem;">This code expires in 5 minutes.</p>
      </div>
    `
  });
};

module.exports = { sendOTPEmail };