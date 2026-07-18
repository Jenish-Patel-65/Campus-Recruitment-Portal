const { Resend } = require('resend');

const sendPasswordResetEmail = async (toEmail, resetLink) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing. Password reset email cannot be sent.');
      return false;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'; // Fallback to test domain if not configured

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for the Campus Recruitment Portal.</p>
        <p>You can reset your password by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetLink}" style="color: #2563eb; word-break: break-all;">${resetLink}</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you did not request this reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Placement Cell</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: `Placement Portal <${fromAddress}>`,
      to: [toEmail],
      subject: 'Password Reset - Campus Recruitment Portal',
      html: htmlContent,
    });

    if (error) {
      console.error(`Resend API Error when sending to ${toEmail}:`, error);
      return false;
    }

    console.log(`Password reset email sent to ${toEmail}. Message ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${toEmail}:`, error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
};
