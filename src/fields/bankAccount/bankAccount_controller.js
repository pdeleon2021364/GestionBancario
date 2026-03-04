'use strict';

import Field from './bankAccount_model.js';
import { EmailPDFService } from '../../services/EmailPDFServices.js';

// Campos que se mostrarán en el PDF de BankAccount
const BANK_ACCOUNT_FIELDS = [
    { label: 'ID',               key: '_id' },
    { label: 'Nombre',           key: 'nombre' },
    { label: 'Número de Cuenta', key: 'numeroCuenta' },
    { label: 'Tipo de Cuenta',   key: 'tipoCuenta' },
    { label: 'Saldo',            key: 'saldo' },
    { label: 'Estado',           key: 'estado' },
    { label: 'Usuario ID',       key: 'usuarioId' },
    { label: 'Fecha de Creación',key: 'fechaCreacion' },
    { label: 'Creado en',        key: 'createdAt' },
    { label: 'Actualizado en',   key: 'updatedAt' },
];

export const createField = async (req, res) => {
    try {
        const fieldData = req.body;
        
        // Validación de ingresos mínimos
        const ingresos = parseFloat(fieldData.ingresos);
        if (isNaN(ingresos) || ingresos < 100) {
            return res.status(400).json({
                success: false,
                message: 'No se puede crear la cuenta: los ingresos deben ser de al menos Q100.00'
            });
        }

        if (req.file) {
            fieldData.photo = req.file.path;
        }

        const field = new Field(fieldData);
        await field.save();

        res.status(201).json({
            success: true,
            message: 'Campo creado exitosamente',
            data: field
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el campo',
            error: error.message
        });
    }
};

export const deleteField = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedField = await Field.findByIdAndDelete(id);

        if (!deletedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta bancaria eliminada correctamente',
            data: deletedField
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la cuenta bancaria',
            error: error.message
        });
    }
};

export const getAccountByAccountNumber = async (req, res) => {
    try {
        const { accountNumber, numeroCuenta } = req.params;
        const accountNumberToFind = numeroCuenta || accountNumber;

        if (!accountNumberToFind) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar un número de cuenta'
            });
        }

        const account = await Field.findOne({ numeroCuenta: accountNumberToFind });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: account
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar la cuenta',
            error: error.message
        });
    }
};

export const updateField = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        if (req.file) {
            data.photo = req.file.path;
        }

        const updatedField = await Field.findByIdAndUpdate(
            id,
            data,
            { new: true, runValidators: true }
        );

        if (!updatedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta bancaria actualizada correctamente',
            data: updatedField
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la cuenta bancaria',
            error: error.message
        });
    }
};

export const getFields = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const fields = await Field.find()
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Field.countDocuments();

        res.status(200).json({
            success: true,
            data: fields,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los campos',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────────────────────
// NUEVOS ENDPOINTS: ENVÍO DE PDF POR CORREO
// ─────────────────────────────────────────────────────────────

/**
 * Envía un PDF con TODOS los registros de BankAccount al correo indicado.
 * GET /bankAccount/send-pdf/all/:email
 */
export const sendAllBankAccountsPDF = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'El correo proporcionado no es válido'
            });
        }

        const accounts = await Field.find().sort({ createdAt: -1 });

        if (!accounts.length) {
            return res.status(404).json({
                success: false,
                message: 'No hay cuentas bancarias registradas'
            });
        }

        const service = new EmailPDFService();
        const result = await service.sendEntityPDF({
            toEmail: email,
            subject: 'Reporte Completo – Cuentas Bancarias',
            title: 'Listado Completo de Cuentas Bancarias',
            entityName: 'BankAccount',
            data: accounts,
            fields: BANK_ACCOUNT_FIELDS,
            filename: 'cuentas_bancarias_reporte.pdf'
        });

        res.status(200).json({
            success: true,
            message: `PDF enviado correctamente a ${result.toEmail}`,
            data: {
                correoDestino: result.toEmail,
                archivoEnviado: result.filename,
                totalRegistros: result.records
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al enviar el PDF',
            error: error.message
        });
    }
};

/**
 * Envía un PDF con UNA cuenta bancaria específica al correo indicado.
 * GET /bankAccount/send-pdf/:id/:email
 */
export const sendBankAccountPDFById = async (req, res) => {
    try {
        const { id, email } = req.params;

        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'El correo proporcionado no es válido'
            });
        }

        const account = await Field.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        const service = new EmailPDFService();
        const result = await service.sendEntityPDF({
            toEmail: email,
            subject: `Detalle de Cuenta Bancaria – ${account.numeroCuenta}`,
            title: `Detalle de Cuenta: ${account.numeroCuenta}`,
            entityName: 'BankAccount',
            data: account,
            fields: BANK_ACCOUNT_FIELDS,
            filename: `cuenta_${account.numeroCuenta}.pdf`
        });

        res.status(200).json({
            success: true,
            message: `PDF enviado correctamente a ${result.toEmail}`,
            data: {
                correoDestino: result.toEmail,
                archivoEnviado: result.filename,
                cuentaEnviada: account.numeroCuenta
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al enviar el PDF',
            error: error.message
        });
    }
};

export const getCuentasPorMovimientos = async (req, res) => {
    try {
        const { orden = 'desc' } = req.query;
        const sortOrder = orden.toLowerCase() === 'asc' ? 1 : -1;

        const Transaction = (await import('../transactions/transactions_model.js')).default;

        const movimientosPorCuenta = await Transaction.aggregate([
            {
                $facet: {
                    comoOrigen: [
                        { $match: { cuentaOrigen: { $exists: true, $ne: null } } },
                        { $group: { _id: '$cuentaOrigen', total: { $sum: 1 } } }
                    ],
                    comoDestino: [
                        { $match: { cuentaDestino: { $exists: true, $ne: null } } },
                        { $group: { _id: '$cuentaDestino', total: { $sum: 1 } } }
                    ]
                }
            },
            { $project: { combinado: { $concatArrays: ['$comoOrigen', '$comoDestino'] } } },
            { $unwind: '$combinado' },
            { $group: { _id: '$combinado._id', totalMovimientos: { $sum: '$combinado.total' } } },
            { $sort: { totalMovimientos: sortOrder } }
        ]);

        const movimientosMap = {};
        movimientosPorCuenta.forEach(m => {
            movimientosMap[m._id.toString()] = m.totalMovimientos;
        });

        const cuentas = await Field.find().lean();
        const resultado = cuentas
            .map(c => ({ ...c, totalMovimientos: movimientosMap[c._id.toString()] || 0 }))
            .sort((a, b) => sortOrder === 1
                ? a.totalMovimientos - b.totalMovimientos
                : b.totalMovimientos - a.totalMovimientos
            );

        return res.status(200).json({
            success: true,
            orden: sortOrder === 1 ? 'ascendente' : 'descendente',
            totalCuentas: resultado.length,
            data: resultado
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};