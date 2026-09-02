# Código sostenible en este proyecto

Pautas concretas para este repo, no reglas genéricas de libro. Salen de leer las
1.885 líneas de `src/` el 01/09/2026, y cada una viene con **el caso real** que
la motiva: si no encontré el problema en el código, no está aquí.

**El criterio.** Sostenible significa que dentro de seis meses, cuando no
recuerdes nada, puedas cambiar un precio, añadir una pantalla o arreglar un bug
sin releer el proyecto entero. Nada más. No se trata de que el código sea
bonito.

**Qué NO hay que arreglar.** Antes de la lista, lo que ya está bien y conviene
no tocar: los comentarios explican *por qué*, no *qué* (`useSession` explica la
race, `tokens.ts` explica por qué existe); los hooks tienen una
responsabilidad cada uno; `useMenu()` ya devuelve la forma que tendrá cuando
lea de Supabase; y `content.ts` centraliza el teléfono y la dirección. Ese nivel
es el que hay que mantener, no subir.

---

## 0. Dos cosas que arreglar hoy, antes que ninguna pauta

No son de estilo. Son bugs que ya están en el repo.

### 0.1 La CSP bloquea el mapa en producción

`vite.config.ts` inyecta `frame-src 'none'` en la build. `LocationSection.tsx:76`
pinta un `<iframe>` de Google Maps. En producción el navegador **se niega a
cargar el mapa**: donde debería estar el plano queda el marco vacío.

En `npm run dev` no se ve, porque el plugin es `apply: 'build'`. Se ve solo con
`npm run build && npm run preview`, que es justo lo que nadie hace antes de
desplegar.

```
"frame-src 'none'"  →  "frame-src https://www.google.com"
```

No poner `*`: la gracia de la directiva es que solo Google Maps pueda empotrarse.

**La lección, que vale más que el arreglo:** una configuración de seguridad que
solo se aplica en la build es una configuración que no se prueba nunca. Cuando
se haga la tarea 4 (despliegue), el `npm run preview` tiene que entrar en la
rutina antes de cada release.

### 0.2 `MenuSection` ignora las categorías — 🟡 A MEDIAS (02/09/2026)

> `loading` y `error` ya se pintan: al hacer la 8.3 se vio que sin eso un fallo
> de red dejaba la carta vacía y muda para siempre. **Sigue pendiente lo otro**:
> la carta pública mapea los platos en una lista plana y no usa `categories`.

`useMenu()` devuelve `{ dishes, categories, loading, error }`.
`MenuSection.tsx:14` desestructura solo `dishes` y pinta una lista plana. Hoy
cuela porque hay dos categorías y seis platos seguidos; el día que haya cuatro
categorías, la carta pública será un churro de 40 filas sin ningún separador.

Y hay un segundo filo: `loading` y `error` no se usan **en ningún sitio** del
código público. Hoy `loading` siempre es `false`, así que da igual. En la tarea
8.3, cuando `useMenu()` lea de Supabase, `loading` empezará a ser `true` de
verdad y `MenuSection` hará `dishes.map()` sobre un array vacío: la carta
aparecerá vacía durante el primer instante, y ante un error de red se quedará
vacía **para siempre y sin decir nada**.

El comentario de `useMenu` promete que "los componentes ya contemplan la
espera". No es cierto. Arreglarlo ahora, con el JSON, cuesta 20 minutos y es lo
que hace verdad esa promesa antes de que dependa de la red.

---

## 1. La regla de las tres capas de estilo

Es el problema más extendido del repo, y el que más va a doler en la tarea 8.

Hoy conviven tres formas de escribir estilos:

| capa | dónde | ejemplo |
|---|---|---|
| Tokens del tema | `index.css` | `--color-ink`, `--font-title` |
| Constantes compartidas | `ui/tokens.ts` | `POSTER_BORDER`, `PAGE_CONTAINER` |
| Clases sueltas en el JSX | por todas partes | `border border-gray-300 rounded px-3 py-2` |

La landing usa bien las dos primeras. **El panel y el login viven enteros en la
tercera.** Cuenta rápida de lo repetido:

- `text-xl font-semibold` — el título de página, copiado en **5 archivos**
- `border border-gray-300 rounded px-3 py-2` — el input, en **3 sitios**
- `bg-gray-800 text-white rounded …disabled:opacity-50` — el botón, en **3 sitios**
- `text-gray-500` — el texto secundario, en **7 sitios**

Y esto es **antes** de la tarea 8, que añade cuatro pantallas más: una tabla de
platos, un formulario de alta, uno de edición y una lista de categorías. Cada
input y cada botón que se escriba ahí multiplica el problema.

**La pauta:** antes de empezar la 8.5, extraer `AdminInput`, `AdminButton` y
`AdminHeading` a `src/features/admin/components/`. Tres componentes tontos, sin
lógica, veinte líneas en total.

> ✅ Hecho el 02/09/2026, antes de escribir las cuatro pantallas de la tarea 8.
> Salió un cuarto, `AdminField` (la etiqueta con su campo debajo), que es lo que
> mantiene `DishForm` por debajo del límite de la pauta 4. `TeamPage` y
> `LoginForm` todavía llevan sus clases sueltas: se pasan cuando se toquen.

