import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
        from: `"Banco Digital" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};