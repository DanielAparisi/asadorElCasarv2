# Asador El Casar — Blindaje de autenticación y RLS

Checklist para cerrar el acceso al panel `/admins`. Orden importa: no desactives el
signup antes del paso 1 o puedes quedarte fuera de tu propio panel.

---

## 0. Antes de tocar nada

Comprueba en el SQL Editor de Supabase que tus admins ya existen:

```sql
select id, email, created_at, last_sign_in_at
from auth.users
order by created_at;
```

- Si están todos → puedes seguir con seguridad.
- Si falta alguien o la tabla está vacía → créalo primero (paso 3) y **luego** desactiva el signup.

---

## 1. Preparar la tabla de admins

`email` es la lista blanca. `user_id` se rellena solo mediante trigger.

```sql
create table if not exists public.admins (
  email      text primary key,
  user_id    uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
```

Si ya tienes la tabla creada con otra forma, añade la columna:

```sql
alter table public.admins add column if not exists user_id uuid unique
  references auth.users(id) on delete cascade;
```

Autoriza los emails que van a poder entrar:

```sql
insert into public.admins (email) values ('jefe@asadorelcasar.com')
on conflict (email) do nothing;
```

---

## 2. Triggers de control de alta

### 2.1 Bloquear altas de emails no autorizados

Red de seguridad por si alguien reactiva el toggle del dashboard sin querer.

```sql
create schema if not exists private;

create or replace function private.block_unknown_signups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admins where email = new.email) then
    raise exception 'signup no permitido';
  end if;
  return new;
end;
$$;

drop trigger if exists block_unknown_signups on auth.users;
create trigger block_unknown_signups
  before insert on auth.users
  for each row execute function private.block_unknown_signups();
```

### 2.2 Enlazar el UUID automáticamente

```sql
create or replace function private.link_admin_uid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.admins set user_id = new.id where email = new.email;
  return new;
end;
$$;

drop trigger if exists link_admin_uid on auth.users;
create trigger link_admin_uid
  after insert on auth.users
  for each row execute function private.link_admin_uid();
```

Si ya tenías usuarios creados antes de esto, rellena los `user_id` existentes:

```sql
update public.admins a
set user_id = u.id
from auth.users u
where u.email = a.email and a.user_id is null;
```

---

## 3. Crear los usuarios admin

Dos vías. Ambas usan `service_role` y **se saltan el signup cerrado por diseño**.

### Opción A — Dashboard (recomendada para 2-3 personas)

Authentication → Users → **Add user** → Create new user.
Marca **Auto Confirm User** para saltarte el email de confirmación.

### Opción B — Script (nunca desde el frontend)

```js
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL, process.env.SERVICE_ROLE_KEY)

await admin.auth.admin.createUser({
  email: 'jefe@asadorelcasar.com',
  password: process.env.TEMP_PASSWORD,
  email_confirm: true
})
```

### Entrega de contraseña

No inventes una contraseña y la mandes por WhatsApp. Genera un enlace de recovery
para que cada admin ponga la suya:

```js
await admin.auth.admin.generateLink({
  type: 'recovery',
  email: 'jefe@asadorelcasar.com'
})
```

> La `service_role` key va en variable de entorno, jamás en el bundle del frontend.
> Con ella se salta toda la RLS que montes.

---

## 4. Cerrar el signup público

Dashboard → Authentication → Sign In / Providers → sección Email:

- [ ] **Allow new users to sign up** → OFF
- [ ] **Allow manual linking** → OFF (no usas OAuth, no hay nada que enlazar)
- [ ] **Anonymous sign-ins** → OFF
- [ ] Proveedores OAuth que no uses (Google, GitHub…) → OFF

Si gestionas config por CLI, en `supabase/config.toml`:

```toml
[auth]
enable_signup = false
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = false
```

**Esto no afecta al login.** `signInWithPassword()` sigue funcionando igual para
los usuarios existentes. Solo desaparece `signUp()`.

