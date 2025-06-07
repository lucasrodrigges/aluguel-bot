const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const { WPP_URL, EMAIL_USER, EMAIL_PASS, EMAIL_TO } = process.env;

const sendWpp = async (site, title, link) => {
  try {
    const response = await fetch(WPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site,
        title: `*${title}*`,
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
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: [...EMAIL_TO.split(",")],
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