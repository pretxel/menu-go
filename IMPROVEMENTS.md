# Menu-GO — Mejoras Propuestas

Análisis basado en el código fuente del proyecto (`apps/menu-go`, `packages/db`, `packages/ui`).
Las mejoras están ordenadas por impacto dentro de cada categoría.

---

## 1. Bugs y Problemas Críticos

### 1.1 Mensaje de error hardcodeado en producción
**Fichero:** `apps/menu-go/src/app/actions.ts:77`
```ts
return { message: `ERROO todo ` };  // ← debug string expuesto al usuario
```
Reemplazar por un mensaje descriptivo y diferenciado por caso de error.

### 1.2 Typo en variable de entorno
**Fichero:** `apps/menu-go/src/app/actions.ts:105`
```ts
`${process.env.NEXT_PUBLIC_SIE}/menu/${restaurant.id}`
```
`NEXT_PUBLIC_SIE` parece un typo de `NEXT_PUBLIC_SITE` o `NEXT_PUBLIC_URL`. Si la variable no está definida, los QR codes generados apuntarán a `undefined/menu/…` y serán inválidos.

### 1.3 `userId` almacenado en `localStorage` sin validación
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:48`
```ts
const userIdd = localStorage.getItem('usedIdTemp');
```
El ID temporal de usuario demo se lee de `localStorage` sin sanitización y se envía directo al servidor como parámetro de mutaciones. Cualquier usuario puede manipular este valor y crear/editar platos bajo otro ID.

### 1.4 `useFormState` deprecated en Next.js 15 / React 19
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:34`
```ts
import { useFormState } from 'react-dom';
```
`useFormState` fue renombrado a `useActionState` en React 19. Usar la API deprecada puede generar warnings y romper en futuras versiones.

### 1.5 Categorías globales sin propietario
**Fichero:** `packages/db/prisma/schema.prisma:70`
```prisma
model Category {
  id   String @id @default(uuid())
  name String
  ...
}
```
El modelo `Category` no tiene relación con `ConfigRestaurant` ni con `User`. Todos los restaurantes comparten el mismo catálogo de categorías. Cualquier restaurante puede ver y usar las categorías de otro. Si se añade una categoría, aparece globalmente para todos.

### 1.6 El esquema permite múltiples restaurantes por usuario pero el código asume uno solo
**Fichero:** `packages/db/prisma/schema.prisma:46` + `apps/menu-go/src/app/actions.ts:44,89`
```prisma
ConfigRestaurant ConfigRestaurant[]  // permite N restaurantes
```
```ts
const existConfig = await prisma.configRestaurant.findFirst(...)  // toma el primero
```
La relación es 1-N en BD pero el código trata siempre el primer resultado. Si un usuario tuviese dos registros (por un bug), el segundo quedaría huérfano e inaccesible.

---

## 2. Código / Arquitectura

### 2.1 Tipos `any` suprimidos con `eslint-disable`
**Fichero:** `apps/menu-go/src/app/actions.ts:1-2`, `dishesForm.tsx:1`, múltiples componentes
```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
```
Prevalece en `postDish(prevState: any, formData: FormData)`, `postRestaurant(prevState: any, ...)`, `category?: any` en `IDishesForm`. Reemplazar por tipos explícitos. El tipo correcto para `prevState` de un server action es `Awaited<ReturnType<typeof postDish>>`.

### 2.2 Sin timestamps en ningún modelo
**Fichero:** `packages/db/prisma/schema.prisma` — todos los modelos
Ningún modelo tiene `createdAt` ni `updatedAt`. Impide ordenar por fecha, auditar cambios, o construir feeds de actividad.
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

### 2.3 `qrCode` guardado como Data URL en base64 en la BD
**Fichero:** `packages/db/prisma/schema.prisma:64` + `actions.ts:104`
```ts
const url = await QRCode.toDataURL(...)  // retorna ~3KB de base64
await prisma.configRestaurant.update({ data: { qrCode: url } })
```
Guardar base64 (~3-5 KB) en la BD es ineficiente. El QR puede regenerarse en tiempo real desde el `restaurantId` o almacenarse en Vercel Blob como imagen PNG.

### 2.4 Modelo `Dishes` con nombre en plural
**Fichero:** `packages/db/prisma/schema.prisma:78`
Convención Prisma: modelos en singular. `Dishes` debería ser `Dish`. Actualmente genera `prisma.dishes.*` en lugar del más natural `prisma.dish.*`.

