const nodemailer = require('nodemailer');

let transporter = null;
const getTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in server/.env to enable emails.');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
};

const sendEmail = async (options) => {
  await getTransporter().sendMail({
    from: `"CineLog" <${process.env.GMAIL_USER}>`,
    ...options,
  });
};

const renderTemplate = ({ preheader, icon, heading, subheading, bodyHtml, footerNote }) => `
  <div style="background-color:#0a0a0a; padding:40px 16px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
    <span style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px; margin:0 auto;">
      <tr>
        <td style="background-color:#141414; border:1px solid rgba(255,255,255,0.08); border-bottom:none; border-radius:16px 16px 0 0; padding:28px 32px; text-align:center;">
          <span style="font-size:1.5rem; font-weight:800; color:#ffffff; letter-spacing:0.02em;">Cine<span style="color:#e50914;">Log</span></span>
        </td>
      </tr>
      <tr>
        <td style="background-color:#141414; border:1px solid rgba(255,255,255,0.08); border-top:none; border-radius:0 0 16px 16px; padding:36px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
            <tr>
              <td style="width:64px; height:64px; border-radius:50%; background-color:rgba(229,9,20,0.12); border:1px solid rgba(229,9,20,0.3); text-align:center; vertical-align:middle; font-size:1.8rem;">
                ${icon}
              </td>
            </tr>
          </table>
          <h1 style="color:#ffffff; font-size:1.3rem; font-weight:700; text-align:center; margin:0 0 8px;">${heading}</h1>
          ${subheading ? `<p style="color:#999; font-size:0.9rem; text-align:center; margin:0 0 24px; line-height:1.5;">${subheading}</p>` : ''}
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 12px; text-align:center;">
          <p style="color:#555; font-size:0.75rem; margin:0; line-height:1.5;">${footerNote}</p>
          <p style="color:#3a3a3a; font-size:0.7rem; margin:8px 0 0;">CineLog &middot; Track every movie you watch</p>
        </td>
      </tr>
    </table>
  </div>
`;

const button = (href, label) => `
  <div style="text-align:center; margin:8px 0 4px;">
    <a href="${href}" style="display:inline-block; background: linear-gradient(135deg, #e50914 0%, #b30710 100%); background-color:#e50914; color:#ffffff; font-weight:700; font-size:0.95rem; text-decoration:none; padding:0.85rem 2rem; border-radius:10px; box-shadow:0 4px 14px rgba(229,9,20,0.35);">
      ${label}
    </a>
  </div>
`;

const sendOTPEmail = async (email, otp) => {
  const digits = otp.split('').map(d => `
    <td style="width:14%; padding:0 4px;">
      <div style="background-color:#1f1f1f; border:1px solid rgba(229,9,20,0.4); border-radius:8px; padding:0.75rem 0; text-align:center; color:#fff; font-size:1.5rem; font-weight:700;">${d}</div>
    </td>
  `).join('');

  await sendEmail({
    to: email,
    subject: 'Your CineLog Login Code',
    html: renderTemplate({
      preheader: `Your CineLog login code is ${otp}`,
      icon: '🔐',
      heading: 'Your Login Code',
      subheading: 'Enter this code to finish signing in.',
      bodyHtml: `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
          <tr>${digits}</tr>
        </table>
        <p style="color:#777; text-align:center; font-size:0.8rem; margin:0;">This code expires in 5 minutes.</p>
      `,
      footerNote: "Didn't request this? You can safely ignore this email."
    })
  });
};

const sendVerificationEmail = async (email, token, clientUrl = process.env.CLIENT_URL || 'http://localhost:5173') => {
  const verificationUrl = new URL(`/verify-email?token=${token}`, clientUrl).toString();
  await sendEmail({
    to: email,
    subject: 'Verify your CineLog account',
    html: renderTemplate({
      preheader: 'Verify your email to activate your CineLog account.',
      icon: '✉️',
      heading: 'Verify Your Email',
      subheading: 'One click and your account is ready to go.',
      bodyHtml: `
        ${button(verificationUrl, 'Verify Email')}
        <p style="color:#777; text-align:center; font-size:0.8rem; margin:20px 0 0;">This link expires in 24 hours.</p>
      `,
      footerNote: "Didn't create a CineLog account? You can safely ignore this email."
    })
  });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: 'Reset your CineLog password',
    html: renderTemplate({
      preheader: 'Reset your CineLog password.',
      icon: '🔑',
      heading: 'Reset Your Password',
      subheading: 'We received a request to reset your password.',
      bodyHtml: `
        ${button(resetUrl, 'Reset Password')}
        <p style="color:#777; text-align:center; font-size:0.8rem; margin:20px 0 0;">This link expires in 1 hour.</p>
      `,
      footerNote: "Didn't request this? You can safely ignore this email."
    })
  });
};

module.exports = { sendOTPEmail, sendVerificationEmail, sendPasswordResetEmail };
