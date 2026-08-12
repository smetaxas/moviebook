const Brevo = require('@getbrevo/brevo');

const sendBrevoEmail = async (to, subject, html) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

  const email = new Brevo.SendSmtpEmail();
  email.sender = { name: 'CineLog', email: 'noreply@cinelog.app' };
  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;

  await apiInstance.sendTransacEmail(email);
};

const sendOTPEmail = async (email, otp) => {
  await sendBrevoEmail(
    email,
    'Your CineLog Login Code',
    `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background-color: #1a1a1a; border-radius: 16px;">
        <h1 style="color: white; text-align: center;">🎬 CineLog</h1>
        <p style="color: #aaa; text-align: center;">Your login verification code:</p>
        <div style="background-color: #e50914; color: white; font-size: 2rem; font-weight: bold; text-align: center; padding: 1rem; border-radius: 8px; letter-spacing: 0.5rem;">
          ${otp}
        </div>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem; margin-top: 1rem;">This code expires in 5 minutes.</p>
      </div>
    `
  );
};

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendBrevoEmail(
    email,
    'Verify your CineLog account',
    `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background-color: #1a1a1a; border-radius: 16px;">
        <h1 style="color: white; text-align: center;">🎬 CineLog</h1>
        <p style="color: #aaa; text-align: center;">Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}" style="display: block; background-color: #e50914; color: white; font-size: 1rem; font-weight: bold; text-align: center; padding: 1rem; border-radius: 8px; text-decoration: none; margin-top: 1rem;">
          Verify Email
        </a>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem; margin-top: 1rem;">This link expires in 24 hours.</p>
      </div>
    `
  );
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendBrevoEmail(
    email,
    'Reset your CineLog password',
    `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; background-color: #1a1a1a; border-radius: 16px;">
        <h1 style="color: white; text-align: center;">🎬 CineLog</h1>
        <p style="color: #aaa; text-align: center;">We received a request to reset your password.</p>
        <div style="text-align: center; margin: 1.5rem 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #e50914; color: white; font-weight: bold; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px;">
            Reset Password
          </a>
        </div>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  );
};

module.exports = { sendOTPEmail, sendVerificationEmail, sendPasswordResetEmail };