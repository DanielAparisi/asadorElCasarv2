# Asador El Casar

Panel de administración para el Asador El Casar. React + Vite en el cliente y
Supabase como backend (base de datos y autenticación).

## Requisitos

- Node.js 20 o superior
- Una cuenta de Supabase con acceso al proyecto `asadorElCasar`

## Puesta en marcha

```bash
npm install
npm run dev
```

La app queda en http://localhost:5173

Antes de arrancar necesitas un archivo `.env` en la raíz con las claves del
proyecto de Supabase (Project Settings → API Keys):

```
VITE_SUPABASE_URL=https://<tu-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<clave publishable>
```

El `.env` está en `.gitignore` y no debe commitearse. Usa siempre la clave
*publishable*: la secreta no puede aparecer en código que llega al navegador.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm run preview` | Sirve el build de producción en local |
| `npm run lint` | Pasa ESLint sobre el proyecto |

## Rutas

| Ruta | Quién entra |
|---|---|
| `/` | Público |
| `/login` | Público; si ya hay sesión redirige según el rol |
| `/admins` | Solo administradores |

## Estructura

```
src/
├── components/   Componentes reutilizables (formulario de login)
├── pages/        Una por ruta
├── hooks/        Toda la comunicación con Supabase
└── lib/          Cliente de Supabase
supabase/
└── migrations/   Cambios del esquema, en SQL
```

Los componentes no llaman a Supabase directamente: todo pasa por los hooks.

- `useSession` — sesión activa y cambios de login/logout
- `useAuth` — registro, inicio y cierre de sesión
- `useAdmins` — lectura de la tabla `Admins`
- `useEsAdmin` — si el usuario actual es administrador

## Base de datos

La tabla `Admins` tiene Row Level Security activado: solo devuelve filas a un
usuario que ya sea administrador. **Esa política es la que protege los datos**,
no las guardas de las rutas — el código del navegador se puede saltar, la
política no.

Al registrarse un usuario, un trigger le crea su fila en `Admins`
automáticamente.

### Cambios en el esquema

Nunca toques el esquema solo desde el dashboard: genera la migración y
commitéala junto al código.

```bash
npx supabase db query --linked "<tu SQL>"   # aplicar
npx supabase db pull <nombre> --linked      # generar la migración
npx supabase db advisors --linked           # revisar seguridad y rendimiento
```

Los archivos de `supabase/migrations/` llevan un prefijo de fecha que marca el
orden de aplicación. No los renombres.

## Pendiente

- Ahora mismo **cualquiera que se registre se convierte en administrador**.
  Antes de publicar hay que cerrar los registros públicos o filtrar quién
  obtiene privilegios.
- Al desplegar, configura el *SPA fallback* en el servidor para que las rutas
  directas (`/admins`) no devuelvan 404.
