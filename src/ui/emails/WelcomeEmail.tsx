import React from 'react';

interface WelcomeEmailProps {
    userName?: string;
    email?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName, email }) => {
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
                    <h1 style={{ color: '#ffffff', margin: '0 0 8px', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        Zeta<span style={{ color: '#c4b5fd' }}>Prop</span>
                    </h1>
                    <p style={{ color: '#c4b5fd', margin: 0, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        Plataforma Inmobiliaria
                    </p>
                </div>

                {/* Body */}
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '40px',
                    borderLeft: '1px solid #e5e7eb',
                    borderRight: '1px solid #e5e7eb'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            display: 'inline-block',
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                            borderRadius: '50%',
                            lineHeight: '64px',
                            fontSize: '28px',
                            marginBottom: '16px'
                        }}>🎉</div>
                        <h2 style={{ color: '#111827', fontSize: '24px', fontWeight: '700', margin: '0 0 8px' }}>
                            ¡Bienvenido/a a ZetaProp!
                        </h2>
                        <p style={{ color: '#6b7280', margin: 0 }}>
                            Hola <strong>{userName || 'Usuario'}</strong>, tu cuenta fue creada exitosamente.
                        </p>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '32px'
                    }}>
                        <h3 style={{ color: '#4f46e5', margin: '0 0 16px', fontSize: '16px', fontWeight: '600' }}>
                            ✨ Lo que podés hacer desde ya:
                        </h3>
                        <ul style={{ color: '#374151', margin: 0, padding: '0 0 0 20px', lineHeight: '1.8' }}>
                            <li>Cargar y publicar tus propiedades</li>
                            <li>Gestionar contratos de alquiler</li>
                            <li>Administrar tu cartera de clientes</li>
                            <li>Acceder a herramientas de tasación con IA</li>
                        </ul>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <a
                            href="https://zetaprop.com.ar/dashboard"
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
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px' }}>
                        © {new Date().getFullYear()} ZetaProp. Todos los derechos reservados.
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                        Estás recibiendo este email porque te registraste con {email || 'tu email'}.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WelcomeEmail;
