# Plan Zeta Prop Mobile — App para agentes e inmobiliarias

**Alcance decidido:** app móvil (iOS + Android) para los usuarios actuales de Zeta Prop (agentes, administradores de inmobiliaria), como complemento del CRM web — no un portal público de búsqueda de propiedades.

**Stack decidido:** React Native + Expo, compartiendo dominio/lógica de negocio con el proyecto Next.js actual (`prop-ia`) sobre el mismo backend Firebase.

**Por qué esta combinación funciona bien acá:** hoy el proyecto no tiene un backend propio separado de Firebase — el web app habla directo con Firestore/Auth desde el cliente (`src/infrastructure/firebase/client.ts`) y usa `src/app/api/**` (Next.js API routes + Admin SDK) sólo para lo que necesita privilegios de servidor (pagos, emails, WhatsApp, cron). Eso significa que la app móvil **no necesita un backend nuevo**: es un cliente más de la misma base Firebase, y puede reusar esas mismas API routes para todo lo que hoy pasa por servidor. El trabajo real está en el cliente móvil, no en inventar infraestructura.

---

## 0. Decisiones ya tomadas (para no repetir la conversación)

| Pregunta | Decisión |
|---|---|
| ¿Para quién es la app? | Agentes/administradores de inmobiliaria (usuarios internos del CRM) |
| ¿Tecnología? | React Native + Expo (managed workflow) |
| ¿Backend nuevo? | No — Firebase existente (`propia` DB) + API routes existentes de Next.js |
| ¿Monorepo? | Sí, recomendado (ver sección 2) |

Todo lo que sigue asume estas decisiones. Si alguna cambia, hay que revisar en cascada las secciones 2, 4 y 8.

---

## 1. Análisis (antes de escribir una línea de código)

### 1.1 Objetivo de negocio
Definir en una frase qué problema resuelve la app que el CRM web no resuelve bien. Hipótesis de partida (validar con 2-3 agentes reales antes de codear):
- Un agente en la calle necesita cargar una visita, actualizar el estado de un lead o subir fotos de una propiedad **desde el celular, en el momento**, no volviendo a la oficina.
- Notificaciones push de leads nuevos (hoy sólo hay email — un lead entra y nadie se entera hasta que alguien abre el mail).
- Acceso rápido a Cartelería en campo (marcar un cartel como "Instalado" parado frente al cartel, con foto tomada ahí mismo).

### 1.2 Usuarios y roles
La app hereda el sistema de roles/permisos que ya existe (`src/infrastructure/services/roleService.ts`, `DEFAULT_PERMISSIONS`, `hasPermission()`). No hay que diseñar un sistema de permisos nuevo — hay que decidir **qué subconjunto de esos permisos aplica a mobile** (ej.: ¿Configuración de Roles tiene sentido en el celular? probablemente no).

### 1.3 Alcance del MVP (recomendado)
No portar el CRM entero de una — un MVP angosto que un agente use todos los días:
1. Login (Firebase Auth, mismo usuario que en la web)
2. Dashboard simple: leads nuevos, próximas visitas del día
3. Leads: ver lista, ver detalle, cambiar estado, agregar nota, llamar/WhatsApp con un tap
4. Propiedades: ver lista/detalle, marcar como reservada/vendida, subir foto desde cámara
5. Calendario/Visitas: ver agenda del día, marcar visita como realizada
6. Alquileres: ver contratos activos, estado de pagos, próximos vencimientos, marcar pago registrado
7. Notificaciones push: lead nuevo asignado, visita en 1 hora, vencimiento de contrato/pago próximo

Todo lo demás (Finanzas, Marketing, Configuración, Fichas PDF, Chat con IA, gestión de Roles, Cartelería) queda para fases posteriores o directamente se deja sólo en la web — no todo necesita vivir en el celular.

### 1.4 Research de referencia
Mirar apps de la competencia (Tokko Broker App, Zonaprop Pro, apps de Century21/RE/MAX para agentes) para no reinventar patrones de UX que el usuario ya conoce. 30 minutos de research, no un sprint.

### 1.5 Qué se mide como éxito
Definir 2-3 métricas antes de lanzar, no después: ej. % de agentes activos que abren la app al menos 1 vez por día en la primera semana, tiempo entre "lead entra" y "lead contactado" (¿baja con push?).

---

## 2. Arquitectura

### 2.1 Estructura de repos: monorepo recomendado
No conviene crear un repo 100% aislado que duplique tipos y lógica a mano. Recomendado:

```
prop-ia/                      (raíz del monorepo, o convertir el actual)
├── apps/
│   ├── web/                  (el Next.js actual, se mueve acá)
│   └── mobile/                (nuevo, Expo)
├── packages/
│   └── core/                  (compartido: domain models, servicios "puros", tipos)
├── package.json               (workspaces)
```

Herramienta: **npm/pnpm workspaces** alcanza para 2 apps — no hace falta Turborepo/Nx todavía (agregar Turborepo sólo si el build empieza a ser lento).

**Alternativa más rápida para arrancar sin migrar el repo actual:** crear `apps-movil-zetaprop` como repo separado y, en vez de un paquete compartido real, copiar/adaptar a mano los `domain/models/*.ts` que se necesiten (son interfaces TS puras, sin dependencias de Next.js — `Property.ts`, `Lead.ts`, `Cartel.ts`, `Visita.ts`, `User.ts` se copian casi literal). Es más rápido para el MVP, pero genera deuda de sincronización manual apenas alguien cambia un modelo en un lado y se olvida del otro. Decisión pragmática: **empezar así para no bloquear el arranque, migrar a monorepo real cuando haya 2+ personas tocando ambos proyectos.**

### 2.2 Qué se reutiliza tal cual
- **Domain models** (`src/domain/models/*.ts`): son interfaces TypeScript planas, se comparten 1:1.
- **Reglas de negocio puras** dentro de los `*Service.ts` que no dependen de Next.js (ej. lógica de `cambiarEstado()` en `carteleriaService.ts`, cálculos de `formatPropertyPrice` en `src/ui/utils/propertyPrice.ts`) — extraerlas a `packages/core` si se hace el monorepo.
- **Firestore mismo proyecto, misma base nombrada `"propia"`**: el SDK cliente de Firebase (v11, ya en `package.json`) funciona igual en React Native.
- **API routes existentes** (`src/app/api/**`) como backend para todo lo que hoy corre server-side: pagos (Mercado Pago), envío de WhatsApp/email, generación de descripciones con IA. La app mobile les pega igual que hoy les pega el browser — mismos endpoints, mismo dominio `zetaprop.com.ar`.

