import { emailTemplate } from '../utils/emailTemplate.js';
import { sendEmail } from '../utils/sendEmail.js';
import { EmailPDFService } from '../services/EmailPDFServices.js';

export const sendTransactionEmail = async (req, res) => {
    try {
        const { to, subject, tipo, monto, saldo } = req.body;

        if (!to || !subject || !tipo || monto === undefined || saldo === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar to, subject, tipo, monto y saldo'
            });
        }

        const html = emailTemplate({ tipo, monto, saldo });
        await sendEmail(to, subject, html);

        return res.status(200).json({
            success: true,
            message: 'Correo de transaccion enviado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al enviar correo de transaccion',
            error: error.message
        });
    }
};

export const sendPdfEmail = async (req, res) => {
    try {
        const { toEmail, subject, title, entityName, data, fields, filename } = req.body;

        if (!toEmail || !subject || !title || !entityName || !data || !fields) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar toEmail, subject, title, entityName, data y fields'
            });
        }

        const service = new EmailPDFService();
        const result = await service.sendEntityPDF({
            toEmail,
            subject,
            title,
            entityName,
            data,
            fields,
            filename
        });

        return res.status(200).json({
            success: true,
            message: `PDF enviado correctamente a ${result.toEmail}`,
            data: {
                correoDestino: result.toEmail,
                archivoEnviado: result.filename,
                totalRegistros: result.records
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al enviar correo con PDF',
            error: error.message
        });
    }
};
