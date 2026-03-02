export const emailTemplate = ({ tipo, monto, saldo }) => {

    const color = 
        tipo === 'deposito' ? '#16a34a' :
        tipo === 'retiro' ? '#dc2626' :
        '#2563eb';

    const titulo = 
        tipo === 'deposito' ? 'Depósito Realizado' :
        tipo === 'retiro' ? 'Retiro Realizado' :
        'Transferencia Procesada';

    return `
    <div style="font-family: Arial, sans-serif; background:#f3f4f6; padding:40px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.08);">

            <div style="background:${color}; padding:20px; text-align:center; color:white;">
                <h2 style="margin:0;">Banco Digital</h2>
            </div>

            <div style="padding:30px;">

                <h3 style="margin-top:0; color:#111;">${titulo}</h3>

                <p style="color:#555; font-size:15px;">
                    Su operación ha sido procesada exitosamente.
                </p>

                <div style="margin:25px 0; padding:20px; background:#f9fafb; border-radius:8px;">
                    <p style="margin:8px 0;"><strong>Monto:</strong> Q${monto}</p>
                    <p style="margin:8px 0;"><strong>Saldo actual:</strong> Q${saldo}</p>
                    <p style="margin:8px 0;"><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p style="font-size:13px; color:#6b7280;">
                    Si usted no reconoce esta operación, comuníquese inmediatamente con soporte.
                </p>

            </div>

            <div style="background:#f3f4f6; text-align:center; padding:15px; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Banco Digital. Todos los derechos reservados.
            </div>

        </div>
    </div>
    `;
};