### 2.3 Riesgo técnico a validar el día 1 (antes de comprometer el resto del plan)
Firebase JS SDK + React Native/Expo tiene fricciones conocidas:
- Auth necesita persistencia con AsyncStorage: `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })` en vez del `getAuth()` que usa la web.
- Metro (el bundler de RN) a veces requiere config extra para paquetes de Firebase v11+ (`resolver.sourceExts`, `package.json:exports` handling).
- Confirmar que `getFirestore(app, "propia")` (base nombrada, no default) funciona igual desde el SDK en RN — es la misma librería `firebase`, debería funcionar, pero es lo primero que hay que probar con un "hello world" antes de construir nada más encima.

**Acción concreta:** un spike de 1-2 días: proyecto Expo en blanco, login contra el mismo Firebase, leer un documento de `properties`. Si esto no funciona limpio, hay que evaluar Firebase Admin SDK detrás de una API route propia como capa intermedia en vez de acceso directo — cambiaría el resto del plan.

### 2.4 Autenticación y permisos en mobile
- Login con Firebase Auth (email/password, igual que hoy — revisar si además se quiere Google Sign-In nativo, es casi gratis agregarlo con Expo).
- Al loguear, igual que en `AuthContext` de la web: leer el doc de `users/{uid}`, resolver `roleId` → permisos vía `roleService`, guardar en contexto de la app.
- Guard de navegación mobile equivalente a `RoleProtection`/`PermissionGuard` de la web, pero adaptado a stacks de navegación (React Navigation) en vez de rutas de Next.js.
- Sesión persistente con `expo-secure-store` para el refresh token (no `AsyncStorage` plano para nada sensible).
- Soporte de biometría (Face ID/huella) para desbloquear la app sin volver a tipear password — `expo-local-authentication`. No es MVP crítico pero es barato y los agentes lo van a pedir.

### 2.5 Notificaciones push (infraestructura nueva)
Hoy **no existe** ningún sistema de push en el proyecto (sólo `emailNotificationService.ts`/`marketingEmailService.ts`, confirmado por búsqueda en el repo). Hay que construirlo:
1. Firebase Cloud Messaging (FCM) — ya está disponible porque el proyecto ya usa Firebase.
2. Guardar `pushToken` por usuario en Firestore (`users/{uid}/devices/{deviceId}` o campo simple si es 1 dispositivo por usuario).
3. Un **Cloud Function** (nuevo — hoy no hay Cloud Functions en el proyecto, todo pasa por Next.js API routes) disparada por escritura en `leads` o `visitas` que llama a FCM. Alternativa sin Cloud Functions: extender `src/app/api/notifications/trigger/route.ts` para que, además de mandar el email que ya manda, también dispare el push — más simple de mantener porque no suma una plataforma nueva (Cloud Functions) al proyecto.
4. Definir eventos que disparan push: lead nuevo asignado, visita en X tiempo, cartel con acción pendiente, pago vencido (para el admin de la inmobiliaria).

### 2.6 Modo offline (decisión de alcance, no asumir)
Un agente en una propiedad sin señal necesita poder cargar una visita y que se sincronice después. Firestore SDK tiene persistencia offline nativa (`enableIndexedDbPersistence` en web; en RN es distinto, revisar soporte offline del SDK v11 en Expo). Decisión pragmática: **MVP online-only**, agregar offline-first en fase 2 sólo si el feedback real de los agentes lo pide — es una de las partes más caras de hacer bien (conflictos de sincronización) y fácil de sobre-invertir sin necesidad.

---

## 3. Diseño (UX/UI)

### 3.1 Design system
No inventar uno nuevo de cero — extraer tokens del `landing-theme.css` / sistema de diseño ya establecido para la web (colores de marca violeta→azul, tipografía) y adaptarlos a un theme de React Native (ej. con Tamagui, NativeWind/Tailwind-RN, o React Native Paper). Recomendado: **NativeWind** (Tailwind para RN) porque el equipo ya piensa en clases Tailwind del lado web.

### 3.2 Pantallas del MVP (wireframe a nivel lista, no mockup todavía)
1. Login / Splash
2. Home / Dashboard del día (leads nuevos, visitas de hoy, alertas)
3. Lista de Leads (filtros: estado, fecha) → Detalle de Lead (timeline, cambiar estado, llamar/WhatsApp)
4. Lista de Propiedades (filtros: estado, tipo) → Detalle de Propiedad (fotos, cambiar estado, subir foto)
5. Calendario / Agenda → Detalle de Visita
6. Cartelería: lista de carteles asignados → Detalle (cambiar estado, foto, ubicación)
7. Perfil / Configuración de cuenta / Cerrar sesión

### 3.3 Principios de diseño mobile-específicos
- Todo lo que se puede hacer con el pulgar en una mano (agentes en la calle, con el teléfono en una mano y quizás una carpeta en la otra).
- Acciones críticas (llamar, WhatsApp, marcar visita realizada) a un tap desde la lista, no enterradas 3 pantallas adentro.
- Carga de fotos con la cámara como flujo de primera clase (no "elegir de la galería" como única opción).
- Estados de carga y error explícitos — la conectividad en la calle es peor que en oficina, hay que diseñar para eso (spinners, reintentos, mensajes claros de "sin conexión").

### 3.4 Herramienta de diseño
Figma para mockups de alta fidelidad antes de codear las pantallas del MVP — evita iterar UI directamente en código, que es mucho más lento para probar variantes.

---

## 4. Codificación

### 4.1 Setup inicial
```bash
npx create-expo-app@latest zetaprop-mobile --template
```
- Expo Router (file-based routing, similar mentalmente a Next.js App Router — curva de aprendizaje baja para el equipo).
- TypeScript desde el día 1 (coherente con el resto del proyecto).
- ESLint + Prettier con la misma config que `prop-ia` en lo posible.