### 2.5 Sin validación de esquema en server actions
**Fichero:** `apps/menu-go/src/app/actions.ts`
Los datos del formulario se usan directamente con `formData.get(...)` sin validación. Añadir **Zod** para validar tipos, rangos y formatos antes de cualquier operación de BD:
```ts
const schema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  ...
});
```

### 2.6 Sin tipos en props del componente `Menu`
**Fichero:** `apps/menu-go/src/components/Menu/index.tsx:5`
```ts
export default function Menu({ dishes, restaurant }) {
```
Props sin tipar. `dishes` y `restaurant` deberían usar los tipos derivados de Prisma (`Awaited<ReturnType<typeof getMenu>>['Dishes']`).

### 2.7 Agrupación por categoría en componente de presentación
**Fichero:** `apps/menu-go/src/components/Menu/index.tsx:6`
```ts
const groupByCategory = dishes.reduce(...)
```
La agrupación y el ordenado deberían hacerse en el server action `getMenu()` o en la query de Prisma (`orderBy`, `groupBy`), no en el componente de UI. Permite además controlar el orden de las categorías.

### 2.8 `autoComplete` incorrecto en campos de formulario
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:91,131`
```tsx
<input name="price" autoComplete="given-name" />
<input name="description" autoComplete="given-name" />
```
El atributo `autoComplete="given-name"` en campos de precio y descripción es semánticamente erróneo. Usar `autoComplete="off"` o los valores correctos.

### 2.9 `type="text"` en campo de precio
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:124`
```tsx
<input type="text" name="price" />
```
El campo precio debería ser `type="number"` con `min="0"` y `step="0.01"` para activar validación nativa del browser y el teclado numérico en móviles.

### 2.10 Sin paginación en listados de platos
**Fichero:** `apps/menu-go/src/app/actions.ts:154`
```ts
const dishes = await prisma.dishes.findMany({ where: { configRestaurantId: ... } });
```
Sin `take` ni `skip`. Un restaurante con 200 platos carga todo de golpe.

---

## 3. UX / UI

### 3.1 Subida de imagen solo disponible al editar, no al crear
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:178`
```tsx
{dish && <Uploader dishId={dish.id} />}
```
El `Uploader` solo aparece cuando `dish` ya existe (edición). Al crear un plato nuevo, el usuario no puede subir imagen. Hay que crear el plato primero y luego editar — flujo confuso.

### 3.2 Sin estado vacío en el menú público
**Fichero:** `apps/menu-go/src/components/Menu/index.tsx`
Si el restaurante no tiene platos, el componente renderiza un contenedor vacío sin mensaje. Añadir un estado vacío descriptivo para el visitante.

### 3.3 El precio no muestra símbolo de moneda
**Fichero:** `apps/menu-go/src/components/Menu/dish.tsx` (inferido del schema)
No hay campo `currency` en el modelo `Dishes` ni en `ConfigRestaurant`. El precio se almacena como `Float` sin moneda. Para uso internacional o multi-divisa, añadir un campo `currency` (ISO 4217) al restaurante.

### 3.4 Sin indicador de disponibilidad de platos
**Fichero:** `packages/db/prisma/schema.prisma:78`
No existe campo `isAvailable` en `Dishes`. Un restaurante no puede marcar un plato como "agotado" o "temporalmente no disponible" sin borrarlo.

### 3.5 Sin orden configurable de platos y categorías
El orden de aparición en el menú público depende del orden de inserción en BD. No hay campo `sortOrder` en `Dishes` ni en `Category`. Los restaurantes no pueden reordenar su menú.

### 3.6 Navegación del panel sin estado activo visible
**Fichero:** `apps/menu-go/src/components/Panel/Nav/index.tsx`
Verificar que el enlace activo del panel de administración tiene estilos de selección claros (color, negrita, subrayado). La navegación del panel debería indicar en qué sección está el usuario.

### 3.7 Formulario de plato no tiene feedback de error específico
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:75-78`
El mensaje de error del server action es genérico (`"ERROO todo"`). El toast de error debería indicar qué falló: conexión BD, validación, etc.

### 3.8 Sin confirmación antes de eliminar plato/categoría
**Fichero:** `apps/menu-go/src/components/List/remove-modal.tsx`
Revisar si el modal de confirmación de borrado existe y tiene texto descriptivo que indique el nombre del elemento a eliminar (no solo "¿Confirmar borrado?").

---

## 4. Performance

