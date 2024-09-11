import nodemailer from 'nodemailer';

export const sendEmail = async function(options) {
  try {
    // Create a transporter object using Gmail's SMTP transport
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Use `true` for port 465, `false` for all other ports
      auth: {
        user: process.env.EMAIL, // Replace with your email environment variable
        pass: process.env.G_PASS, // Replace with your password environment variable
      },
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: process.env.EMAIL, // Sender address
      to: options.email, // List of receivers
      subject: options.subject, // Subject line
      text: options.message, // Plain text body
      // You can also use `html` to send HTML-formatted emails
      // html: options.htmlMessage, // HTML body
    });

    console.log("Message sent: %s", info.messageId);
    return info; // Return info object if needed for further processing

  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new ApiError(500,error.message||'internal server error'); // Throwing error so it can be handled upstream
  }
};