### 4.2 Librerías clave
| Necesidad | Librería |
|---|---|
| Firebase | `firebase` (JS SDK modular, misma versión mayor que la web) |
| Persistencia auth | `@react-native-async-storage/async-storage` |
| Almacenamiento seguro | `expo-secure-store` |
| Navegación | Expo Router (o React Navigation si no se usa Expo Router) |
| Formularios | `react-hook-form` + `zod` (mismas que la web — reusar schemas de validación) |
| Estilos | NativeWind |
| Cámara/fotos | `expo-image-picker` / `expo-camera` |
| Ubicación | `expo-location` (para Cartelería) |
| Push | `expo-notifications` + FCM |
| Llamadas/WhatsApp | `Linking` de React Native (`tel:`, `https://wa.me/`) |
| Fechas | `date-fns` (ya en uso en la web, reusar) |

### 4.3 Convenciones de código
Espejar lo que ya funciona en `prop-ia`: capas `domain/` (modelos), `infrastructure/` (servicios que hablan con Firebase), `ui/` (componentes). No inventar una arquitectura nueva para mobile si la actual ya es clara.

### 4.4 Orden de desarrollo sugerido (sprints de ~1 semana c/u, ajustable)
1. Spike técnico (sección 2.3) + setup del proyecto + diseño en Figma en paralelo
2. Auth + navegación + guards de permisos
3. Leads (lista + detalle + cambio de estado)
4. Propiedades (lista + detalle + subir foto)
5. Calendario/Visitas
6. Cartelería
7. Push notifications end-to-end
8. Pulido, manejo de errores, estados vacíos, QA manual completo
9. Beta cerrada con 2-3 agentes reales

---

## 5. Testing

- **Unitario**: Vitest (ya en uso en el proyecto web) para lógica pura compartida (`packages/core` si existe el monorepo).
- **Componentes**: `@testing-library/react-native`.
- **E2E**: Maestro (más simple de mantener que Detox para un equipo chico) corriendo los flujos críticos: login → ver lead → cambiar estado; login → marcar visita realizada.
- **QA manual estructurado**: antes de cada release, checklist manual en un dispositivo Android real y uno iOS real (los simuladores no capturan todo — GPS, cámara, push reales).
- **Beta testing**: TestFlight (iOS) + Google Play Internal Testing (Android) con agentes reales antes de release pública, mínimo 1-2 semanas de uso real.

---

## 6. Despliegue

### 6.1 Build y distribución
- **EAS Build** (Expo Application Services) para compilar iOS/Android sin necesitar Mac propia para el build de iOS.
- **EAS Update** (OTA — over-the-air) para pushear fixes de JS sin pasar por review de las stores, para lo que no toca código nativo. Cuidado: no abusar de esto para evitar el proceso de review de las stores en cambios grandes — es para hotfixes, no para saltarse el control de calidad de Apple/Google.

### 6.2 Cuentas necesarias (esto es plata y tiempo, no sólo código)
- **Apple Developer Program**: USD 99/año, la cuenta debe estar a nombre de la empresa/razón social de Zeta Prop (no de una persona) si se quiere publicar como "Zeta Prop" y no como nombre personal. El alta de cuenta de organización en Apple puede tardar días (piden D-U-N-S number).
- **Google Play Console**: USD 25 pago único.
- Ambas cuentas necesitan: política de privacidad publicada (URL pública), ícono, capturas de pantalla, descripción, clasificación de contenido, declaración de uso de datos (Apple "Privacy Nutrition Label" / Google "Data Safety").

### 6.3 CI/CD
- GitHub Actions (o el CI que ya use el equipo) disparando EAS Build en cada merge a `main` de `apps/mobile`, con un paso de `tsc --noEmit` + tests antes de buildear — mismo patrón de verificación que ya se usa en este proyecto para el web (`tsc` limpio + `build` limpio antes de cada push).
- Separar builds de `development` / `staging` / `production` con distintos `app.json`/`eas.json` profiles apuntando potencialmente a distinto proyecto de Firebase para staging (evita que QA en staging escriba leads de prueba en la base de producción real).

### 6.4 Versionado y compatibilidad con el backend
Punto que se pasa por alto seguido: **la app en el celular de un agente puede quedar desactualizada semanas** (a diferencia de la web, que siempre sirve la última versión). Si se cambia una regla de Firestore o la forma de un documento, una versión vieja de la app puede romperse en producción sin que nadie lo note enseguida.
- Definir una política de versión mínima soportada.
- Un flag remoto (Firestore doc de config, ya existe el patrón con `configService.ts`) que la app chequea al abrir: `{minVersion, latestVersion, forceUpdateMessage}` — si la versión instalada es menor a `minVersion`, mostrar pantalla de "actualizá la app" bloqueante.
- Cambios a `firestore.rules` o a la forma de un modelo (`Property`, `Lead`, etc.) deben ser **aditivos y retrocompatibles** mientras haya versiones viejas de la app en uso real — no se puede asumir "todos actualizaron" como sí se puede asumir en la web.

---

## 7. Mantenimiento (lo que sigue después del lanzamiento)

- **Monitoreo de errores**: Sentry (o Firebase Crashlytics) desde el día 1 del beta — sin esto, un crash en el celular de un agente en la calle es invisible hasta que se queja.
- **Analytics de producto**: Firebase Analytics para entender qué pantallas se usan y cuáles no — evita seguir invirtiendo en features que nadie abre.
- **Ciclo de releases**: cadencia fija (ej. cada 2 semanas) en vez de releases ad-hoc, para que el review de Apple/Google (1-3 días típico, a veces más) no sea una sorpresa cada vez.
- **Soporte a usuarios**: canal claro para que un agente reporte "se me colgó" — hoy no hay uno mobile-específico, definir si es WhatsApp al soporte, un botón "Reportar problema" in-app, etc.
- **Costos recurrentes a monitorear**: cuota de Firebase (Firestore reads/writes, Storage, FCM es gratis) va a subir con más dispositivos activos escribiendo — vigilar la consola de Firebase, sobre todo si algún día se agrega sync en background o polling agresivo.
- **Rotación de certificados**: certificados de Apple (Push, Distribution) expiran y hay que renovarlos — EAS lo gestiona bastante bien pero no es "configurar una vez y olvidarse para siempre".
- **Compatibilidad con OS nuevos**: cada año Apple/Google sacan versión nueva de iOS/Android con APIs deprecadas o permisos que cambian de comportamiento — presupuestar tiempo de mantenimiento aunque no se agregue ni una feature nueva.

---

## 8. Cosas que probablemente no se estén viendo todavía

