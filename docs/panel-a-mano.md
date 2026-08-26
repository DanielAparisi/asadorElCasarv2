# El panel a mano: shadcn/ui + react-hook-form + zod

Cómo se ve construir el panel sin framework de CRUD. Documento de exploración:
sirve para decidir con conocimiento de causa, no para copiar y pegar.

**Resumen de la conclusión, por si no lees más:** el CRUD completo de `platos`
son unas 300 líneas propias. La mayor parte del trabajo real no está en los
formularios, sino en las fotos y en el orden de la carta — y eso hay que
escribirlo igual con framework o sin él.

---

## 1. Qué aporta cada pieza

| | Qué resuelve | Qué NO resuelve |
|---|---|---|
| **shadcn/ui** | Los componentes: tabla, input, select, diálogo, toast. Accesibles y ya estilados con Tailwind. | Nada de datos ni de lógica. Son componentes sueltos. |
| **react-hook-form** | El estado del formulario: valores, campos tocados, errores, estado de envío. Sin re-render en cada tecla. | No sabe qué es válido. |
| **zod** | Las reglas: qué es un precio válido, qué campos son obligatorios. Y el tipo de TypeScript sale del mismo sitio. | No pinta nada. |

La gracia está en cómo encajan: defines el esquema **una vez** en zod, y de ahí
salen a la vez la validación en tiempo de ejecución y el tipo de TypeScript. No
hay dos definiciones que se puedan desincronizar.

shadcn/ui no es una dependencia normal: su CLI **copia el código del componente a
tu repo**. Queda en `src/components/ui/`, es tuyo, lo editas. No hay versión que
actualizar ni API opaca contra la que pelear.

---

## 2. Instalación en este repo

### 2.1 Alias de importación (obligatorio)

shadcn genera imports del tipo `@/components/ui/button`. Ahora mismo el proyecto
no tiene alias, así que hay que añadirlo en dos sitios.

En `tsconfig.json` (el raíz, aunque solo tenga `references` — el CLI lo lee de
ahí) y en `tsconfig.app.json`:

```json
"compilerOptions": {
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```

En `vite.config.ts`:

```ts
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`@types/node` ya está instalado, así que el import de `node:path` no da problema.

### 2.2 El CLI

```bash
npx shadcn@latest init
npx shadcn@latest add button input textarea label form table dialog sonner switch
```

`init` toca `src/index.css` para añadir las variables de color del tema. Ahora
mismo ese archivo es una sola línea (`@import "tailwindcss";`), así que no hay
nada que se pueda romper.

⚠️ **Verificar el soporte de Tailwind v4.** Este proyecto usa Tailwind 4 con
`@tailwindcss/vite`, sin `tailwind.config.js`: el tema se declara en CSS con
`@theme`. shadcn soporta v4, pero es el punto donde más ha cambiado su
instalación. Si el `init` pregunta por un `tailwind.config.js`, parar y mirar su
documentación antes de seguir.

### 2.3 Las dependencias de verdad

```bash
npm i react-hook-form zod @hookform/resolvers
```

Tres dependencias. Es todo.

---

## 3. Estructura resultante

```
src/
  components/ui/          ← generado por shadcn, no se toca a mano
    button.tsx  input.tsx  form.tsx  table.tsx  dialog.tsx  ...
  platos/
    esquema.ts            ← zod: reglas + tipos
    usePlatos.ts          ← lista, alta, edición, borrado
    PlatoForm.tsx         ← el formulario, compartido por alta y edición
    PlatosTabla.tsx       ← la lista
  pages/admins/
    platos.tsx            ← /admins/platos
    platoNuevo.tsx        ← /admins/platos/nuevo
    platoEditar.tsx       ← /admins/platos/:id
```

Cinco archivos propios por recurso. El segundo recurso (`categorias`) es un
copiar-pegar-adaptar de media hora.

---

## 4. El esquema: una sola fuente de verdad

```ts
// src/platos/esquema.ts
import { z } from 'zod'

export const esquemaPlato = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El plato necesita un nombre')
    .max(80, 'Nombre demasiado largo'),

  descripcion: z.string().trim().max(300, 'Máximo 300 caracteres'),

  // Se valida como texto porque eso es lo que da un <input>. La conversión a
  // céntimos se hace al enviar, no aquí (ver la nota de abajo).
  precio: z
    .string()
    .trim()
    .regex(/^\d{1,3}([.,]\d{1,2})?$/, 'Escríbelo como 18,50'),

  categoria_id: z.coerce.number().int().positive('Elige una categoría'),

  disponible: z.boolean(),
})

export type FormularioPlato = z.infer<typeof esquemaPlato>

export function aCentimos(precio: string) {
  return Math.round(parseFloat(precio.replace(',', '.')) * 100)
}

export function aEuros(centimos: number) {
  return (centimos / 100).toFixed(2).replace('.', ',')
}
```

**Sobre el precio — el detalle que más tiempo hace perder.** Zod permite meter la
conversión dentro del esquema con `.transform()`, y es tentador porque deja el
`onSubmit` limpio. El problema es que entonces el tipo de entrada del formulario
(`string`) deja de coincidir con el de salida (`number`), y hay que empezar a
pelearse con los genéricos de `useForm` para que TypeScript no se queje.

No compensa. **Mantén el esquema plano y convierte a mano en el `onSubmit`.** Es
una línea, y te ahorra una tarde.

---

## 5. El formulario

```tsx
// src/platos/PlatoForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { esquemaPlato, type FormularioPlato } from './esquema'

