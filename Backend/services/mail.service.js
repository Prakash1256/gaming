const transporter = require("../config/mail");
const logger = require("../utils/logger");

exports.sendVerificationMail = async (name, email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to: email, // Receiver email
      subject: "Activate Your Account",
      html:
      // html: `
      //   <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
      //   <img src="/template.png" alt="Logo" style="width: 100px; margin-bottom: 20px;">
      //     <h1 style="color: #333;">Welcome to Our Platform</h1>
      //     <p style="color: #666; font-size: 16px;"> 
      //       Hi ${name}, Thanks for signing up! We just need you to verify your email address to activate your account.
      //     </p>
      //     <a href=${link} 
      //        style="display: inline-block; background-color: #FF4825; color: white; padding: 10px 20px; 
      //               text-decoration: none; font-size: 18px; border-radius: 5px; margin-top: 20px;">
      //       Verify Email
      //     </a>
      //     <p style="color: #999; font-size: 14px; margin-top: 20px;">
      //       Please do not reply to this email as it will not be received.
      //     </p>
      //   </div>`,

        `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Activate Your Account - League Pool Stats</title>
</head>
<body style="margin:0; padding:0; background-color:#2c3e50;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color:#34495e; border-radius:12px; padding:40px;">
          
          <!-- Logo & Brand -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src=${process.env.BACKEND_URL}logo.png  alt="League Pool Logo" width="120" style="margin-bottom: 10px;" />
              <h1 style="color:#ecf0f1; font-size:24px; margin:0; font-family: sans-serif;">League Pool Stats</h1>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h2 style="color:#ecf0f1; font-size:28px; margin:0; font-weight:bold; font-family: sans-serif; text-decoration: underline; white-space: nowrap;">
                Activate your account
              </h2>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <p style="color:#e74c3c; font-size:18px; margin:0; font-family: sans-serif;">Hi ${name},</p>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding-bottom: 30px;">
              <p style="color:#ecf0f1; font-size:16px; line-height:1.5; font-family: sans-serif; margin:0; text-align: center;">
                 Thanks for signing up! We just need you to verify your email address to activate your account.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <a href=${link} target="_blank" style="background: #e74c3c; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; font-family: sans-serif; display: inline-block;">
                Activate my Account
              </a>
            </td>
          </tr>

          <!-- Centered Note -->
          <tr>
            <td align="center">
              <p style="color:#bdc3c7; font-size:14px; line-height:1.5; font-family: sans-serif; margin:0; text-align: center;">
                This link will expire in 10 minutes for security purposes.
              </p>
            </td>
          </tr>
        <!-- Footer -->
<tr>
  <td align="center" style="padding-top: 30px;">
    <p style="color:#95a5a6; font-size:12px; font-family: sans-serif; margin: 0;">
      © 2025 League Pool Stats. All rights reserved.
    </p>
  </td>
</tr>
        </table>

   
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw new Error("Failed to send verification email.");
  }
};

exports.sendForgetPasswordMail = async (name, email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Account Password",
      html: `
        <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset Your Password - League Pool Stats</title>
</head>
<body style="margin:0; padding:0; background-color:#2c3e50;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color:#34495e; border-radius:12px; padding:40px;">
          
          <!-- Logo & Brand -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <img src=${process.env.BACKEND_URL}logo.png alt="League Pool Logo" width="120" style="margin-bottom: 10px;" />
              <h1 style="color:#ecf0f1; font-size:24px; margin:0; font-family: sans-serif;">League Pool stats</h1>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <h2 style="color:#ecf0f1; font-size:28px; margin:0; font-weight:bold; font-family: sans-serif; text-decoration: underline; white-space: nowrap;">
                Reset Your Password
              </h2>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <p style="color:#e74c3c; font-size:18px; margin:0; font-family: sans-serif;">Hi ${name},</p>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding-bottom: 30px;">
              <p style="color:#ecf0f1; font-size:16px; line-height:1.5; font-family: sans-serif; margin:0; text-align: center;">
                We received a request to reset your password for your League Pool Stats account. To reset your password and regain access to your account, please click the button below:
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <a href=${link} target="_blank" style="background: #e74c3c; color: white; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-size: 16px; font-weight: bold; font-family: sans-serif; display: inline-block;">
                Reset My Password
              </a>
            </td>
          </tr>

          <!-- Centered Note -->
          <tr>
            <td align="center">
              <p style="color:#bdc3c7; font-size:14px; line-height:1.5; font-family: sans-serif; margin:0; text-align: center;">
                If you didn't request this password reset, please ignore this email. This link will expire in 10 minutes for security purposes.
              </p>
            </td>
          </tr>
        <!-- Footer -->
<tr>
  <td align="center" style="padding-top: 30px;">
    <p style="color:#95a5a6; font-size:12px; font-family: sans-serif; margin: 0;">
      © 2025 League Pool Stats. All rights reserved.
    </p>
  </td>
</tr>
        </table>

   
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    console.log(mailOptions);
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw new Error("Failed to send verification email.");
  }
};

