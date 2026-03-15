import React from 'react';

interface PaymentConfirmedEmailProps {
    userName?: string;
    planName?: string;
    amount?: number | string;
    period?: string;
    endDate?: string;
}

export const PaymentConfirmedEmail: React.FC<PaymentConfirmedEmailProps> = ({
    userName,
    planName = 'Plan PRO',
    amount,
    period,
    endDate,
}) => {
    const periodLabel = period === 'yearly' ? 'Anual' : 'Mensual';

    return (
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", backgroundColor: '#f4f4f8', padding: '40px 20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderRadius: '16px 16px 0 0',
                    padding: '40px 40px 32px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                    <h1 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '26px', fontWeight: '800' }}>
                        ¡Pago Confirmado!
                    </h1>
                    <p style={{ color: '#a7f3d0', margin: 0, fontSize: '15px' }}>
                        Tu suscripción a ZetaProp fue activada con éxito
                    </p>
                </div>

                {/* Body */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '40px',
                    borderLeft: '1px solid #e5e7eb',
                    borderRight: '1px solid #e5e7eb'
                }}>
                    <p style={{ color: '#374151', fontSize: '16px', margin: '0 0 24px', lineHeight: '1.6' }}>
                        Hola <strong>{userName || 'Usuario'}</strong>, procesamos tu pago exitosamente.
                        A continuación el resumen de tu suscripción:
                    </p>

                    {/* Summary Box */}
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ color: '#6b7280', fontSize: '14px', paddingBottom: '12px' }}>Plan</td>
                                    <td style={{ color: '#111827', fontWeight: '600', fontSize: '14px', paddingBottom: '12px', textAlign: 'right' }}>{planName}</td>
                                </tr>
                                {amount && (
                                    <tr>
                                        <td style={{ color: '#6b7280', fontSize: '14px', paddingBottom: '12px' }}>Monto</td>
                                        <td style={{ color: '#111827', fontWeight: '600', fontSize: '14px', paddingBottom: '12px', textAlign: 'right' }}>${amount} ARS</td>
                                    </tr>
                                )}
                                <tr>
                                    <td style={{ color: '#6b7280', fontSize: '14px', paddingBottom: '12px' }}>Período</td>
                                    <td style={{ color: '#111827', fontWeight: '600', fontSize: '14px', paddingBottom: '12px', textAlign: 'right' }}>{periodLabel}</td>
                                </tr>
                                {endDate && (
                                    <tr>
                                        <td style={{ color: '#6b7280', fontSize: '14px' }}>Válido hasta</td>
                                        <td style={{ color: '#059669', fontWeight: '700', fontSize: '14px', textAlign: 'right' }}>{endDate}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <a
                            href="https://zetaprop.com.ar/dashboard"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                color: '#ffffff',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: '700',
                                fontSize: '16px',
                                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                            }}
                        >
                            Ir al Dashboard →
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '0 0 16px 16px',
                    padding: '24px 40px',
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    textAlign: 'center'
                }}>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                        © {new Date().getFullYear()} ZetaProp. Este recibo es automático, no respondas este email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentConfirmedEmail;
