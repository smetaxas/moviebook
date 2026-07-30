const { Resend } = require('resend');

let resend = null;
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set. Add it to server/.env to enable emails.');
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const sendEmail = async (options) => {
  const { data, error } = await getResendClient().emails.send(options);
  if (error) {
    throw new Error(`Resend failed to send email: ${error.message}`);
  }
  return data;
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    from: 'MovieBook <onboarding@resend.dev>',
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

const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendEmail({
    from: 'MovieBook <onboarding@resend.dev>',
    to: email,
    subject: 'Reset your MovieBook password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background-color: #1a1a1a; border-radius: 16px;">
        <h1 style="color: white; text-align: center;">🎬 MovieBook</h1>
        <p style="color: #aaa; text-align: center;">We received a request to reset your password.</p>
        <div style="text-align: center; margin: 1.5rem 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #e50914; color: white; font-weight: bold; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px;">
            Reset Password
          </a>
        </div>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };