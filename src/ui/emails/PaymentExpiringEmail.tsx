import React from 'react';

interface PaymentExpiringEmailProps {
    userName?: string;
    planName?: string;
    expiryDate?: string;
    daysLeft?: number;
}

export const PaymentExpiringEmail: React.FC<PaymentExpiringEmailProps> = ({
    userName,
    planName = 'Plan PRO',
    expiryDate,
    daysLeft = 7,
}) => {
    return (
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", backgroundColor: '#f4f4f8', padding: '40px 20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                    borderRadius: '16px 16px 0 0',
                    padding: '40px 40px 32px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏰</div>
                    <h1 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '26px', fontWeight: '800' }}>
                        Tu suscripción vence pronto
                    </h1>
                    <p style={{ color: '#fde68a', margin: 0, fontSize: '15px' }}>
                        Renovála para no perder el acceso a ZetaProp
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
                        Hola <strong>{userName || 'Usuario'}</strong>, te avisamos que tu suscripción a{' '}
                        <strong>{planName}</strong> en ZetaProp{' '}
                        <span style={{ color: '#d97706', fontWeight: '700' }}>vence en {daysLeft} días</span>.
                    </p>

                    {/* Alert box */}
                    <div style={{
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        marginBottom: '32px'
                    }}>
                        <p style={{ color: '#92400e', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                            <strong>📅 Fecha de vencimiento:</strong>{' '}
                            <span style={{ fontWeight: '700' }}>{expiryDate || 'Próximamente'}</span>
                            <br />
                            Si no renovás antes de esa fecha, tu cuenta pasará al plan gratuito y algunas
                            funciones quedarán deshabilitadas.
                        </p>
                    </div>

                    <h3 style={{ color: '#111827', fontSize: '16px', margin: '0 0 16px' }}>
                        ¿Qué perdés si no renovás?
                    </h3>
                    <ul style={{ color: '#6b7280', margin: '0 0 32px', padding: '0 0 0 20px', lineHeight: '2' }}>
                        <li>Acceso a agentes y gestión de equipo</li>
                        <li>Integración con portales inmobiliarios</li>
                        <li>Reportes financieros avanzados</li>
                        <li>Herramientas de IA para tasación</li>
                    </ul>

                    <div style={{ textAlign: 'center' }}>
                        <a
                            href="https://zetaprop.com.ar/precios"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                                color: '#ffffff',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: '700',
                                fontSize: '16px',
                                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                            }}
                        >
                            Renovar Suscripción →
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
                        © {new Date().getFullYear()} ZetaProp. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentExpiringEmail;
