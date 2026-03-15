import React from 'react';

interface NewLeadEmailProps {
    agentName?: string;
    leadName?: string;
    leadEmail?: string;
    leadPhone?: string;
    propertyName?: string;
    propertyAddress?: string;
    message?: string;
}

export const NewLeadEmail: React.FC<NewLeadEmailProps> = ({
    agentName,
    leadName,
    leadEmail,
    leadPhone,
    propertyName,
    propertyAddress,
    message,
}) => {
    return (
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", backgroundColor: '#f4f4f8', padding: '40px 20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: '16px 16px 0 0',
                    padding: '40px 40px 32px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                    <h1 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '26px', fontWeight: '800' }}>
                        ¡Tenés una nueva consulta!
                    </h1>
                    <p style={{ color: '#c4b5fd', margin: 0, fontSize: '15px' }}>
                        Felicitaciones, hay alguien interesado en tu propiedad
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
                        Hola <strong>{agentName || 'Agente'}</strong>, recibiste una nueva consulta a través
                        de ZetaProp. Aquí los detalles:
                    </p>

                    {/* Property Info */}
                    {propertyName && (
                        <div style={{
                            background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ color: '#4f46e5', margin: '0 0 4px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Propiedad Consultada
                            </p>
                            <p style={{ color: '#111827', margin: 0, fontSize: '16px', fontWeight: '700' }}>
                                🏠 {propertyName}
                            </p>
                            {propertyAddress && (
                                <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '13px' }}>
                                    📍 {propertyAddress}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Lead Info */}
                    <div style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '20px',
                        marginBottom: '24px'
                    }}>
                        <p style={{ color: '#6b7280', margin: '0 0 12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Datos del Interesado
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {leadName && (
                                    <tr>
                                        <td style={{ color: '#9ca3af', fontSize: '13px', paddingBottom: '8px', width: '100px' }}>👤 Nombre</td>
                                        <td style={{ color: '#111827', fontWeight: '600', fontSize: '14px', paddingBottom: '8px' }}>{leadName}</td>
                                    </tr>
                                )}
                                {leadEmail && (
                                    <tr>
                                        <td style={{ color: '#9ca3af', fontSize: '13px', paddingBottom: '8px' }}>✉️ Email</td>
                                        <td style={{ color: '#4f46e5', fontWeight: '500', fontSize: '14px', paddingBottom: '8px' }}>
                                            <a href={`mailto:${leadEmail}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{leadEmail}</a>
                                        </td>
                                    </tr>
                                )}
                                {leadPhone && (
                                    <tr>
                                        <td style={{ color: '#9ca3af', fontSize: '13px' }}>📱 Teléfono</td>
                                        <td style={{ color: '#111827', fontWeight: '500', fontSize: '14px' }}>
                                            <a href={`tel:${leadPhone}`} style={{ color: '#111827', textDecoration: 'none' }}>{leadPhone}</a>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Message */}
                    {message && (
                        <div style={{
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderLeft: '4px solid #4f46e5',
                            borderRadius: '8px',
                            padding: '16px 20px',
                            marginBottom: '32px'
                        }}>
                            <p style={{ color: '#6b7280', margin: '0 0 8px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                                Mensaje
                            </p>
                            <p style={{ color: '#374151', margin: 0, fontSize: '14px', lineHeight: '1.7', fontStyle: 'italic' }}>
                                "{message}"
                            </p>
                        </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                        <a
                            href="https://zetaprop.com.ar/dashboard/leads"
                            style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                color: '#ffffff',
                                padding: '14px 32px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: '700',
                                fontSize: '16px',
                                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                            }}
                        >
                            Ver Consulta en Dashboard →
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
                        © {new Date().getFullYear()} ZetaProp. Recibís este email porque tenés una cuenta activa.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NewLeadEmail;