Endurece además el login que queda abierto — ver **Anexo A**: leaked password
protection, longitud mínima y rate limits.

---

## 5. `is_admin()` por UUID, no por email

El email es mutable (`updateUser`, identidades vinculadas). El UUID no.

```sql
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;
```

`security definer` + `search_path` fijado es obligatorio: evita la recursión infinita
de RLS cuando la política de `admins` consulta `admins`.

---

## 6. Revisar las políticas RLS

**El punto que más se suele dejar suelto.** Ninguna política de escritura debe decir
`to authenticated` a secas — la condición tiene que ser `private.is_admin()`.

Audita lo que tienes ahora:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

Forma objetivo:

```sql
alter table public.categories enable row level security;
alter table public.dishes     enable row level security;
alter table public.admins     enable row level security;

-- Lectura pública de la carta
create policy "carta publica categories" on public.categories
  for select to anon, authenticated using (true);

create policy "carta publica dishes" on public.dishes
  for select to anon, authenticated using (true);

-- Escritura solo admins
create policy "admins escriben categories" on public.categories
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "admins escriben dishes" on public.dishes
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- La tabla admins NO es legible por anon
create policy "solo admins ven admins" on public.admins
  for select to authenticated using (private.is_admin());
```

### Verificación crítica

Con la anon key pública, esto **debe** devolver vacío o error:

```bash
curl "https://<PROJECT>.supabase.co/rest/v1/admins?select=*" \
  -H "apikey: <ANON_KEY>"
```

Si te devuelve filas, estás filtrando los emails de tus administradores.

---

## 7. Comprobación final

- [ ] `curl` a `/rest/v1/admins` con anon key → vacío
- [ ] `curl` a `/rest/v1/dishes` con anon key → devuelve la carta
- [ ] `signUp()` desde la web → error 422 `Signups not allowed for this instance`
- [ ] Login de un admin existente → funciona
- [ ] Un usuario autenticado que no esté en `admins` → no puede escribir

---

## Dar de baja a alguien

1. Authentication → Users → borrar el usuario.
   El `on delete cascade` limpia la fila de `admins` y la sesión deja de validar.
2. Borra también el email de la lista blanca:

```sql
delete from public.admins where email = 'exempleado@asadorelcasar.com';
```

Así no puede volver a entrar ni aunque le recrees la cuenta por error.

---

## Anexo A — Método de login: contraseña vs magic link

**Decisión: contraseña.** Y el razonamiento, porque el titular solo no sirve.

### Por qué no magic link (todavía)

Tu app hoy no manda ni un solo correo. El magic link introduce una dependencia de
infraestructura nueva — proveedor SMTP, entregabilidad, spam — para un panel de
cuatro personas. Y tiene un fallo concreto: **si el SMTP se cae o el correo tarda,
nadie entra**. Con contraseña, la sesión viva sigue funcionando y el login no
depende de terceros.

### Qué cambiaría la decisión

Si sabes que los dueños van a compartirse la cuenta o a reutilizar la contraseña
del email personal, cambia a magic link — con **código de 6 dígitos**, no enlace.
Ahí el problema humano pesa más que la dependencia técnica.

> Nota: esta decisión no es la que protege tu carta. Lo que la protege es el signup
> cerrado, el trigger de allowlist y `is_admin()` por `uid`. Entre contraseña y magic
> link estás eligiendo entre dos opciones seguras.

### Configuración con contraseña

Authentication → Policies / Rate Limits:

- [ ] **Leaked password protection** → ON (rechaza contraseñas en filtraciones conocidas)
- [ ] **Minimum password length** → 12 o más
- [ ] **Rate limit de sign-in** → bájalo. El defecto es generoso para una app pública;
      con 4 usuarios puedes dejarlo muy bajo.

Que cada uno la guarde en el gestor del móvil: Face ID y dentro, cero fricción.
Si alguien la olvida, la reseteas desde el dashboard en diez segundos — con cuatro
usuarios eso ocurre una vez al año.