- **Seguridad de Firestore rules para mobile**: las reglas actuales (`firestore.rules`, patrón `isOwner()`/`isAdmin()`) ya cubren esto porque la autorización vive en el backend (Firestore), no en el cliente — un cliente mobile "hostil" no puede hacer más de lo que las reglas permiten. Buena noticia: no hay que rediseñar seguridad, sólo confirmar que ningún permiso quedó pensado "porque el botón no aparece en la UI web" en vez de estar realmente bloqueado en las reglas (si existe ese caso, es una vulnerabilidad hoy mismo, independiente de la app mobile).
- **Rate limiting**: el bug que acabamos de arreglar en `src/proxy.ts` (429 global por IP compartida) es específico del proxy de Next.js — no aplica a llamadas directas de la app mobile a Firestore/Auth (esas pasan por los límites propios de Firebase, no por el proxy). Sí aplica si la app mobile llama a las API routes de `src/app/api/**` — mismo código, mismo comportamiento ya corregido.
- **Permisos del sistema operativo**: cámara, ubicación, notificaciones — cada uno necesita texto de justificación (`NSCameraUsageDescription`, etc. en iOS) y un flujo de manejo cuando el usuario los rechaza. Diseñar la pantalla de "no diste permiso de cámara, así es como lo activás" desde el MVP, no como afterthought.
- **Multi-tenancy / `organizationId` y `branchId`**: la app tiene que respetar el mismo scoping por inmobiliaria/sucursal que ya existe en el modelo `User` — un agente de la Inmobiliaria A nunca debería poder ver datos de la Inmobiliaria B, ni por bug de UI ni por regla de Firestore mal escrita.
- **Gating por plan de suscripción**: si algún día se decide que la app mobile es un feature de planes pagos superiores (`subscriptionService.ts` ya maneja tiers), hay que decidirlo *antes* de que los agentes se acostumbren a tenerla gratis.
- **Internacionalización de fecha/moneda**: si en algún momento se piensa en otros países además de Argentina, hoy hay pesos/UVA hardcodeados en varios lados (el blog recién publicado, por ejemplo) — no es bloqueante para el MVP pero conviene no hardcodear "ARS"/"$" en componentes nuevos de mobile si se puede evitar fácil.
- **Legal**: política de privacidad y términos de uso actualizados para reflejar qué datos junta la app (ubicación, fotos, notificaciones push) — Apple y Google rechazan apps sin esto bien declarado, y en Argentina aplica la Ley 25.326 de Protección de Datos Personales.
- **Deep linking**: si en el futuro se quiere que un link de WhatsApp/email abra directo el detalle de un lead dentro de la app (en vez de la web), hay que planear los deep links (`zetaprop://lead/123`) desde la arquitectura de navegación, no agregarlos después.
- **Localización del ícono/nombre en las stores**: nombre de la app en las stores no puede chocar con otra app existente ("Zeta Prop" — vale la pena chequear disponibilidad en App Store/Play Store antes de invertir en diseño de ícono).
- **Handoff de datos entre web y mobile en tiempo real**: si un agente edita un lead en la web mientras otro lo edita en mobile, ¿qué gana? Firestore no resuelve conflictos de negocio por vos — definir reglas simples (ej. "last write wins" está bien para este caso, no hace falta un sistema de merge sofisticado) pero definirlo a propósito, no por default accidental.

---

## 9. Estimación de tiempo (orientativa, no compromiso)

| Fase | Duración estimada |
|---|---|
| Análisis + diseño (Figma) | 1-2 semanas |
| Spike técnico + setup | 3-5 días |
| Desarrollo MVP (secciones 2-7 de 4.4) | 6-8 semanas |
| Beta cerrada + fixes | 2-3 semanas |
| Alta de cuentas de developer (paralelo, puede arrancar día 1) | 1-2 semanas (Apple puede demorar) |
| Review de stores + release | 1 semana |
| **Total hasta v1.0 pública** | **~3-4 meses**, con una persona full-time; menos si se paraleliza diseño/dev |

---

## 10. Próximo paso concreto

No arrancar por el MVP completo. Arrancar por el **spike técnico de la sección 2.3** (1-2 días): confirmar que Firebase Auth + Firestore (`propia` DB) funcionan limpio desde un proyecto Expo en blanco. Ese resultado determina si el resto de este plan se ejecuta tal cual o si hace falta una capa de API intermedia — mejor saberlo en día 2 que en semana 6.

### 10.1 Estado del spike (2026-09-10)

Ya arrancado. Proyecto Expo creado en `../zetaprop-mobile` (sibling de este repo, todavía no monorepo — ver 2.1) con:
- Expo Router + TypeScript, Firebase (`firebase` v12 + `@firebase/auth`), AsyncStorage.
- `lib/firebase.ts`: mismo proyecto Firebase y misma base Firestore nombrada `"propia"` que la web, con inicialización defensiva ante Fast Refresh (mismo patrón que ya usa `src/infrastructure/firebase/client.ts`).
- `lib/auth-context.tsx`: contexto de auth que resuelve el doc de `users/{uid}` igual que la web.
- Pantallas: `login.tsx` y `home.tsx` (esta última prueba una lectura real de Firestore contra `properties`, filtrada por `userId`).

**Hallazgo real durante el spike** (justo el riesgo que la sección 2.3 pedía validar): la función `getReactNativePersistence` no se puede importar desde `firebase/auth` como indica la documentación estándar — el paquete `firebase` (el "paraguas") no declara la condición de exports `"react-native"` para su subpath `"./auth"`, así que tanto Metro como `tsc` caen al build de browser y la función viene `undefined`. Se resolvió importándola directo desde `@firebase/auth` (que sí declara esa condición) y agregando `customConditions: ["react-native"]` en `tsconfig.json` — detalle completo comentado en `lib/firebase.ts`.

Verificado hasta ahora (vía preview web en el navegador, con `tsc --noEmit` limpio):
- La app compila y bootea sin errores (Expo Router, contexto de auth, inicialización de Firebase).
- La pantalla de login renderiza correctamente.

**Todavía no verificado** (requiere probarlo con una cuenta real, algo que no puedo hacer yo mismo porque nunca debo tipear una contraseña, ni siquiera de prueba, en ningún formulario): el login real contra Firebase Auth y la lectura efectiva de la colección `properties` en la base `"propia"`. Para cerrar el spike del todo, correlo vos:

```bash
cd zetaprop-mobile
npm run web
```

y logueate con tu cuenta de Zeta Prop. Si ves "Spike técnico OK" con tu rol y la cantidad de propiedades, el spike está 100% validado y se puede seguir con el MVP (sección 4.4) sin sorpresas grandes. Para probarlo en un celular real (más representativo que el preview web) hace falta instalar la app **Expo Go** y correr `npx expo start` desde una terminal propia (no desde este entorno) para escanear el QR.