No es por elegancia: es que `docs/panel.md` dice que **el panel puede ser feo**.
Precisamente por eso su estilo tiene que estar en un solo sitio — si algún día
se decide que deje de ser feo, es un archivo, no doce.

**Cuándo NO extraer.** Una clase larga que aparece **una vez** se queda en el
JSX. `MenuSection` tiene `className` de cinco líneas y está bien: describen ese
sitio y solo ese. La señal para extraer es la **tercera** repetición, no la
segunda.

---

## 2. Las rutas de importación: `../../../` está a un paso de más

37 importaciones del proyecto suben tres niveles:

```ts
import { supabase } from '../../../shared/lib/supabase'
```

Eso ya no dice de dónde viene nada, y tiene un coste real: **mover un archivo de
carpeta obliga a reescribir a mano todas sus importaciones**, y es exactamente
lo que va a pasar en la tarea 8 cuando `admin/` crezca.

Arreglo, diez minutos, cero dependencias:

```jsonc
// tsconfig.app.json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

```ts
// vite.config.ts
resolve: { alias: { '@': path.resolve(__dirname, './src') } }
```

Y entonces `import { supabase } from '@/shared/lib/supabase'` desde cualquier
sitio, sin contar puntos.

⚠️ Hay que tocar **los dos** archivos. TypeScript solo resuelve el tipo; si a
Vite no se lo dices también, compila y falla en tiempo de ejecución.

---

## 3. Un patrón de hook de datos, no cuatro

`useAdmins` estableció un patrón bueno: `useEffect` + `useState`, `loading`,
`error`, `AbortController` en la limpieza, estados de mutación separados
(`adding`, `addError`). `useIsAdmin` lo sigue. `useMenu` lo tendrá en la 8.3, y
`useDishes` y `useCategories` nacerán en la 8.4.

Serán **cinco hooks con la misma estructura**. La tentación de abstraerlos en un
`useSupabaseQuery` genérico va a aparecer sobre el tercero.

**Resístela.** `docs/panel.md` §4 ya lo tiene decidido y tiene razón: la
abstracción prematura de acceso a datos es más difícil de deshacer que la
repetición. Lo que sí hay que hacer es lo barato:

- [ ] Que los cinco devuelvan las claves con **el mismo nombre**: `loading`, no
      `cargando` ni `isLoading`. Hoy se cumple; escribirlo aquí es lo que hace
      que se siga cumpliendo.
- [ ] Que el `error` sea siempre `string | null`, no a veces el objeto de
      Supabase.
- [ ] `AbortController` en **todos**, incluso donde parezca que no hace falta.

**La señal de que sí toca abstraer** está en `docs/panel.md` §4 y conviene
tenerla escrita porque es fácil de confundir con otra cosa: no es "hay mucha
repetición", es **la invalidación**. El día que edites un precio, vuelvas a la
lista y la lista muestre el precio viejo por tercera vez, eso es TanStack Query
llamando. Ni antes ni por ningún otro motivo.

---

## 4. El límite de un componente es el archivo, no la línea

`LoginForm.tsx` tiene 105 líneas y hace tres cosas: estado del formulario,
alternar entre entrar/registrarse, y todo el markup de los dos campos.

No hay que partirlo hoy — funciona y se lee. Pero marca el umbral, y el umbral
es útil escribirlo:

**Cuando un componente pase de ~120 líneas, o cuando su nombre necesite una "y"
para describirse, se parte.**

Aplicado a lo que viene: `DishForm` (tarea 8.6) va a tener nombre, descripción,
precio, categoría, disponible y orden. Seis campos, validación y conversión de
euros a céntimos. **Va a nacer pasado de 120 líneas.** Preverlo ahora significa
sacar el `<CampoTexto>` desde el principio en vez de refactorizarlo después.

`HomePage` es el contraejemplo de cómo se hace bien: 46 líneas que solo componen
diez secciones. Reordenar la página es mover una línea.

---

## 5. `strict` está activo por accidente

Comprobado hoy: `tsconfig.app.json` **no declara `"strict": true`** por ningún
lado, y sin embargo el compilador rechaza `x.length` sobre un `string |
undefined` (TS18048) y los parámetros implícitos (TS7006).

La explicación es que TypeScript 6 lo trae activado por defecto. Funciona, pero
**depende de un default de la herramienta, no de una decisión del proyecto**. Es
frágil de una forma silenciosa: nadie va a notar el día que un cambio de
configuración lo apague, y el síntoma serán `undefined` en producción meses
después.

```jsonc
// tsconfig.app.json → declararlo explícitamente
"strict": true,
```

Una línea. Convierte un accidente afortunado en una decisión.

Mientras tanto, el `!` de `useIsAdmin.ts:34` (`userId: userId!`) es el tipo de
grieta que `strict` existe para señalar. Ahí es seguro —hay un `if (!userId)
return` arriba—, pero la forma de decirlo sin `!` es capturar el valor en una
const dentro del `useEffect`. **Cada `!` nuevo debería costar un comentario que
justifique por qué es seguro.** Hoy hay uno; que no lleguen a diez.

---

## 6. Las variables de entorno no se comprueban

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
```

