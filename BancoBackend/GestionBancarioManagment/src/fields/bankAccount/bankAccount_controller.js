'use strict';

import Field from './bankAccount_model.js';
import { EmailPDFService } from '../../services/EmailPDFServices.js';

const ALLOWED_UPDATE_FIELDS = ['nombre', 'tipoCuenta', 'usuarioEmail'];
const MIN_INITIAL_BALANCE = 100;
const MAX_INITIAL_BALANCE = 2000;

const sanitizeAccountUpdate = (data) => {
    return ALLOWED_UPDATE_FIELDS.reduce((safeData, field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            safeData[field] = data[field];
        }
        return safeData;
    }, {});
};

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
        const fieldData = { ...req.body };

        if (req.file) {
            fieldData.photo = req.file.path;
        }

        const saldo = Number(fieldData.saldo ?? 0);
        if (Number.isNaN(saldo) || saldo < MIN_INITIAL_BALANCE) {
            return res.status(400).json({
                success: false,
                message: `El saldo inicial no puede ser menor a ${MIN_INITIAL_BALANCE}`
            });
        }
        if (saldo > MAX_INITIAL_BALANCE) {
            return res.status(400).json({
                success: false,
                message: `El saldo inicial no puede ser mayor a ${MAX_INITIAL_BALANCE}`
            });
        }
        fieldData.saldo = saldo;

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
        const { reason } = req.body || {};

        const deletedField = await Field.findByIdAndUpdate(
            id,
            {
                estado: 'cerrada',
                closedAt: new Date(),
                closedBy: req.user?.id || 'system',
                closedReason: reason || 'Cierre administrativo'
            },
            { new: true, runValidators: true }
        );

        if (!deletedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cuenta bancaria cerrada correctamente',
            data: deletedField
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cerrar la cuenta bancaria',
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
        const data = sanitizeAccountUpdate(req.body);

        if (req.file) {
            data.photo = req.file.path;
        }

        const field = await Field.findById(id);

        if (!field) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        if (req.user.role !== 'ADMIN_ROLE' && String(field.usuarioId) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar esta cuenta'
            });
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos permitidos para actualizar'
            });
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

export const toggleAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['activa', 'inactiva', 'bloqueada'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado invalido'
            });
        }

        const updatedField = await Field.findByIdAndUpdate(
            id,
            { estado },
            { new: true, runValidators: true }
        );

        if (!updatedField) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Estado de cuenta actualizado correctamente',
            data: updatedField
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Error al actualizar el estado de la cuenta',
            error: error.message
        });
    }
};

export const getFields = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(10, Math.max(1, parseInt(limit, 10) || 10));

        // Si el usuario no es ADMIN, solo ve sus propias cuentas
        const userId = String(req.user?.id);
        const filter = req.user?.role === 'ADMIN_ROLE'
            ? {}
            : { $or: [{ usuarioId: userId }, { usuarioId: Number(userId) }] };

        const fields = await Field.find(filter)
            .limit(limitNumber)
            .skip((pageNumber - 1) * limitNumber)
            .sort({ createdAt: -1 });

        const total = await Field.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: fields,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
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

export const getActiveDestinations = async (req, res) => {
    try {
        const accounts = await Field.find({ estado: 'activa' })
            .select('nombre numeroCuenta tipoCuenta saldo usuarioId')
            .sort({ nombre: 1 });

        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener cuentas destino',
            error: error.message
        });
    }
};


/**
 * Crear múltiples cuentas bancarias para un usuario específico (solo ADMIN).
 * POST /bankAccount/create/batch
 * Body: { accounts: [{ nombre, tipoCuenta, saldo, estado }], usuarioId, usuarioEmail }
 */