### 10.2 Login con Google agregado

La web loguea con Google vía `signInWithPopup` (`src/infrastructure/auth/firebaseAuthService.ts`), una API que no existe en apps nativas. En mobile se resuelve distinto: se abre la pantalla de Google en el navegador del sistema (`expo-auth-session`), Google devuelve un `id_token`, y ese token se le pasa a Firebase Auth (`GoogleAuthProvider.credential` + `signInWithCredential`) para conseguir la misma sesión que tendrías en la web. Ya está implementado en `lib/googleAuth.ts` + botón "Continuar con Google" en `login.tsx`.

Diferencia deliberada respecto a la web: la web autoregistra usuarios nuevos en el primer login con Google (`saveUserToFirestore`). Esta app **no** lo hace — si tu cuenta de Google no tiene ya un documento en `users/{uid}` (o sea, si no fuiste dado de alta desde el panel web), la app te cierra la sesión y muestra "Tu cuenta todavía no está habilitada en Zeta Prop", en vez de crear un perfil vacío sin rol. Tiene sentido para una app pensada para agentes que ya existen en el CRM, no para que cualquiera se autoregistre desde el celular.

**Dos cosas pendientes para que funcione de punta a punta, ambas tuyas (no las puedo hacer yo):**

1. **Conseguir el "Web client ID"** (no es secreto, es un identificador público) y pegarlo en `zetaprop-mobile/.env`:
   Firebase Console → tu proyecto → Authentication → Sign-in method → Google → "Configuración del SDK web" → Web client ID → pegalo en `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` dentro de `.env` (ver `.env.example`).
   *(Ya lo pegué — me pasaste el Web client ID y quedó cargado en `.env`.)*
2. **Probarlo desde un dev build, no desde Expo Go.** Expo Go usa una URL de redirección que cambia según la IP local de tu máquina, y Google no permite registrar redirecciones "que cambian" — necesita una URL fija. El esquema `zetaprop://` que ya está configurado en `app.json` sí es fijo, pero sólo existe una vez que corrés un build de desarrollo real (`npx expo run:android` / `npx expo run:ios`, o un dev build con EAS — sección 6 del plan). Con el email/contraseña de respaldo que dejé en la pantalla de login sí podés probar el resto del flujo (Firestore, roles, etc.) mientras tanto, si alguna vez creás un usuario de prueba con contraseña desde el panel de administración.

### 10.3 Onboarding + login rediseñados con el logo real

Se agregó una pantalla de bienvenida (`app/welcome.tsx`) con el logo de Zeta Prop (tomado de `public/assets/img/Logo ZetaProp sin FONDO.png` de este mismo repo) y tagline, más un rediseño de `login.tsx` con badge de Google, tarjeta oscura y flujo de email/contraseña colapsado — estilo similar a la referencia que compartiste (onboarding con icono grande + botón "Comenzar", pantalla de login centrada en el proveedor social). Verificado visualmente en el preview web en tamaño de iPhone.

### 10.4 Error `redirect_uri_mismatch` al probar Google desde `npm run web`

Al probar el botón de Google apareció "Access blocked: This app's request is invalid — Error 400: redirect_uri_mismatch". Es esperable la primera vez: Google exige que la URL a la que vuelve después del login esté pre-autorizada en la consola, y todavía no le habíamos dicho cuál es.

Confirmé el valor exacto corriendo la app: en `npm run web` (puerto por defecto de Expo, 8081) la URL de retorno es `http://localhost:8081` — sin barra al final, sin ruta.

**Paso único para destrabarlo:**
1. [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials) del proyecto `prop-ia`.
2. Abrí el cliente OAuth "Web client" (el mismo Web client ID que ya me pasaste: `815439555210-20sb2b5dlta82ujg4hspi921bn1jap6p...`).
3. En "URI de redireccionamiento autorizados", agregá exactamente: `http://localhost:8081`
4. Guardar. El cambio en Google es instantáneo, no hace falta esperar.

Si alguna vez el puerto cambia (Expo lo corre en otro si el 8081 está ocupado, se ve en la URL que abre el navegador), hay que agregar ese puerto también — Google exige coincidencia exacta.

Esto sólo resuelve las pruebas por navegador (`npm run web`). Para un dev build nativo (iOS/Android) hay que agregar además la redirección con el esquema `zetaprop://` como URI autorizada — eso lo dejamos para cuando lleguemos a esa etapa (sección 6 del plan).

En consola aparecen warnings de "Cross-Origin-Opener-Policy would block the window.closed call" al hacer login — es ruido inofensivo: el navegador bloquea que la librería chequee entre orígenes distintos si el popup de Google se cerró solo, pero `expo-web-browser` tiene un fallback por `postMessage` que igual detecta el cierre. No afecta el resultado.

**Bug real encontrado y corregido:** Google dejaba loguearse (la pantalla de Google se cerraba bien), pero la app se quedaba parada en `/login` sin pasar a `/home`. Causa: `lib/googleAuth.ts` usaba `Google.useAuthRequest`, que en navegador pide por defecto un `access_token` (flujo implícito), no un `id_token` — y Firebase (`GoogleAuthProvider.credential`) necesita específicamente el `id_token`. Se resolvió cambiando a `Google.useIdTokenAuthRequest`, el hook que expo-auth-session provee justo para este caso (fuerza `response_type=id_token` en web; en nativo sigue el flujo de code-exchange y también termina completando el `id_token`).

### 10.5 Spike técnico: VALIDADO ✅ (2026-09-10)

Confirmado por el usuario, logueado con su cuenta real (`facundoflores8@gmail.com`) vía Google: pantalla "Spike técnico OK" mostrando el email autenticado, el `roleId` resuelto desde `users/{uid}` en la base `"propia"`, y una lectura exitosa de la colección `properties` (0 resultados porque esa cuenta es la de admin/owner, no tiene propiedades propias asociadas por `userId` — esperable, no es un bug).

Con esto, el riesgo técnico central del plan (sección 2.3) queda cerrado: Firebase Auth + Firestore nombrada `"propia"` + Google Sign-In funcionan de punta a punta desde Expo/React Native. Queda habilitado seguir directo con el desarrollo del MVP (sección 4.4): Auth+permisos (ya hecho) → Leads → Propiedades → Calendario/Visitas → Alquileres → Push.