### 4.1 QR generado en el servidor en cada creación de restaurante
**Fichero:** `apps/menu-go/src/app/actions.ts:104`
```ts
const url = await QRCode.toDataURL(...)
```
Se genera el QR completo (base64) en el momento de crear el restaurante. Podría generarse on-demand en el cliente o como imagen servida por una ruta de API, evitando almacenarlo en BD.

### 4.2 Sin `React.memo` / `useMemo` en lista de platos del menú
**Fichero:** `apps/menu-go/src/components/Menu/index.tsx:6`
La función `groupByCategory` se recalcula en cada render del componente. Siendo un server component actualmente no es un problema, pero si se convierte a cliente debería memorizarse.

### 4.3 Sin `loading.tsx` en rutas del panel
**Fichero:** `apps/menu-go/src/app/panel/`
Verificar si existe `loading.tsx` en las rutas del panel para mostrar skeleton mientras se cargan datos del servidor. Sin él, el usuario ve un flash de contenido vacío.

### 4.4 Imágenes sin dimensiones explícitas en algunos componentes
Revisar que todos los usos de `<Image>` de Next.js tienen `width` y `height` o usan `fill` con un contenedor de tamaño conocido, para evitar Cumulative Layout Shift (CLS).

### 4.5 `getAllCategories()` carga todas las categorías sin límite
**Fichero:** `apps/menu-go/src/app/actions.ts:193`
```ts
return prisma.category.findMany();
```
Sin paginación ni límite. Si las categorías crecen (son globales y cualquier restaurante puede añadir), esta query puede volverse costosa.

---

## 5. Seguridad

### 5.1 Sin autorización en server actions
**Fichero:** `apps/menu-go/src/app/actions.ts`
Las funciones `postDish`, `postRestaurant`, `addCategory` no verifican que el `userId` del formulario corresponde al usuario autenticado en sesión. Un usuario autenticado podría enviar el `userId` de otro usuario en el formulario.

```ts
// Patrón recomendado al inicio de cada action:
const session = await getServerSession(authOptions);
if (!session?.user?.id || session.user.id !== userId) {
  throw new Error('Unauthorized');
}
```

### 5.2 `OPENAI_API_KEY` sin protección de rate limiting
**Fichero:** `apps/menu-go/src/app/actions.ts:205`
La generación de imágenes con DALL-E 2 en `addCategory` no tiene rate limiting. Un usuario autenticado podría llamar al action en bucle y consumir todo el crédito de OpenAI.

### 5.3 Sin validación del tipo MIME en uploads
**Fichero:** `apps/menu-go/src/app/api/upload/` (inferido)
Verificar que el endpoint de upload valida que el fichero subido es efectivamente una imagen (MIME type + magic bytes) antes de almacenarlo en Vercel Blob.

### 5.4 `userId` temporal en demo expuesto en cliente
**Fichero:** `apps/menu-go/src/components/Forms/dishesForm.tsx:48`
```ts
localStorage.getItem('usedIdTemp')
```
El sistema de demo permite operar sin autenticación usando un ID temporal guardado en `localStorage`. Este mecanismo debería estar claramente separado del flujo autenticado y no debería permitir operaciones de escritura en producción.

---

## 6. Testing

### 6.1 Cobertura de tests mínima
**Fichero:** `apps/menu-go/__test__/`
Solo existen 2 ficheros de test (`category.test.tsx`, `dish.test.tsx`). No hay tests para:
- Server actions (`postDish`, `postRestaurant`, `addCategory`)
- Rutas de API (`/api/upload`, `/api/og`)
- Flujos de autenticación
- Componente `Menu` (renderizado público)
- Componente `DishesForm`

### 6.2 Sin tests de integración con BD
Los tests actuales probablemente usan mocks. Añadir tests de integración que usen una BD de test real (PostgreSQL en Docker) para verificar que las queries de Prisma funcionan correctamente, incluyendo el seed.

### 6.3 Sin tests E2E
No se detecta Playwright ni Cypress. Añadir tests E2E para los flujos críticos:
- Login con Google/Facebook
- Crear restaurante y generar QR
- Añadir categoría y plato
- Acceder al menú público via QR

---

## 7. SEO y Accesibilidad

### 7.1 Sin `lang` dinámico en el HTML según idioma activo
Verificar que el atributo `lang` del elemento `<html>` se actualiza cuando el usuario cambia entre `en` y `es` en la landing.

