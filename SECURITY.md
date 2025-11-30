# Seguridad - PropIA

## 🔒 Medidas de Seguridad Implementadas

### 1. Firestore Security Rules ✅
**Archivo**: `firestore.rules`

**Características**:
- ✅ Autenticación requerida para operaciones sensibles
- ✅ Control de acceso basado en roles (Admin/Usuario)
- ✅ Validación de datos en el servidor
- ✅ Propietarios solo pueden modificar sus propios datos
- ✅ Logs de auditoría inmutables
- ✅ Pagos y transacciones protegidos

**Cómo desplegar**:
```bash
firebase deploy --only firestore:rules
```

---

### 2. Validación de Inputs con Zod ✅
**Archivo**: `src/lib/validation.ts`

**Schemas implementados**:
- ✅ Propiedades (title, description, price, etc.)
- ✅ Usuarios (email, password, phone)
- ✅ Agentes (nombre, email, comisiones)
- ✅ Tickets (title, description, category)
- ✅ Leads (name, email, phone)

**Uso**:
```typescript
import { propertySchema, validateAndSanitize } from '@/lib/validation';

const result = validateAndSanitize(propertySchema, formData);
if (!result.success) {
  console.error(result.errors);
  return;
}
// Use result.data (validated and typed)
```

**Características de seguridad**:
- ✅ Validación de tipos
- ✅ Longitud mínima/máxima
- ✅ Regex para emails y teléfonos
- ✅ Sanitización de strings (remove HTML tags)
- ✅ Validación de URLs
- ✅ Políticas de contraseñas fuertes

---

### 3. Headers de Seguridad ✅
**Archivo**: `next.config.js`

**Headers implementados**:
- ✅ **HSTS**: Force HTTPS (1 año)
- ✅ **X-Frame-Options**: Previene clickjacking
- ✅ **X-Content-Type-Options**: Previene MIME sniffing
- ✅ **X-XSS-Protection**: Protección XSS
- ✅ **Referrer-Policy**: Control de referrers
- ✅ **Permissions-Policy**: Deshabilita APIs peligrosas
- ✅ **Content-Security-Policy**: Política de contenido estricta

**CSP Details**:
```
- default-src 'self'
- script-src: Solo scripts propios y Google
- style-src: Estilos propios y Google Fonts
- img-src: Imágenes de cualquier origen HTTPS
- connect-src: Firebase y APIs propias
- frame-ancestors 'none': No embeds
- upgrade-insecure-requests: Force HTTPS
```

---

### 4. Variables de Entorno ✅
**Archivo**: `.env.local` (NO commitear)

**Variables requeridas**:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Seguridad**:
- ✅ `.env.local` en `.gitignore`
- ✅ `.env.example` como plantilla
- ✅ Validación en `next.config.js`
- ✅ Nunca exponer secrets en cliente

---

## 🛡️ Políticas de Seguridad

### Contraseñas
- ✅ Mínimo 8 caracteres
- ✅ Al menos 1 mayúscula
- ✅ Al menos 1 minúscula
- ✅ Al menos 1 número
- ✅ Máximo 100 caracteres

### Emails
- ✅ Validación con regex
- ✅ Conversión a lowercase
- ✅ Trim de espacios

### Teléfonos
- ✅ Formato: +[código][número]
- ✅ 8-15 dígitos
- ✅ Solo números y +

### URLs
- ✅ Solo HTTP/HTTPS
- ✅ Validación con URL API
- ✅ Sanitización de protocolos peligrosos

---

## 📋 Checklist de Despliegue

Antes de ir a producción:

- [ ] Desplegar Firestore Security Rules
- [ ] Configurar variables de entorno en Vercel/hosting
- [ ] Verificar que `.env.local` NO esté en git
- [ ] Habilitar HTTPS en dominio
- [ ] Configurar Firebase Authentication
- [ ] Revisar permisos de usuarios
- [ ] Probar validaciones en formularios
- [ ] Verificar headers de seguridad
- [ ] Configurar rate limiting (próximo)
- [ ] Implementar 2FA para admins (próximo)

---

## 🚨 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** la publiques públicamente
2. Envía un email a: security@propia.com
3. Incluye:
   - Descripción del problema
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Zod Documentation](https://zod.dev/)

---

## 🔄 Próximos Pasos

### Alta Prioridad
- [ ] Rate limiting en login
- [ ] Logs de auditoría completos
- [ ] Mensajes de error genéricos
- [ ] Política de contraseñas en UI

### Media Prioridad
- [ ] 2FA para administradores
- [ ] Monitoreo y alertas
- [ ] Auditoría de dependencias
- [ ] Backup automático

---

**Última actualización**: 2024-11-30
**Versión**: 1.0.0