### 10.6 Sistema de diseño mobile (auditoría con Hallmark)

Antes de seguir con más pantallas, se auditaron `welcome.tsx`/`login.tsx`/`home.tsx` (las únicas 3 existentes) contra la disciplina de diseño del skill Hallmark, adaptada a React Native (acá no hay CSS ni "macroestructuras" de página web — lo que sí se traslada: tokens únicos, cero valores sueltos, estados completos en cada interacción, escala de espaciado consistente).

**Hallazgos reales corregidos:**
- Colores repetidos a mano en cada archivo, con inconsistencias sin razón (fondo de tarjeta `#14141C` en login vs `#17171F` en home).
- **Ningún botón daba feedback visual al tocarlo** — el hueco de UX más importante de los tres.
- Botón de "volver" de 40×40, por debajo del mínimo táctil recomendado (44×44).
- Radios y espaciados sueltos sin escala (8, 10, 12, 14, 16, 20, 24, 32...).

**Se creó:**
- [`zetaprop-mobile/constants/theme.ts`](../zetaprop-mobile/constants/theme.ts) — únicos tokens de color/espaciado/radio/tipografía/motion de la app.
- [`zetaprop-mobile/components/ui/Button.tsx`](../zetaprop-mobile/components/ui/Button.tsx) y [`Card.tsx`](../zetaprop-mobile/components/ui/Card.tsx) — componentes compartidos con estados completos (normal/presionado/deshabilitado/cargando), para que Leads/Propiedades/Calendario/Alquileres los reutilicen en vez de reinventar estilos.
- [`zetaprop-mobile/DESIGN.md`](../zetaprop-mobile/DESIGN.md) — las reglas completas para toda pantalla nueva, con el porqué de cada una.

Verificado sin regresiones visuales en preview (375px de ancho incluido) y `tsc` limpio.

### 10.7 Módulo de Leads (2026-09-11)

Primer módulo real del MVP, construido sobre la base de componentes de la sección 10.6.

- [`domain/Lead.ts`](../zetaprop-mobile/domain/Lead.ts) — copia a mano de `src/domain/models/Lead.ts` (mismo patrón que el resto del proyecto: sin monorepo todavía, se sincroniza manualmente).
- [`lib/leadsService.ts`](../zetaprop-mobile/lib/leadsService.ts) — misma colección `leads` y mismo scoping por `userId` que ya autorizan las `firestore.rules` actuales. Ojo: el orden de la lista se hace en el cliente (JS `.sort()`), no con `orderBy` de Firestore — una consulta con `where("userId","==",...)` + `orderBy("updatedAt")` necesita un índice compuesto que no existe hoy en el proyecto, y para la cantidad de leads por agente no vale la pena gestionar un índice todavía.
- [`constants/leadPipeline.ts`](../zetaprop-mobile/constants/leadPipeline.ts) — mismas 7 etapas y mismo orden que el Kanban de la web (`Nuevo → Contactado → Seguimiento → Visita programada → Negociación → Cerrado → Perdido`), para que un agente vea el mismo modelo mental en ambos lados.
- [`app/leads/index.tsx`](../zetaprop-mobile/app/leads/index.tsx) — lista con chips de filtro por estado, pull-to-refresh, estados de carga/error/vacío.
- [`app/leads/[id].tsx`](../zetaprop-mobile/app/leads/[id].tsx) — detalle con datos de contacto, botones de Llamar/WhatsApp con un tap, selector de estado (actualiza Firestore con UI optimista), y notas (listar + agregar).
- Se agregó un botón "Ver Leads" en `home.tsx` como entrada temporal — todavía no hay un dashboard real ni una barra de navegación por tabs (queda para cuando haya 2-3 módulos más, no tiene sentido armar navegación todavía con un solo módulo).

**Verificado:** `tsc` limpio, la app bootea sin errores, y navegar directo a `/leads` sin sesión redirige correctamente a `/login` (probado en el preview web). **No verificado por mí:** la lista/detalle con datos reales — no puedo loguearme (ni con Google ni escribiendo una contraseña) para probarlo de punta a punta. Probalo vos con una cuenta de agente que tenga leads reales; si el owner/admin la prueba, va a ver "No tenés leads todavía" porque esa cuenta no tiene leads bajo su propio `userId` (mismo caso que las 0 propiedades del spike original).

### 10.8 Menú de navegación (tabs) + módulo de Propiedades (2026-09-11)

El usuario compartió una referencia visual (dashboard con tarjetas de stats + barra de menú abajo) y pidió aplicar esa estructura y sumar el menú. Se adoptó la **estructura** (barra de tabs abajo, tarjetas de números en el dashboard) manteniendo el tema oscuro violeta ya establecido — no se cambió a modo claro. Si en realidad se quería el modo claro de la referencia, avisar para ajustarlo.

**Reestructuración de navegación:**
- `app/(tabs)/_layout.tsx` — barra de menú real con 4 tabs: **Inicio, Leads, Propiedades, Cuenta** (íconos de Ionicons, activo en violeta).
- El dashboard viejo (`app/home.tsx`, pantalla de spike) se eliminó — reemplazado por `app/(tabs)/dashboard.tsx`, con tarjetas de stats reales (leads nuevos/totales, propiedades activas/totales) calculadas de Firestore. **A propósito no tiene barras de progreso ni porcentajes** como la referencia — esos datos en la imagen de referencia no tienen una base real detrás, e inventar un "30%" sin que signifique nada es exactamente el tipo de dato falso que veníamos evitando (ver `DESIGN.md`).
- `app/leads/index.tsx` se movió a `app/(tabs)/leads.tsx` (ahora es la raíz del tab, sin botón de volver). El detalle (`app/leads/[id].tsx`) sigue siendo una pantalla completa fuera de los tabs, como corresponde al patrón estándar "lista en tab → detalle a pantalla completa".
- Login y el gate inicial (`app/index.tsx`) ahora redirigen a `/dashboard` en vez de `/home`.

