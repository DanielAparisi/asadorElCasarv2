# Seguridad del panel

## Lo primero, porque cambia todo lo demás

**El guard de `/admins` en React no es seguridad.** Es comodidad.

El código de `App.tsx` que redirige a quien no es admin se ejecuta **en el
navegador del atacante**, que controla ese navegador por completo. Se salta con
las DevTools en treinta segundos, y ni siquiera hace falta: basta con ignorar la
interfaz y llamar directamente a la API de Supabase con `fetch`.

Por eso la pregunta correcta no es *"¿puede alguien entrar en la ruta
/admins?"* — sí puede, y no importa. La pregunta es **"¿puede alguien leer o
escribir datos que no le corresponden?"**. Y esa frontera está en un solo sitio:
las políticas de RLS de Postgres, que se ejecutan en un servidor que el atacante
no controla.

Un atacante que fuerce la ruta `/admins` verá una página vacía con un error de
permisos. Eso es exactamente lo que tiene que pasar.

**Consecuencia práctica:** el esfuerzo va a las políticas de RLS. El guard de
React se queda como está, para que un usuario normal no vea una pantalla rota.

---

## Las capas, de dentro a fuera

### Capa 1 — RLS (la única que de verdad protege)

Estado: **correcto en `Admins`**, pendiente en las tablas que aún no existen.

Lo que ya está bien hecho:

- `Admins` tiene RLS activado y solo una política, de lectura, condicionada a
  `private.is_admin()`.
- `is_admin()` vive en el esquema `private`, que **PostgREST no expone**: nadie
  puede llamarla desde la API. Es un detalle que se pasa por alto a menudo.
- Es `security definer` con `set search_path to ''`. Sin esa línea, un atacante
  con permiso para crear objetos podría colocar una tabla `Admins` falsa en un
  esquema anterior en el `search_path` y engañar a la función.
- Usa `(select auth.uid())` envuelto en subconsulta, que además de correcto hace
  que Postgres lo evalúe una vez y no por fila.

Lo que hay que repetir en cada tabla nueva: lectura pública solo de lo publicado,
escritura solo con `is_admin()`. El molde está en `panel.md`, sección 3.

**Por qué NO se activa `force row level security`:** aplicaría el RLS también al
owner de la tabla, y `agregar_admin()` funciona precisamente porque corre como
owner. Activarlo rompería el alta de admins.

### Capa 2 — Permisos de Postgres

Estado: **arreglado** en `20260826100433_seguridad_permisos_por_defecto.sql`.

El proyecto arrastraba unos `alter default privileges` que concedían
`insert/update/delete` a `anon` sobre **toda tabla futura** de `public`. El RLS
lo tapaba, pero eso deja una sola capa: una tabla sin políticas, o con una
política mal escrita, quedaba abierta a internet.

Ahora cada tabla nueva nace sin permisos y hay que concedérselos explícitamente.
Un olvido produce un fallo evidente (nadie puede leer) en vez de uno silencioso
(todo el mundo puede escribir).

### Capa 3 — XSS

Estado: **limpio hoy**, con CSP añadida como red de seguridad.

**Por qué importa aquí más de lo normal.** `supabase-js` guarda el token de
sesión en `localStorage`. Un XSS en esta app no es un `alert()` molesto: es robar
la sesión de un admin, y con ella todo lo que el RLS le permite hacer. XSS y
"acceso no autorizado al panel" son el mismo problema.

**Lo que ya protege.** React escapa todo lo que se interpola con `{}`. Para que
haya XSS hace falta uno de estos tres, y hoy no hay ninguno (verificado con grep
sobre `src/`):

1. `dangerouslySetInnerHTML`
2. Un `href` o `src` con valor de la base de datos — permite `javascript:alert(1)`
3. `eval()` / `new Function()`

**Las tres reglas para que siga así**, cuando el panel escriba en la base de
datos:

- Las descripciones de los platos se pintan como texto plano. Si algún día se
  quiere negrita, se usa Markdown con un renderizador que escape HTML — nunca
  `dangerouslySetInnerHTML` con lo que venga de la tabla.
- Cualquier URL guardada en base de datos se valida contra `https:` antes de
  meterla en un `href`. Nunca directamente.
- Las fotos van por Supabase Storage, no por URL escrita a mano.