### Si algún día migras a magic link

```jsx
await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false,               // ← crítico, por defecto es true
    emailRedirectTo: 'https://asadorelcasar.com/admins'
  }
})
```

`shouldCreateUser: false` es obligatorio: por defecto `signInWithOtp` **crea el
usuario si no existe**, justo lo que cierras en el paso 4.

Verificación con código de 6 dígitos (evita que el enlace abra en el webview de
Gmail en vez de en el navegador del usuario — el fallo más reportado del magic link):

```jsx
await supabase.auth.verifyOtp({ email, token: codigo, type: 'email' })
```

Para que el correo muestre el código, edita la plantilla **Magic Link** en
Authentication → Emails y usa `{{ .Token }}` en vez de `{{ .ConfirmationURL }}`.

Requisitos añadidos si vas por aquí:
- SMTP propio (Resend, Postmark, SES). El SMTP de cortesía de Supabase está limitado
  a un puñado de correos por hora y no garantiza entrega.
- URL Configuration → Redirect URLs: añade `https://asadorelcasar.com/**` y
  `http://localhost:5173/**`. Si no está en la lista, el enlace rebota y parece roto.
- Expiración del OTP → 600 segundos (el defecto es una hora, demasiado para un
  enlace que da acceso total al panel).

---

## Anexo B — Botón de acceso al panel en la landing

**Sí, puedes ponerlo visible.** Ocultar la ruta nunca fue tu capa de seguridad:
`/admins` está en tu bundle de JavaScript, cualquiera lo encuentra con devtools en
treinta segundos. Como la seguridad no depende de eso, un botón discreto en el
footer no te quita nada.

Lo que sí cambia: el formulario de login queda a un clic de cualquiera. Se cubre
con los tres ajustes del Anexo A (leaked password protection, longitud mínima,
rate limits).

### Implementación sin router

```jsx
const [showPanel, setShowPanel] = useState(false)
const Panel = lazy(() => import('./Panel'))

<button onClick={() => setShowPanel(true)}>Panel</button>

{showPanel && (
  <Suspense fallback={<Cargando />}>
    <Panel />
  </Suspense>
)}
```

Si quieres que `/admins` sea una URL compartible de verdad, necesitas un rewrite en
el hosting que sirva el mismo `index.html`, más leer `location.pathname` al arrancar.
Hoy funciona, pero no está documentado en ningún sitio y se rompe silenciosamente el
día que cambies de hosting.

### Por qué un usuario que tú no creaste nunca será admin

Tres capas independientes; tienen que fallar las tres a la vez:

1. Con el signup cerrado, **no puede ni existir** como usuario.
2. Si alguien reactivara el toggle, `block_unknown_signups` rechaza cualquier email
   que no esté ya en `admins`.
3. Y aun existiendo, `is_admin()` busca su `uid` en `admins`, no lo encuentra,
   devuelve `false` → mismos permisos que un visitante anónimo. Lee la carta, no
   escribe nada.

### La única grieta real

No está en ninguna de esas capas: es la `service_role` key. Con ella se salta toda
la RLS de golpe. Verifica que no se te haya colado en el frontend:

```bash
grep -rn "service_role\|SERVICE_ROLE" dist/ src/ .env* 2>/dev/null
```

En `dist/` no debe aparecer nunca. En `src/` tampoco. Solo en un `.env` que esté
en `.gitignore`.

---

## Pendiente (fuera del alcance de auth)

Del repaso a la arquitectura, sigue abierto:

- **Prerender vs. fetch en runtime**: si Supabase se cae, la carta se queda en blanco.
  Hornear los datos en build + rebuild por webhook lo resuelve.
- **Validación en base**: CHECK constraints para precios, orden y slugs. Ahora mismo
  la única validación es el JS del panel.
- **Ciclo de vida de imágenes**: borrar el `.webp` del bucket al borrar un plato, y
  nombrar ficheros por hash de contenido con `Cache-Control: immutable`.