**Módulo de Propiedades (nuevo):**
- [`domain/Property.ts`](../zetaprop-mobile/domain/Property.ts) — copia a mano de `src/domain/models/Property.ts`, sólo los campos que la app mobile necesita.
- [`lib/propertiesService.ts`](../zetaprop-mobile/lib/propertiesService.ts) y [`lib/propertyPrice.ts`](../zetaprop-mobile/lib/propertyPrice.ts) — mismo criterio que Leads: colección `properties` scoped por `userId`, y el mismo fallback "Consultar Precio" que ya se corrigió en la web.
- `app/(tabs)/propiedades.tsx` — lista con miniatura, filtros por estado (Activas/Reservadas/Vendidas/Inactivas).
- `app/propiedades/[id].tsx` — detalle con imagen, datos, y selector de estado (actualiza Firestore con UI optimista, igual que el cambio de estado de Leads).

**Verificado:** `tsc` limpio; navegar sin sesión a `/dashboard` y a `/propiedades` redirige bien a `/login` sin errores en consola (preview web). **No verificado por mí:** la barra de tabs con sesión iniciada, y las listas/detalle de Propiedades con datos reales — mismo motivo de siempre (no puedo loguearme). Probalo vos y contame qué tal se ve la barra de menú abajo.

### 10.9 Módulo de Calendario/Visitas + hallazgo de seguridad (2026-09-11)

**Hallazgo importante, no relacionado con mobile en sí:** al portar `visitasService.ts`, `firestore.rules` (este repo) **no tenía ninguna regla para la colección `visitas`** — cae en el "default deny" del final del archivo. La página de Calendario de la propia web (`src/app/(main)/dashboard/calendario/page.tsx`) también consulta esa colección directo desde el cliente, así que tal como estaba el archivo, esa pantalla debería estar bloqueada por las reglas hoy. Se agregó el bloque `match /visitas/{visitaId}` (mismo patrón `isOwner`/`isAdmin` que `leads`/`tickets`) — **pero como siempre con este archivo, hace falta correr `firebase deploy --only firestore:rules` para que el cambio tenga efecto real.** Si el Calendario de la web ya funciona hoy en producción, probablemente signifique que las reglas desplegadas en Firebase ya tienen esa excepción a mano (agregada directo en la consola, no reflejada en este repo) — vale la pena confirmarlo.

**Construido:**
- [`domain/Visita.ts`](../zetaprop-mobile/domain/Visita.ts) — copia de `src/domain/models/Visita.ts`.
- [`lib/visitasService.ts`](../zetaprop-mobile/lib/visitasService.ts) — mismo criterio de siempre (un solo filtro de igualdad, orden en el cliente, sin depender de índices compuestos).
- Quinto tab agregado: **Calendario**, con selector de día (14 días hacia adelante) + agenda del día seleccionado.
- `app/visitas/[id].tsx` — detalle con Llamar/WhatsApp, selector de estado (6 estados: programada/confirmada/en curso/completada/cancelada/no asistió), y "Marcar como realizada" con nota opcional.
- Dashboard: se agregó la tarjeta "Visitas hoy".

**Verificado:** `tsc` limpio; `/calendario` y `/visitas/:id` sin sesión redirigen bien a `/login`, sin errores en consola. **No verificado:** la agenda con visitas reales (mismo motivo de siempre — no puedo loguearme), y **la regla de Firestore no se probó de punta a punta** porque no está desplegada todavía.

### 10.10 Módulo de Alquileres — MVP completo (2026-09-11)

Último módulo del alcance definido en la sección 1.3. Con esto los 5 módulos del MVP (Auth, Leads, Propiedades, Calendario/Visitas, Alquileres) están construidos.

**Mismo hallazgo de seguridad que con `visitas`, pero más delicado:** `alquileres` tampoco tenía regla en `firestore.rules`. A diferencia de Leads/Visitas, esta colección tiene una segunda vía de acceso: el portal de inquilinos (`src/app/(tenant)/inquilino/page.tsx`) busca un contrato por `codigoAlquiler` **sin que el visitante esté logueado**. Como esa colección guarda DNI y datos bancarios (garante, seguro de caución, CBU) tanto del inquilino como del propietario, no improvisé una regla permisiva para esa ruta — sólo agregué el bloque `isOwner`/`isAdmin` que la app mobile necesita (agente viendo sus propios contratos) y dejé un comentario explícito en el archivo marcando que el acceso del portal de inquilinos necesita su propio análisis a propósito (probablemente mover esa búsqueda detrás de una API route con Admin SDK, no dejarla como una regla de Firestore abierta). **Igual que con Visitas, hace falta `firebase deploy --only firestore:rules`** para que el agente pueda ver sus contratos desde el celular.

**Construido:**
- [`domain/Alquiler.ts`](../zetaprop-mobile/domain/Alquiler.ts) — subconjunto de `src/domain/models/Alquiler.ts` (datos de contrato + `historialPagos`, sin garante/seguro de caución/datos bancarios — la app mobile no los necesita para esta primera versión).
- [`lib/alquileresService.ts`](../zetaprop-mobile/lib/alquileresService.ts) + [`lib/alquilerPayment.ts`](../zetaprop-mobile/lib/alquilerPayment.ts) — mismo criterio de siempre (un filtro de igualdad, orden en el cliente). `registrarPagoDelMes` es una versión simplificada del `registrarPago` de la web: marca el mes actual como pagado por el monto mensual completo, sin desglose ni pagos parciales — eso es workflow de oficina, no la acción rápida de campo que pide el plan ("marcar pago registrado").
- Sexto tab agregado: **Alquileres**, con filtro por estado y badge de estado de pago del mes actual (calculado, no un campo que se actualice solo — ver `estadoPagoActual`).
- `app/alquileres/[id].tsx` — detalle con Llamar/WhatsApp al inquilino, estado del pago del mes con días para vencimiento, botón "Marcar pago registrado", e historial de los últimos 6 pagos.
- Dashboard: se reemplazaron los totales menos accionables (leads/propiedades totales) por **"Contratos activos"** y **"Pagos vencidos"** — más alineado con lo que un agente necesita ver de un vistazo al abrir la app.

**Nota de UX pendiente de validar en dispositivo real:** con 6 tabs (Inicio/Leads/Propiedades/Calendario/Alquileres/Cuenta) la barra de menú puede sentirse apretada en un celular angosto (iPhone SE). Si al probarlo se siente muy compacto, la solución más simple es sacar "Cuenta" de la barra y ponerlo como ícono en el header del dashboard.

**Verificado:** `tsc` limpio; `/alquileres` y `/alquileres/:id` sin sesión redirigen bien a `/login`, sin errores en consola. **No verificado:** la lista/detalle con contratos reales, ni cómo se ve la barra de 6 tabs en un celular angosto — avisame qué tal se ve.