type Props = {
  valoresIniciales: FormularioPlato
  onGuardar: (valores: FormularioPlato) => Promise<void>
}

export function PlatoForm({ valoresIniciales, onGuardar }: Props) {
  const form = useForm<FormularioPlato>({
    resolver: zodResolver(esquemaPlato),
    defaultValues: valoresIniciales,
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGuardar)} className="space-y-6 max-w-lg">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del plato</FormLabel>
              <FormControl>
                <Input placeholder="Chuletón de vaca madurada" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="precio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio (€)</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="18,50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* descripcion, categoria_id y disponible siguen el mismo patrón */}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando…' : 'Guardar plato'}
        </Button>
      </form>
    </Form>
  )
}
```

Fíjate en lo que **no** hay: ni un `useState` por campo, ni `onChange`, ni
comprobar si el precio es un número, ni decidir dónde pintar el error. `FormField`
conecta el campo con el esquema y `FormMessage` pinta el mensaje que corresponda.

El mismo componente sirve para alta y para edición: cambian los
`valoresIniciales` y el `onGuardar`. Es lo que evita tener dos formularios que se
van separando con el tiempo.

---

## 6. Los datos

Siguiendo el patrón de hooks que ya tienes en el repo:

```ts
// src/platos/usePlatos.ts  (esbozo)
export function usePlatos() {
  // useEffect + select, igual que useAdmins

  async function guardar(id: number | null, valores: FormularioPlato) {
    const fila = {
      nombre: valores.nombre,
      descripcion: valores.descripcion,
      precio_centimos: aCentimos(valores.precio),
      categoria_id: valores.categoria_id,
      disponible: valores.disponible,
    }

    const { data, error } = id
      ? await supabase.from('platos').update(fila).eq('id', id).select().single()
      : await supabase.from('platos').insert(fila).select().single()

    if (error) throw new Error(error.message)
    return data
  }

  return { platos, loading, error, guardar }
}
```

La conversión a céntimos vive aquí, en el único sitio por el que pasan todas las
escrituras. Así no hay forma de guardar euros por error desde otra pantalla.

---

## 7. La lista y el borrado

`Table` de shadcn para la lista, y `Dialog` para confirmar antes de borrar.

Esto último es lo que de verdad hace que un panel sea seguro para gente no
técnica, y es donde conviene aplicar lo acordado en `panel.md`: el botón
principal de cada fila es **"Quitar de la carta"** (cambia `disponible`, es
reversible, sin confirmación). El borrado definitivo va escondido, en rojo, y
detrás de un diálogo que obliga a leer.

`sonner` (el toast de shadcn) para el "Plato guardado". Un panel que no confirma
que ha guardado hace que la gente le dé tres veces al botón.

---

## 8. Cuánto es esto en total

| Archivo | Líneas aprox. |
|---|---|
| `esquema.ts` | 40 |
| `usePlatos.ts` | 80 |
| `PlatoForm.tsx` | 120 |
| `PlatosTabla.tsx` | 90 |
| Las tres páginas | 60 |
| **Total propio** | **~390** |

Más unas 600 líneas en `components/ui/` que escribe el CLI y no vas a leer.

Para comparar: montar Refine, entender sus data providers, sus hooks y sus
convenciones para llegar al mismo sitio son unas 2-3 horas de lectura de
documentación. Escribir estas 390 líneas son unas 3-4 horas. **Es un empate en
tiempo** — y la diferencia está en qué te queda después: aquí te queda código que
entiendes entero, allí te queda una dependencia que hay que aprender pero que
rentabilizarías si aparecieran diez tablas más.

---

## 9. Con qué te vas a chocar

**`verbatimModuleSyntax` está activado** en `tsconfig.app.json`. Los tipos hay que
importarlos con `import type { ... }`, no mezclados con los valores. El código de
shadcn ya lo respeta; el tuyo tiene que hacerlo también.

**`noUnusedLocals` y `noUnusedParameters` están activados.** Algún componente
generado puede traer un import de más y romper el `tsc -b`. Se borra y ya.

**RLS callado.** Si `platos` no tiene política de `insert`, el insert falla con un
error de permisos poco descriptivo. Antes de dar por rota la app, mirar las
políticas (está en `panel.md`, sección 3).

**Las categorías del `<select>`** hay que cargarlas antes de pintar el
formulario, o el campo aparece vacío al editar un plato existente. Es el bug
clásico de estos formularios.

---

## 10. Veredicto

Para dos tablas, a mano con estas tres piezas. El código resultante es tuyo, se
lee entero en un rato, y no impone ninguna estructura a la app.

**Reconsiderarlo si aparecen más de 5 o 6 recursos** — reservas, eventos, menú
del día, proveedores. En ese punto sí compensa un framework de CRUD, y la
migración no sería traumática porque el esquema de zod y los hooks se pueden
reaprovechar.