Si falta el `.env`, `createClient` recibe `undefined` y el fallo aparece más
tarde, en la primera consulta, con un mensaje que no menciona la variable que
falta. Alguien clona el repo, se salta el `.env.example` y pierde media hora.

```ts
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env')
}
```

Cuatro líneas que convierten un misterio en una instrucción.

Nota de contexto: `vite.config.ts` ya hace `?? ''` para lo suyo, así que la
build no revienta sin las variables — y el CI lo aprovecha a propósito. Esta
comprobación es en **tiempo de ejecución**, que es otro momento y otro problema.

---

## 7. El idioma: la frontera ya está trazada, respétala

`docs/arquitectura.md` §9 la define y el código la cumple. Queda escrita aquí
porque es la regla que más fácil se rompe sin querer:

| en inglés | en español |
|---|---|
| identificadores, tipos, funciones | texto que ve el usuario |
| nombres de archivo y carpeta | comentarios de las migraciones antiguas |
| comentarios del código | rutas (`/admins/platos/nuevo`) y anclas |
| tablas y columnas | mensajes de error del panel |

Las rutas se quedan en español **a propósito**: son direcciones que el usuario ve
y que romperían enlaces guardados.

El punto peligroso está en la tarea 8: las tablas van en inglés
(`dishes`, `price_cents`), pero `docs/panel.md` §2 las escribe en español en sus
tablas de columnas, con la equivalencia en una nota al principio. **Leer esa nota
antes de escribir el DDL**, o acabas con `precio_centimos` en la base de datos y
`price_cents` en los tipos.

---

## 8. Lo que hay que dejar de hacer a mano

Tres cosas dependen hoy de que alguien se acuerde:

- **Prettier no es una dependencia.** El código está formateado con él (se nota
  en las comillas simples y la ausencia de punto y coma), pero no está en
  `package.json` ni hay `.prettierrc`. Cada quien formatea con lo que tenga su
  editor, y el día que dos formatos se crucen, un diff de una línea real vendrá
  con cuarenta de ruido. → `npm i -D prettier`, un `.prettierrc` con lo que ya se
  usa, y `npx prettier --check .` como tercer paso del CI.
- **Nadie corre `npm run preview`.** Es el único sitio donde se ve la CSP, y por
  eso el bug 0.1 lleva ahí desde que se escribió el plugin.
- **No hay ni un test.** No pasa nada hoy: la app es sobre todo markup, y un
  test de que un `<h1>` dice "Platos" no vale su mantenimiento. Pero en la tarea
  8 aparece la **primera lógica que merece uno de verdad**: la conversión de
  euros a céntimos («12,50», «12.50» y «12,5» → 1250). Es pura, no toca React, y
  es donde un error cuesta dinero real. Si algún día entra Vitest, que entre por
  ahí. Ya existe: `parsePriceToCents` en `src/features/menu/formatPrice.ts`, y
  hoy se comprueba a mano. Ese es el primer test del proyecto.

---

## 9. La documentación es parte del código

Este repo tiene `docs/` con cuatro documentos buenos y **eso es un activo poco
común**. También es la parte que más rápido se pudre, porque nada la compila.

Ya ha pasado dos veces:

1. `docs/panel.md` §3 seguía diciendo que las migraciones no llevan timestamp
   cuando la tarea 9 ya se los había puesto.
2. Las tareas 1–7 de `nextTasks.md` citan rutas (`src/hooks/useCarta.ts`) que
   dejaron de existir con el paso a inglés.

Ninguna de las dos es grave porque están anotadas. La pauta es la que ya se está
siguiendo, escrita para que no se pierda:

**Un cambio que invalida una frase de `docs/` no está terminado hasta que la
frase se corrige o se marca como caduca.** Va en el mismo commit. Un documento
con fecha y una nota de "esto ya no es así" es infinitamente mejor que uno que
miente en presente.

---

## Orden sugerido

Nada de esto es urgente salvo lo primero. Lo que no cabe en un rato, no se hace.

| # | qué | cuándo | tiempo |
|---|---|---|---|
| 0.1 | `frame-src` de la CSP | **ya** — el mapa está roto en producción | 2 min |
| 5 | `"strict": true` explícito | ya, es una línea | 1 min |
| 6 | Comprobar las variables de entorno | ya | 5 min |
| 2 | Alias `@/` | antes de la tarea 8 | 10 min |
| 0.2 | 🟡 `MenuSection`: `loading` y `error` hechos, faltan las categorías | cuando se toque la carta | 10 min |
| 1 | ✅ `AdminInput` / `AdminButton` / `AdminHeading` | hecho el 02/09/2026 | |
| 8 | Prettier en el CI | cuando toque el CI | 15 min |

Las pautas 3, 4, 7 y 9 no son tareas: son criterios para cuando se escriba el
código de la tarea 8.