### 10.11 Bug de imágenes + gestión real de Propiedades (2026-09-11)

El usuario reportó que las fotos de las propiedades no se veían, y pidió poder gestionarlas de verdad (no sólo mirarlas).

**Causa del bug de imágenes:** el modelo se portó copiando `images: PropertyImage[]` de `src/domain/models/Property.ts` — pero ese campo está muerto en la práctica. Los 23 archivos de la web que efectivamente leen/escriben fotos de una propiedad (`PropertyCard.tsx`, `PropertiesTable.tsx`, `PropertyWizard.tsx`, plantillas de impresión, páginas públicas, feed XML...) usan todos `imageUrls: string[]` — un array plano de URLs, donde el índice 0 es la portada. Se corrigió `domain/Property.ts` para usar el campo real.

**Gestión agregada** (antes sólo se podía cambiar el estado):
- **Fotos**: en el detalle de la propiedad ahora hay una galería horizontal de todas las fotos, con botones de **Cámara** y **Galería** para agregar (usa `expo-image-picker`, sube a Firebase Storage en la misma ruta que ya usa la web — `properties/{uid}/{propertyId}/{archivo}-{timestamp}`, así no hace falta tocar reglas de Storage), botón para marcar una foto como portada, y para eliminarla.
- **Editar datos**: nueva pantalla `/propiedades/[id]/editar` con los campos que un agente realmente edita en el campo — título, precio/moneda, dirección, ciudad, ambientes, baños, superficie, descripción. **No** es el wizard completo de ~80 campos que tiene la web para crear una propiedad desde cero — eso queda fuera de alcance por ahora; esta pantalla es para corregir/actualizar una propiedad que ya existe.
- Se extrajo [`components/properties/PropertyListItem.tsx`](../zetaprop-mobile/components/properties/PropertyListItem.tsx) (antes el JSX de la fila estaba repetido inline) con dos variantes: `row` (lista completa del tab Propiedades) y `featured` (tarjeta tipo marketplace, imagen arriba y precio grande).

**Pedido adicional resuelto en la misma pasada:** el usuario pidió que el Home muestre un listado de propiedades estilo Mercado Libre (imagen + precio primero) con las últimas 5 y un botón para ir al listado completo. Se agregó esa sección al dashboard, reutilizando `PropertyListItem` en su variante `featured`.

**Sobre el footer que preguntó si faltaba:** ya existe — es la barra de tabs de abajo (sección 10.8), visible en Inicio/Leads/Propiedades/Calendario/Alquileres/Cuenta. En apps móviles esa barra cumple el rol que un footer cumple en una página web (navegación persistente); no hace falta un elemento aparte.

**Verificado:** `tsc` limpio; `/propiedades/[id]` y la nueva `/propiedades/[id]/editar` (rutas anidadas) sin sesión redirigen bien a `/login`, sin errores en consola. **No verificado:** la subida de fotos de punta a punta (necesita cámara/galería real de un dispositivo, no algo que el preview web pueda probar) ni cómo se ve la galería/edición con datos reales.

### 10.12 UX del detalle de Propiedad, inspirado en una referencia (2026-09-11)

El usuario compartió una segunda referencia visual (app "HomeLuxe", tema claro) preguntando si podíamos vernos así. Como ya habíamos elegido mantener el tema oscuro (sección 10.8), se le preguntó explícitamente si prefería cambiar toda la app a claro o quedarse con el oscuro y tomar sólo las mejoras de UX — **eligió mantener el oscuro**. Se tomaron 4 ideas concretas de la referencia, adaptadas a nuestra paleta:

1. **Carrusel de fotos con contador** (antes: galería estática sin indicador) — la fila de fotos ahora hace snap foto por foto y muestra "2/8" arriba a la derecha, igual que el "1/24" de la referencia.
2. **Datos con iconos en vez de texto** — [`components/properties/FactPill.tsx`](../zetaprop-mobile/components/properties/FactPill.tsx) (nuevo) muestra ambientes/baños/superficie con ícono + valor (cama, ducha, regla) en una fila, como "4 Beds · 5 Baths · 3,250 sqft" de la referencia, usando `MaterialCommunityIcons` (ya viene con `@expo/vector-icons`, no hubo que instalar nada nuevo). La dirección también sumó un ícono de pin.
3. **Descripción expandible** — "Leer más / Leer menos" con chevron, igual al "Read more ⌄" de la referencia.
4. **Agendar visita desde la propiedad** — la referencia tiene "Book a Visit" integrado en el detalle. Se construyó de verdad, no sólo visualmente: `visitasService.createVisita()` (nuevo) + pantalla `/propiedades/[id]/agendar-visita` (nombre de cliente, teléfono opcional, selector de día de los próximos 14 y franjas horarias predefinidas, nota opcional) que crea una Visita real vinculada a esa propiedad — aparece en el tab de Calendario como cualquier otra.

Lo que **no** se tomó de la referencia a propósito: el corazón de favoritos, "Popular Locations" y las categorías Buy/Rent/Short Stay/Agents del header — son patrones de una app de *descubrimiento* para compradores navegando propiedades ajenas; esta app es para que un agente gestione su *propia* cartera, no tiene sentido "marcar como favorita" la propiedad de uno mismo.

Se extrajo [`components/properties/PropertyListItem.tsx`](../zetaprop-mobile/components/properties/PropertyListItem.tsx) ya en la pasada anterior; en esta se sumó `FactPill` al mismo directorio, empezando a formar una carpeta de componentes específicos del dominio Propiedades (separada de `components/ui/`, que son genéricos de toda la app).

**Verificado:** `tsc` limpio; la nueva ruta anidada `/propiedades/[id]/agendar-visita` sin sesión redirige bien a `/login`, sin errores en consola. **No verificado:** cómo se ve/siente el carrusel con swipe real, ni el flujo de agendar visita de punta a punta — necesita sesión real para probarlo.

**Pendiente, no hecho a propósito:** el ícono de la app en el celular (home screen) sigue siendo el genérico de Expo. El logo de Zeta Prop que tenemos es un isologotipo horizontal (ancho), no una marca cuadrada — forzarlo en el ícono cuadrado de la app hoy quedaría estirado o mal recortado. Para un ícono prolijo hace falta una versión cuadrada del isotipo (por ejemplo, sólo el bloque negro con la "Z", sin el texto "Prop") — si tenés esa versión o alguien de diseño puede exportarla, la aplico enseguida.
