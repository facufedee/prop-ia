const saasWrapper = (content) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    <div style="text-align: center; margin-bottom: 25px;">
        <img src="https://zetaprop.com.ar/assets/img/logo_zeta_prop_marzo.jpeg" alt="Zeta Prop" style="height: 45px; margin-bottom: 10px;" />
    </div>
    <div style="font-size: 16px;">
        ${content}
    </div>
    <p style="margin-top: 30px;">
        Éxitos en tu gestión,<br>
        <strong>Facundo</strong><br>
        <span style="color: #2563eb; font-weight: bold;">Zeta Prop</span>
    </p>
    <div style="font-size: 0.85em; color: #64748b; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        Ingresá al portal: <a href="https://zetaprop.com.ar/login" style="color: #2563eb; text-decoration: none; font-weight: bold;">zetaprop.com.ar/login</a>
    </div>
    <div style="font-size: 0.75em; color: #94a3b8; margin-top: 15px; text-align: center;">
        ¿No querés recibir más estos correos? <a href="https://zetaprop.com.ar/unsubscribe?email={{email}}" style="color: #94a3b8; text-decoration: underline;">Darse de baja de la lista</a>
    </div>
</div>
`;

const templates_raw = [
    {
        type: 'welcome',
        name: 'Bienvenida',
        subject: 'Bienvenido a Zeta Prop — empezá en 5 minutos',
        content: `
        <p>Hola {{userName}},</p>
        <p>Gracias por registrarte en Zeta Prop.</p>
        <p>La plataforma está pensada para que puedas administrar tus alquileres de forma simple y tener propiedades, contratos, aumentos y cobranzas en un solo lugar.</p>
        <p>Para empezar, te recomiendo estos pasos:</p>
        <ul>
            <li>Cargar una propiedad</li>
            <li>Agregar el propietario</li>
            <li>Incorporar el inquilino</li>
            <li>Registrar el contrato</li>
        </ul>
        <p>Con solo un contrato ya podés comenzar a gestionar todo desde el sistema y olvidarte del Excel para siempre.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zetaprop.com.ar/login" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ingresar a mi panel</a>
        </div>
        <p>Si necesitás ayuda para empezar, podés responder directamente a este mensaje.</p>
        `
    },
    {
        type: 'activation',
        name: 'Activación',
        subject: 'Un consejo para empezar: cargá solo un alquiler',
        content: `
        <p>Hola {{userName}},</p>
        <p>Muchos usuarios comienzan usando Zeta Prop con un solo alquiler.</p>
        <p>No hace falta cargar toda la cartera de propiedades de golpe. Con estos datos ya podés empezar:</p>
        <ul>
            <li>Una propiedad</li>
            <li>Un propietario</li>
            <li>Un inquilino</li>
            <li>El contrato</li>
        </ul>
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin-top: 0; font-weight: bold; color: #2563eb;">A partir de ahí el sistema ya te permite:</p>
            <ul style="margin-bottom: 0;">
                <li>registrar pagos automáticamente</li>
                <li>controlar vencimientos sin depender de tu memoria</li>
                <li>ver la cuenta corriente de cada propiedad al instante</li>
                <li>generar liquidaciones en PDF</li>
            </ul>
        </div>
        <p>Si querés, avisame y te ayudo personalmente a cargar el primer contrato online.</p>
        `
    },
    {
        type: 'value',
        name: 'Valor (Liquidaciones)',
        subject: 'Cómo generar la liquidación del alquiler en segundos',
        content: `
        <p>Hola {{userName}},</p>
        <p>Una de las funciones que más valoran las inmobiliarias que usan Zeta Prop es la <strong>generación automática de liquidaciones</strong>.</p>
        <p>Una vez cargado el contrato y los pagos del mes, apretando solo un botón el sistema puede generar:</p>
        
        <p style="color: #2563eb; font-weight: bold; margin-top: 20px;">Liquidación para el propietario</p>
        <ul>
            <li>alquiler cobrado</li>
            <li>comisión inmobiliaria (honorarios calculados solos)</li>
            <li>gastos o descuentos aplicables</li>
            <li>monto exacto a transferir</li>
        </ul>
        
        <p style="color: #2563eb; font-weight: bold; margin-top: 20px;">Liquidación para el inquilino (Recibo)</p>
        <ul>
            <li>alquiler del período</li>
            <li>aumentos indexados aplicados</li>
            <li>total final a pagar</li>
        </ul>
        
        <p>De esta forma dejás de preparar liquidaciones manuales o equivocarte con las calculadoras. Todo queda archivado y listo para mandar por WhatsApp en formato profesional.</p>
        `
    },
    {
        type: 'social',
        name: 'Prueba Social',
        subject: 'Descubrí por qué modernizar tu gestión',
        content: `
        <p>Hola {{userName}},</p>
        <p>Hoy en día, docenas de inmobiliarias, tasadores y administradores utilizan Zeta Prop para simplificar la gestión de sus alquileres y propiedades.</p>
        <p>El mayor valor que han encontrado es la tranquilidad:</p>
        <ul style="line-height: 1.8;">
            <li>No perder nunca un comprobante de pago</li>
            <li>Saber con un clic quién está en mora exactamente</li>
            <li>Transmitir al cliente una imagen 100% <strong>Profesional y Tecnológica</strong></li>
        </ul>
        <p>La idea de nuestro sistema es ahorrar el tiempo administrativo que consume tu energía, para que puedas enfocarte en lo que de verdad importa: concretar ventas y captar más clientes.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://zetaprop.com.ar/" style="background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Funciones Premium</a>
        </div>
        `
    },
    {
        type: 'conversion',
        name: 'Conversión',
        subject: 'Seguí usando Zeta Prop para administrar tus alquileres',
        content: `
        <p>Hola {{userName}},</p>
        <p>Espero que hayas podido probar Zeta Prop durante estos días de uso inicial.</p>
        <p>Recapitulando, el sistema fue diseñado estrictamente para el mercado inmobiliario argentino con un objetivo claro. Gestionar en una sola pantalla de forma veloz y simple tus:</p>
        <ul>
            <li>Propiedades & Portales Web</li>
            <li>Contratos e indexaciones (ICL, IPC, etc)</li>
            <li>Alertas de Vencimiento de alquileres</li>
            <li>Pagos fraccionados y cuentas corrientes</li>
        </ul>
        <p>Si la plataforma demostró serte útil para organizar y potenciar la administración de tus alquileres, podés pasarte al <strong>Plan Premium</strong> para continuar utilizándola sin restricciones ni bloqueos de funcionalidad.</p>
        <p>Cualquier sugerencia que nos pueda ser de ayuda, por favor respondé a este mail 📩.</p>
        `
    },
    {
        type: 'promotion',
        name: 'Promoción Plan Anual',
        subject: 'Última oportunidad: Tu inmobiliaria en Internet con descuento 🚀',
        content: `
        <p>¡Hola {{userName}}!</p>
        <p>Sumamos una nueva herramienta estrella en nuestro sistema para ayudarte a conseguir más interesados sin costo por contacto.</p>
        <p>Ahora podés conectarte a <strong>Tu Propio Portal Web Inmobiliario Exclusivo</strong> (donde figuran sólo tus propiedades) y compartir el link por Instagram o WhatsApp a posibles compradores.</p>
        <p>Sin competidores al lado y con carga de datos transparente directamente desde tu CRM en ZetaProp. Si cambian un precio, se actualiza automáticamente.</p>
        <p>Todo esto integrado en un ecosistema robusto pero mucho más <strong>ágil y económico</strong> que las grandes plataformas anticuadas. Animate a dar el salto tecnológico este año con nosotros.</p>
        `
    },
    // ---- Keep the other standard/base notifications just in case ----
    {
        type: 'payment_confirmed',
        name: 'Pago Confirmado',
        subject: 'Recibo de Pago Acreditado - Zeta Prop',
        content: `
        <p>Hola {{userName}},</p>
        <p>Este correo confirma que tu último pago correspondiente a <strong>{{planName}}</strong> ha sido acreditado exitosamente.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 0; font-size: 1.1em; color: #334155; text-align: center;">Tu próxima fecha de cierre es: <strong>{{expiryDate}}</strong></p>
        </div>
        <p>¡Te agradecemos por seguir confiando en nuestra plataforma para tu trabajo diario!</p>
        `
    },
    {
        type: 'payment_expiring',
        name: 'Aviso de Vencimiento',
        subject: 'Recordatorio Importante: Tu plan vence pronto ⏰',
        content: `
        <p>Hola {{userName}},</p>
        <p>Te escribimos de manera automática porque queríamos recordarte que tu suscripción <strong>{{planName}}</strong> está próxima a vencer el día <strong>{{expiryDate}}</strong>.</p>
        <p>Por favor, recordá generar o enviar el comprobante de pago con tu asesor correspondiente o utilizando nuestros medios electrónicos para no ver interrumpido tu acceso al panel de control Premium.</p>
        <p>Si ya realizaste el pago, simplemente desestimá esta notificación.</p>
        `
    },
    {
        type: 'new_lead',
        name: 'Nueva Consulta CRM',
        subject: '📥 Tienes una nueva consulta en Zeta Prop',
        content: `
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">¡Llegó un Interesado!</h2>
        <p>Hola {{userName}},</p>
        <p>Estás recibiendo este alerta del sistema porque un usuario solicitó información de una de tus oportunidades vigentes:</p>
        <ul style="background-color: #f8fafc; padding: 20px 40px; border-radius: 8px;">
            <li><strong>Propiedad de Interés:</strong> {{propertyName}}</li>
            <li><strong>Remitente (Lead):</strong> {{leadName}}</li>
        </ul>
        <p>Ingresá inmediatamente a la plataforma de CRM en tu sesión para responderle y avanzar en la negociación a la brevedad.</p>
        `
    }
];

const templates = templates_raw.map(t => ({
    ...t,
    html: saasWrapper(t.content)
}));

async function seed() {
    for (const t of templates) {
        console.log(`Seeding ${t.name}...`);
        const res = await fetch('http://localhost:3000/api/marketing/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: t.type, name: t.name, subject: t.subject, html: t.html })
        });
        const data = await res.json();
        console.log(`Result for ${t.name}: `, data);
    }
    console.log("Done seeding premium templates!");
}

seed();