exports.sendWelcomeEmail = async (name, email) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Our Platform",
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Welcome to League Pool Stats</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #2c3e50">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 0">
          <table
            width="100%"
            style="
              max-width: 600px;
              background-color: #2c3e50;
              border-radius: 6px;
              overflow: hidden;
            "
          >
            <!-- Header -->
            <!-- Logo & Brand -->
            <tr>
              <td align="center" style="padding-bottom: 2px">
                <img
                  src=${process.env.BACKEND_URL}logo.png
                  alt="League Pool Logo"
                  width="120"
                  style="margin-bottom: 5px"
                />

              </td>
            </tr>

            <!-- Welcome -->
            <tr>
              <td align="center" style="padding: 20px 30px">
                <p
                  style="
                    color: #ecf0f1;
                    font-size: 20px;
                    font-family: sans-serif;
                    margin: 0;
                  "
                >
                  Hi ${name},
                </p>
                <h1
                  style="
                    color: #e74c3c;
                    font-size: 24px;
                    margin: 10px 0;
                    font-family: sans-serif;
                  "
                >
                  Welcome to League Pool Stats
                </h1>
                <p
                  style="
                    color: #bdc3c7;
                    font-size: 14px;
                    line-height: 1.6;
                    font-family: sans-serif;
                    margin: 0;
                  "
                >
                  Where every shot counts and the competition is always on!<br />
                  You’ve just joined a community of players from around the
                  world who love the thrill of the game.
                </p>
              </td>
            </tr>

            <!-- What you can do next -->
            <tr>
              <td align="center" style="padding: 30px 20px">
                <h3
                  style="
                    color: #ffffff;
                    font-size: 18px;
                    font-family: sans-serif;
                    margin-bottom: 10px;
                  "
                >
                  Here's what you can do next
                </h3>
                <table
                  width="100%"
                  cellpadding="10"
                  cellspacing="0"
                  style="text-align: center"
                >
                  <tr>
                    <td style="width: 50%; padding-top: 20px">
                      <div
                        style="
                          background: #2c2f35;
                          padding: 20px;
                          border-radius: 8px;
                        "
                      >
                   <img src="https://img.icons8.com/fluency/48/trophy.png" width="30" alt="Golden Trophy" />

                        <p
                          style="
                            color: white;
                            font-size: 14px;
                            font-family: sans-serif;
                            margin-top: 10px;
                          "
                        >
                          Join tournaments and be a winner
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding: 20px">
                <a
                  href="${process.env.FRONTEND_URL}/#/tournament"
                  style="
                    background-color: #e74c3c;
                    color: #ffffff;
                    padding: 12px 30px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    font-family: sans-serif;
                  "
                >
                  PLAY NOW
                </a>
                <p
                  style="
                    color: #bdc3c7;
                    font-size: 12px;
                    margin-top: 20px;
                    font-family: sans-serif;
                  "
                >
                  Your cue is ready!
                </p>
              </td>
            </tr>

            <!-- Help -->
            <tr>
              <td align="center" style="padding: 20px">
                <a
                  href="#"
                  style="
                    color: #ffcb05;
                    font-size: 14px;
                    font-family: sans-serif;
                    text-decoration: underline;
                  "
                >
                  Need help or have questions?
                </a>
                <p
                  style="
                    color: #bdc3c7;
                    font-size: 12px;
                    font-family: sans-serif;
                    margin-top: 5px;
                  "
                >
                  Visit our Help Center or contact support anytime.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                align="center"
                style="background-color: #1f2126; padding: 20px"
              >
                <h3
                  style="
                    color: #e74c3c;
                    font-family: sans-serif;
                    font-size: 18px;
                    margin: 0;
                  "
                >
                  Thanks for joining
                </h3>
                <p
                  style="
                    color: #bdc3c7;
                    font-family: sans-serif;
                    font-size: 13px;
                    margin: 5px 0 15px;
                  "
                >
                  We can’t wait to see what you’ve got!
                </p>
                <!-- Social Icons -->
                <div style="display: inline-flex; gap: 15px">
                  <a href="https://facebook.com">
                    <img
                      src="https://img.icons8.com/color/48/facebook-new.png"
                      width="36"
                    />
                  </a>
                  <a href="https://instagram.com">
                    <img
                      src="https://img.icons8.com/color/48/instagram-new.png"
                      width="36"
                    />
                  </a>
                  <a href="https://wa.me/">
                    <img
                      src="https://img.icons8.com/color/48/whatsapp.png"
                      width="36"
                    />
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);

  } catch (error) {
    logger.error(`Error sending welcome email: ${error.message}`);
    throw new Error("Failed to send verification email.");
  }
};

exports.sendContactEmailService = async ({
  contactReciever,
  name,
  email,
  subject,
  message,
}) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: contactReciever,
    subject: `[Contact Form] ${subject}`,
    text: `
      New contact form submission:
      
      Name: ${name}
      Email: ${email}
      Subject: ${subject}
      Message:
      ${message}
    `,
  };

  await transporter.sendMail(mailOptions);
};