export const createFieldsForUser = async (req, res) => {
    try {
        const { accounts, usuarioId, usuarioEmail } = req.body;

        if (!usuarioId) {
            return res.status(400).json({ success: false, message: 'usuarioId es obligatorio' });
        }
        if (!usuarioEmail || !/.+@.+\..+/.test(usuarioEmail)) {
            return res.status(400).json({ success: false, message: 'usuarioEmail válido es obligatorio' });
        }
        if (!Array.isArray(accounts) || accounts.length === 0) {
            return res.status(400).json({ success: false, message: 'Se requiere al menos una cuenta en "accounts"' });
        }

        const created = [];
        for (const acc of accounts) {
            const numeroCuenta = acc.numeroCuenta || `ACC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
            const saldo = Number(acc.saldo ?? 0);

            if (Number.isNaN(saldo) || saldo < MIN_INITIAL_BALANCE) {
                return res.status(400).json({
                    success: false,
                    message: `El saldo inicial no puede ser menor a ${MIN_INITIAL_BALANCE}`
                });
            }
            if (saldo > MAX_INITIAL_BALANCE) {
                return res.status(400).json({
                    success: false,
                    message: `El saldo inicial no puede ser mayor a ${MAX_INITIAL_BALANCE}`
                });
            }

            const field = new Field({
                nombre: acc.nombre,
                numeroCuenta,
                tipoCuenta: acc.tipoCuenta || 'ahorro',
                saldo,
                estado: acc.estado || 'activa',
                usuarioId,
                usuarioEmail: usuarioEmail.toLowerCase().trim(),
            });
            await field.save();
            created.push(field);
        }

        res.status(201).json({
            success: true,
            message: `${created.length} cuenta(s) creada(s) exitosamente para el usuario`,
            data: created
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear las cuentas bancarias',
            error: error.message
        });
    }
};

export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;

        const account = await Field.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        if (req.user?.role !== 'ADMIN_ROLE' && String(account.usuarioId) !== String(req.user?.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta cuenta'
            });
        }

        return res.status(200).json({
            success: true,
            data: account
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener la cuenta',
            error: error.message
        });
    }
};

export const retirarDinero = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto } = req.body;

        const amount = Number(monto);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un numero positivo'
            });
        }

        const account = await Field.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        if (account.estado !== 'activa') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta no esta activa'
            });
        }

        if (req.user?.role !== 'ADMIN_ROLE' && String(account.usuarioId) !== String(req.user?.id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para retirar de esta cuenta'
            });
        }

        if (account.tipoCuenta === 'ahorro') {
            if (account.saldo - amount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente. Las cuentas de ahorro no permiten sobregiro'
                });
            }
        } else if (account.tipoCuenta === 'corriente') {
            const limiteSobregiro = Number(account.limiteSobregiro || 0);
            if (account.saldo - amount < -limiteSobregiro) {
                return res.status(400).json({
                    success: false,
                    message: `Saldo insuficiente. El limite de sobregiro disponible es Q ${(limiteSobregiro + account.saldo).toFixed(2)}`
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Tipo de cuenta no valido'
            });
        }

        account.saldo -= amount;
        await account.save();

        return res.status(200).json({
            success: true,
            message: 'Retiro realizado correctamente',
            data: account
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al realizar el retiro',
            error: error.message
        });
    }
};

export const aplicarInteresMensual = async (req, res) => {
    try {
        const { id } = req.params;

        const account = await Field.findById(id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        if (account.tipoCuenta !== 'ahorro') {
            return res.status(400).json({
                success: false,
                message: 'El interes mensual solo se aplica a cuentas de ahorro'
            });
        }

        if (account.estado !== 'activa') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta no esta activa'
            });
        }

        const tasaAnual = Number(account.tasaInteresAnual || 0);
        if (tasaAnual <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta no tiene una tasa de interes configurada'
            });
        }

        const interesMensual = (tasaAnual / 12 / 100) * account.saldo;
        const interesRedondeado = Math.round(interesMensual * 100) / 100;

        account.saldo += interesRedondeado;
        await account.save();

        return res.status(200).json({
            success: true,
            message: `Interes mensual aplicado: Q ${interesRedondeado.toFixed(2)}`,
            data: {
                account,
                interesAplicado: interesRedondeado,
                tasaMensual: `${(tasaAnual / 12).toFixed(4)}%`
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al aplicar el interes mensual',
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
export const createMyAccount = async (req, res) => {
    try {
        const { nombre, tipoCuenta = 'ahorro' } = req.body;
        if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });

        const numeroCuenta = `ACC-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
        const field = new Field({
            nombre, numeroCuenta, tipoCuenta, saldo: 100,
            usuarioId: String(req.user.id), estado: 'activa'
        });
        await field.save();
        res.status(201).json({ success: true, message: 'Cuenta creada exitosamente', data: field });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al crear la cuenta', error: error.message });
    }
};

export const closeMyAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Field.findById(id);
        if (!account) return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        if (String(account.usuarioId) !== String(req.user.id))
            return res.status(403).json({ success: false, message: 'No tienes permiso para cerrar esta cuenta' });
        if (account.saldo > 0)
            return res.status(400).json({ success: false, message: 'Debe retirar todo el saldo antes de cerrar la cuenta' });
        account.estado = 'cerrada';
        account.closedAt = new Date();
        account.closedBy = String(req.user.id);
        account.closedReason = 'Cerrada por el usuario';
        await account.save();
        res.status(200).json({ success: true, message: 'Cuenta cerrada correctamente', data: account });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cerrar la cuenta', error: error.message });
    }
};

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