**La CSP** (`vite.config.ts`) se inyecta solo en el build de producción, porque
en desarrollo rompería el HMR de Vite. Lo importante que dice:

- `script-src 'self'` sin `unsafe-inline` ni `unsafe-eval`: aunque alguien
  consiga inyectar un `<script>`, el navegador se niega a ejecutarlo.
- `connect-src` limitado a Supabase: un script robado no puede enviar el token a
  un servidor ajeno.
- `form-action 'self'`: un formulario inyectado no puede mandar credenciales
  fuera.
- `object-src 'none'`, `base-uri 'self'`: cierran dos vías clásicas de evasión.

### Capa 4 — Cabeceras del hosting

Estado: **pendiente**, depende de dónde se despliegue.

La CSP en `<meta>` cubre casi todo, pero **`frame-ancestors` solo funciona como
cabecera HTTP real**. Sin ella, la app se puede meter en un `<iframe>` en otra
web y hacer clickjacking sobre el panel.

En Netlify o Cloudflare Pages, un archivo `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

En Vercel, lo mismo dentro de `vercel.json`. Cuando esté decidido el hosting, se
añade el archivo que corresponda.

### Capa 5 — Configuración de Supabase (dashboard)

Estado: **por revisar**. Nada de esto está en el repo, hay que entrar al panel de
Supabase. Es donde más seguridad se gana por minuto invertido:

- [ ] **MFA para los admins.** Con tres o cuatro dueños es totalmente viable, y
      es la medida que más sube el listón: una contraseña filtrada deja de ser
      suficiente para entrar. Si quieres "seguridad máxima", esto es lo primero.
- [ ] **Protección de contraseñas filtradas** (Auth → Passwords). Comprueba
      contra HaveIBeenPwned. Gratis, un clic.
- [ ] **Longitud mínima de contraseña** a 10-12. Hoy el formulario pide 6, que es
      el mínimo de Supabase y es poco para una cuenta con acceso de escritura.
- [ ] **Confirmación por email obligatoria.** Evita que se registren correos que
      no controla quien los escribe.
- [ ] **CAPTCHA en el registro** (hCaptcha o Turnstile). El registro es público
      por diseño, así que sin esto es un objetivo de bots.
- [ ] **Rate limiting de auth.** Revisar los valores por defecto de intentos de
      login por hora.
- [ ] **URLs de redirección** restringidas al dominio real, no `*`.

---

## Revocar el acceso: decisión tomada

Existe `agregar_admin()` pero no su contraria. **Se ha decidido no construirla**:
con tres o cuatro dueños, quitarle el admin a alguien es algo que pasará una vez
cada varios años, y no compensa el código y la interfaz que requiere.

La contrapartida es que **revocar es un procedimiento manual** y hay que saber
hacerlo *antes* de necesitarlo, no durante una urgencia. Desde el SQL Editor de
Supabase:

```sql
-- Ver quién es admin ahora mismo
select a.id, a.name, u.email
from public."Admins" a join auth.users u on u.id = a.user_id;

-- Quitarle el admin a alguien (la cuenta sigue existiendo, pierde el panel)
delete from public."Admins" where user_id = '<el uuid de arriba>';
```

Si la cuenta está comprometida, no basta con quitarle el admin: hay que cerrarle
las sesiones abiertas, porque su token sigue siendo válido hasta que caduque.
Eso se hace desde el dashboard, en Authentication → Users → la cuenta → cerrar
sesiones, o cambiándole la contraseña.

**Cuándo reconsiderarlo:** si el número de admins pasa de cinco, o si alguna vez
hay que revocar con prisa y el procedimiento manual resulta incómodo.

## Lo que NO conviene hacer

- **Mover el token de localStorage a cookies.** Suena más seguro y en una SPA
  como esta no lo es: cambia XSS por CSRF y añade complejidad de servidor. La
  mitigación correcta del robo de token aquí es no tener XSS (capa 3) y sesiones
  cortas.
- **Ofuscar la ruta `/admins`.** Seguridad por oscuridad. No aporta nada frente a
  quien mire el bundle.
- **Validar solo en el cliente.** Zod en el formulario es para dar buenos
  mensajes de error, no para proteger. Las reglas que importan —precio no
  negativo, nombre no vacío— van además como `check constraints` en la tabla.

---

## Sobre la clave `sb_secret_` del `.env`

Ver el aviso al respecto: es el punto más grave abierto ahora mismo.