### 7.2 Sin `aria-label` en botones de icono
Botones que usan solo iconos (compartir, eliminar, editar) deberían tener `aria-label` o `sr-only` text para lectores de pantalla.

### 7.3 Metadata dinámica incompleta en ruta de menú
**Fichero:** `apps/menu-go/src/app/menu/[restaurantId]/`
Verificar que la ruta del menú público exporta `generateMetadata` con el nombre del restaurante como `title` y descripción personalizada. El OG image existe (`/api/og`) pero comprobar que está referenciado en el metadata.

### 7.4 Sitemap sin URLs de menús públicos
**Fichero:** `apps/menu-go/src/app/sitemap.ts`
El sitemap debería incluir las URLs de menús públicos (`/menu/[restaurantId]`) para indexación. Actualmente es probable que solo incluya rutas estáticas.

---

## 8. Developer Experience

### 8.1 Sin `.env.example`
No existe un fichero `.env.example` documentando todas las variables de entorno necesarias. Actualmente hay que leer el código para descubrir: `DATABASE_URL`, `NEXT_PUBLIC_SIE`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SECRET`, `OPENAI_API_KEY`.

### 8.2 README insuficiente para onboarding
El README no documenta: cómo levantar el entorno local completo (pnpm + Docker + Prisma migrate), cómo ejecutar seeds, ni las variables de entorno necesarias.

### 8.3 `console.log(e)` en manejo de errores
**Fichero:** `apps/menu-go/src/app/actions.ts:76,134`
```ts
} catch (e) {
  console.log(e);
```
Usar `console.error(e)` y considerar integrar un servicio de error tracking (Sentry) para capturar errores de producción con contexto.

### 8.4 Commitlint + semantic-release configurados pero sin documentación
El proyecto tiene `@commitlint/cli` y `semantic-release` instalados pero no hay documentación sobre el formato de commits esperado (`feat:`, `fix:`, `chore:`) ni cómo se generan las releases.

### 8.5 Sin `CHANGELOG.md` automatizado
Con `semantic-release` instalado, se podría generar un `CHANGELOG.md` automático en cada release.

---

## 9. Funcionalidades Nuevas (Roadmap)

### 9.1 Campo `isAvailable` en platos
Permitir que el restaurante marque platos como no disponibles temporalmente sin borrarlos.

### 9.2 Etiquetas dietéticas en platos
Añadir campo `tags` (array) en `Dishes` para: `vegetariano`, `vegano`, `sin_gluten`, `picante`, `alérgenos`, etc.

### 9.3 Horarios del restaurante
Añadir modelo `BusinessHours` relacionado con `ConfigRestaurant` para mostrar horarios de apertura en el menú público.

### 9.4 Soporte multi-moneda
Añadir campo `currency` (ISO 4217, ej: `EUR`, `USD`, `MXN`) en `ConfigRestaurant` para mostrar el precio formateado correctamente por región.

### 9.5 Múltiples restaurantes por usuario
El esquema ya soporta `ConfigRestaurant[]` por usuario. Implementar la UI del panel para gestionar múltiples restaurantes con un selector.

### 9.6 Vista previa del menú en el panel
Añadir un enlace "Ver menú como cliente" en el panel de administración que abra `/menu/[restaurantId]` en una nueva pestaña.

### 9.7 Descarga del QR como imagen PNG
Actualmente el QR se guarda como Data URL base64 en BD. Añadir un botón de descarga en el panel que genere y descargue el QR como archivo `.png` directamente.

### 9.8 Ordenación drag-and-drop de platos y categorías
Añadir campo `sortOrder: Int` en `Dishes` y `Category` para permitir reordenación manual mediante drag-and-drop en el panel.

---

## Resumen de Prioridades

| Prioridad | Item |
|-----------|------|
| 🔴 Crítico | 1.1 Mensaje de error hardcodeado · 1.2 Typo env var QR · 1.3 userId en localStorage sin validación · 5.1 Sin autorización en server actions |
| 🟠 Alto | 1.4 `useFormState` deprecated · 1.5 Categorías globales · 2.5 Sin validación Zod · 3.1 Upload solo en edición |
| 🟡 Medio | 2.2 Sin timestamps · 2.3 QR como base64 en BD · 2.9 Input precio tipo text · 3.4 Sin `isAvailable` · 6.1 Cobertura de tests |
| 🟢 Bajo | 8.1 .env.example · 8.2 README · 9.x Nuevas funcionalidades |
