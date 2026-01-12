import React from 'react';

interface VerificationEmailProps {
    verificationLink: string;
    userName?: string;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({ verificationLink, userName }) => {
    return (
        <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', padding: '20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ backgroundColor: '#000000', padding: '20px', textAlign: 'center' }}>
                    <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px' }}>ZetaProp</h1>
                </div>
                <div style={{ padding: '30px' }}>
                    <h2 style={{ color: '#333333', marginTop: 0 }}>Verifica tu correo electrónico</h2>
                    <p style={{ color: '#666666', lineHeight: '1.6' }}>
                        Hola {userName || 'Usuario'},
                    </p>
                    <p style={{ color: '#666666', lineHeight: '1.6' }}>
                        Gracias por registrarte en ZetaProp. Para comenzar a usar la plataforma, por favor confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.
                    </p>
                    <div style={{ textAlign: 'center', margin: '30px 0' }}>
                        <a
                            href={verificationLink}
                            style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                display: 'inline-block'
                            }}
                        >
                            Confirmar Email
                        </a>
                    </div>
                    <p style={{ color: '#666666', fontSize: '14px', lineHeight: '1.6' }}>
                        Si no creaste esta cuenta, puedes ignorar este correo.
                    </p>
                    <hr style={{ border: 'none', borderTop: '1px solid #eeeeee', margin: '20px 0' }} />
                    <p style={{ color: '#999999', fontSize: '12px', textAlign: 'center' }}>
                        © {new Date().getFullYear()} ZetaProp. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerificationEmail;
