const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendWpp = async (site, title, link) => {
  try {
    const response = await fetch(process.env.WPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site,
        title,
        link,
      }),
    })

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    console.log('WhatsApp enviado com sucesso 📱');

    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error, '❌');
    return { success: false, error: error.message };
  }
}


const sendEmail = async (subject, title, href) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...process.env.EMAIL_TO.split(",")],
    subject,
    text: `Novo anúncio encontrado: ${title} - ${href || "N/A"}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso ✉️");
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error, "❌");
    return { success: false };
  }
};


module.exports = {
  sendWpp,
  sendEmail,
};