# Módulo de Firmas Electrónicas + API de Imágenes — README

Documento de todo lo que se construyó en esta entrega. El `README.md` original de la plataforma no se tocó.

---

## 1. Resumen ejecutivo

Se implementaron dos entregables nuevos, **sin modificar el backend NestJS**:

1. **Módulo de firmas electrónicas** con firma secuencial (comprador → vendedor → administrador), 3 métodos de firma, evidencia técnica por firma (fecha, hora, IP, hash SHA-256 encadenado), PDF final único con anexo de evidencia y verificación de integridad, conforme a la **Ley 527 de 1999**.
2. **API genérica de subida de imágenes** (fotos de casas, hoteles, etc.), independiente del módulo de firmas.

Todo vive en la carpeta **`api/`** (Express, puerto 4100) más archivos nuevos en el frontend. La única edición a código existente fueron **~13 líneas en 2 archivos** (ver §10), sin cambiar el comportamiento actual.

## 2. Estructura de carpetas creada

```
Inombiliaria_Software/
├── api/                                # NUEVA — Express + Mongoose, puerto 4100
│   ├── package.json                    # express, mongoose, multer 2.x, sharp, pdf-lib, cors, dotenv
│   ├── .env.example                    # MONGODB_URI, PORT, FRONTEND_URL, UPLOAD_DIR, límites
│   ├── .gitignore                      # node_modules, .env, uploads/
│   └── src/
│       ├── server.js                   # Express: CORS, JSON 10mb, routers, estáticos, errores
│       ├── db.js                       # mongoose.connect (misma BD que el backend Nest)
│       ├── firmas/
│       │   ├── model.js                # Schemas: AcuerdoFirma, Firma, Evidencia, Rechazo
│       │   ├── hash.js                 # SHA-256 canónico, cadena encadenada, tokens, IP
│       │   ├── clausulas.js            # Plantilla del contrato (espejo de Hoja.js) para el PDF
│       │   ├── pdf.js                  # pdf-lib: contrato + firmas + anexo evidencia + GridFS
│       │   ├── service.js              # crear, firmar (turnos), rechazar, verificar, PDF
│       │   └── routes.js               # 6 endpoints bajo /api/firmas
│       └── imagenes/                   # sub-api genérica (sin conexión con firmas)
│           ├── storage.js              # multer 2.x + sharp: valida, redimensiona ≤2048px
│           └── routes.js               # POST /subir, GET / (listado)
│
├── frontend/                           # SOLO archivos nuevos + 2 ediciones mínimas
│   ├── app/firma/[token]/page.js       # NUEVA ruta de firma (antes daba 404)
│   ├── app/firma/[token]/firma.css     # estilos propios del módulo + impresión
│   ├── components/firmas/
│   │   ├── FirmaFlujo.js               # orquestador: identidad + método + preview + condiciones
│   │   ├── FirmaTipografica.js         # método 1
│   │   ├── FirmaCanvas.js              # método 2
│   │   ├── FirmaImagen.js              # método 3
│   │   ├── FirmaEspacio.js             # slot de firma dentro del contrato
│   │   └── EvidenciaTabla.js           # tabla de evidencia técnica
│   ├── lib/normalizar.js               # normalización PNG 600×240 + quitar fondo
│   └── lib/apiFirmas.js                # cliente HTTP de la API de firmas
│
└── README_FIRMAS.md                    # este documento
```

**Archivos existentes modificados (2, ver §10):** `components/Hoja.js` y `components/ContratoForm.js`.

## 3. Los 3 métodos de firma

Todos producen la **misma salida**: `dataURL PNG 600×240 con fondo transparente`, vía `lib/normalizar.js` (recorta márgenes transparentes, escala manteniendo proporción con 16px de aire y centra).

### 3.1 Tipográfica — `FirmaTipografica.js`
- El usuario escribe su nombre (compartido con el formulario de identidad) y ve vista previa en vivo.
- 3 fuentes manuscritas (Caveat, Dancing Script, Great Vibes) cargadas desde Google Fonts con `<link>` inyectado.
- Se pinta en un canvas 900×360 (ajustando el tamaño de fuente si el nombre es largo) y se normaliza.
- Exporta PNG transparente.

### 3.2 A pulso (canvas) — `FirmaCanvas.js`
- **Pointer Events** + `setPointerCapture` + `touch-action: none`: funciona con mouse, touchpad y pantalla táctil.
- Escalado por `devicePixelRatio` (nítido en pantallas retina) y redibujo al cambiar el tamaño de ventana.
- Trazo suave con curvas cuadráticas (puntos medios); ancho variable sutil con `pressure` cuando el dispositivo lo soporta.
- Estado = array de trazos ⇒ botones **Limpiar** (vacía todo) y **Rehacer** (deshace el último trazo).
- Validación de no-vacío: sin trazos o si el resultado normalizado no tiene píxeles visibles, no se habilita “Firmar”.

### 3.3 Imagen — `FirmaImagen.js`
- Sube foto o escaneo; valida **formato (PNG/JPG)** y **tamaño máximo 5 MB**.
- Redimensiona a ≤1600 px de trabajo, **quita/aclara el fondo** con relleno por inundación desde los bordes (umbral de luminancia ajustable con slider de tolerancia; solo borra lo que toca el borde, preserva los blancos internos del trazo).
- Vista previa y botón **Reemplazar**.
- Exporta PNG transparente normalizado.

## 4. Flujo secuencial

```
en_firma ──(comprador firma)──► en_firma ──(vendedor firma)──► en_firma ──(admin firma)──► firmado (PDF congelado en GridFS, firmas bloqueadas)
                                              └─(admin rechaza con observaciones)──► rechazado (firmas previas conservadas como evidencia)
```

- Cada parte recibe un **enlace privado** `/firma/[token]` (32 bytes aleatorios, URL-safe, índice único).
- **El turno lo decide el servidor**: firmar con un token que no tiene el turno responde `409`. El frontend solo pinta el mensaje “Ahora le corresponde firmar a: …”.
- Al cerrar (3ª firma), el PDF se genera y se **congela en GridFS**; posteriores descargas sirven ese mismo archivo.
- Tras cerrar, cualquier intento de firmar responde `409` (bloqueo server-side).
- El administrador (orden 3) puede **rechazar con observaciones**; las firmas de comprador y vendedor se conservan como evidencia en el PDF del estado rechazado.

## 5. Modelo de datos (colección `acuerdosfirmas`, misma BD)

```js
AcuerdoFirma {
  inmueble,                      // referencia al inmueble (opcional)
  tipo: 'arriendo' | 'venta',
  datos: {...},                  // snapshot inmutable de los campos del contrato + fecha
  fechaContrato,                 // texto legible ("18 de octubre de 2026")
  estado: 'en_firma' | 'firmado' | 'rechazado',
  contratoHash,                  // SHA-256 del JSON canónico (claves ordenadas) de datos
  firmantes: [Firma],
  pdfGridId,                     // GridFS, solo al cerrar
  cerradoEn, rechazadoEn, timestamps
}
Firma {
  rol, orden (1|2|3), estado ('pendiente'|'firmada'|'rechazada'),
  token,                         // único e intransferible
  datos: { nombre, cedula, email },
  imagen,                        // dataURL PNG normalizado
  evidencia: { usuario, metodo, fecha (UTC), ip, userAgent,
               hashDocumento, hashAnterior, hashCadena },
  rechazo: { observaciones, fecha, ip }   // solo administrador
}
```

El PDF final se almacena en **GridFS** (bucket `pdfs`), no en disco local, para que sobreviva a despliegues con sistema de archivos efímero (Render).

## 6. Endpoints

### Firmas — `/api/firmas`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/acuerdos` | Crea acuerdo + 3 tokens; recibe `{inmueble, tipo, datos, firmantes:[{rol,nombre}×3]}` |
| GET | `/acuerdos/:id` | Estado del acuerdo (panel administrativo) |
| GET | `/t/:token` | Datos públicos para la pantalla de firma (contrato, turno, rol) |
| POST | `/t/:token/firmar` | `{datos:{nombre,cedula,email}, metodo, imagen, condiciones:true}` — valida turno en servidor |
| POST | `/t/:token/rechazar` | `{observaciones}` — solo orden 3, en su turno |
| GET | `/acuerdos/:id/verificar` | Recomputa todos los hashes → `{integro, contratoIntegro, cadenaIntegra, firmas[]}` |
| GET | `/acuerdos/:id/pdf` | Descarga el PDF (GridFS si está congelado; si no, se genera al vuelo) |

Errores de negocio: `400` validación, `403` rol, `404` enlace, `409` turno/bloqueo, `413` tamaño.

### Imágenes (genérica) — `/api/imagenes`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/subir` | multipart: campo `imagen` (PNG/JPG/WEBP ≤10 MB) + `tipo` opcional (casa/hotel/…). Valida magic bytes con sharp, redimensiona ≤2048 px |
| GET | `/?tipo=casa` | Listado (filtro opcional por prefijo de tipo) |

Las imágenes se sirven en `/archivos/:nombre`. **Sin conexión con el módulo de firmas**: la firma por imagen se envía como base64 al endpoint de firmas.

## 7. Evidencia técnica y validez legal (Ley 527 de 1999)

Por cada firma se registra: **usuario** (nombre, cédula, email), **método**, **fecha y hora** (UTC en BD, presentada en `America/Bogota`), **IP** (X-Forwarded-For detrás del proxy; socket.remoteAddress en local), userAgent y **huellas SHA-256**:

- `contratoHash` = SHA-256 del JSON canónico del contrato **al momento de crear el acuerdo**; se revalida en cada firma (si `datos` cambió, se rechaza).
- `hashDocumento` = el `contratoHash` congelado en el momento de firmar.
- `hashCadena` = SHA-256 encadenado: `sha256(hashDocumento | hashAnterior | rol | cédula)`. Alterar una firma invalida **toda la cadena posterior**.
- `GET /verificar` recomputa todo desde la BD: si alguien altera el snapshot o una huella, responde `integro: false`.

Encaje con la Ley 527 (mensajes de datos):
- Art. 5 y 7: el contrato + evidencia son mensajes de datos reproducibles y verificables; el endpoint de verificación lo demuestra de forma automática.
- Cada firma electrónica quedó asociada a la identidad del firmante y a su declaración de voluntad (casilla obligatoria de aceptación).
- El PDF final incluye un **anexo de evidencia** con todos los datos por firmante.

**Límite declarado (no es asesoría legal):** esto es una **firma electrónica simple**, no una firma digital certificada con PKI (Art. 9 Ley 527 / infraestructura de clave pública). La evidencia almacenada está lista para migrar a un certificado digital (GovCo, Cámara de Comercio, etc.) si se requiere valor probatorio reforzado. Sin autenticación de usuarios en la plataforma, la identidad la aporta el token + cédula auto-declarada: riesgo residual documentado como mejora futura.

## 8. PDF final e impresión

- **PDF del servidor** (`api/src/firmas/pdf.js`, pdf-lib, A4): cláusulas del contrato (espejo de `Hoja.js`), bloque de firmas con las imágenes PNG embebidas (140 px de ancho, proporcionales) y **anexo de evidencia** (tabla + hash del contrato + huellas encadenadas en Courier + nota Ley 527 + rechazo si existe).
- **Vista en navegador**: la ruta `/firma/[token]` renderiza el mismo componente `Hoja` con las firmas ya registradas incrustadas.
- **Impresión/PDF del navegador**: `window.print()` con el `@media print` existente (A4) más reglas nuevas en `firma.css` (oculta controles, conserva contrato y evidencia).
- **Antes de firmar**: impresión y descarga disponibles (PDF del navegador con espacios vacíos). **Después de cerrar**: PDF del servidor único con todo.

## 9. Instalación y arranque

Tres procesos (backend intacto + api nueva + frontend):

```bash
# 1. Backend NestJS (puerto 4000) — como siempre
cd Inombiliaria_Software/backend
npm install
cp .env.example .env   # pon tu MONGODB_URI
npm run start:dev

# 2. API de firmas + imágenes (puerto 4100) — NUEVA
cd Inombiliaria_Software/api
npm install
cp .env.example .env   # misma MONGODB_URI
npm run dev            # o npm start

# 3. Frontend (puerto 3000) — como siempre
cd Inombiliaria_Software/frontend
npm install
npm run dev
```

Variables relevantes de `api/.env`: `MONGODB_URI` (misma que el backend), `PORT=4100`, `FRONTEND_URL=http://localhost:3000`, `UPLOAD_DIR=uploads/imagenes`, `MAX_FIRMA_BYTES`, `MAX_IMAGEN_BYTES`.

En producción (Render/Vercel): desplegar `api/` como servicio Node más (build: `npm install`, start: `npm start`); en el frontend definir `NEXT_PUBLIC_API_FIRMAS=https://tu-api.onrender.com` (por defecto usa `http://localhost:4100`).

## 10. Archivos existentes modificados (los únicos)

| Archivo | Cambio | Líneas aprox. |
|---|---|---|
| `frontend/components/Hoja.js` | Prop opcional `firmas` (default `undefined` ⇒ render idéntico al anterior); los slots `.sig` usan `<FirmaEspacio>`; el bloque del administrativo solo se muestra cuando se pasa `firmas`; `S.fecha` congela la fecha del contrato | ~12 |
| `frontend/components/ContratoForm.js` | El botón “Enviar link para firma” llama a `crearAcuerdo` y muestra los 3 enlaces reales; se eliminó el link falso (`Math.random`) y el botón “Simular firma” | ~10 |

**No se tocó:** backend NestJS (0 archivos), `lib/api.js`, `globals.css`, `page.js`, catálogo, login, `Detalles.js`, etc.

## 11. Pruebas realizadas (checklist E2E)

Ejecutado con `mongodb-memory-server` contra el `service.js` real (14 aserciones, todas OK):

1. Mongo en memoria OK.
2. Acuerdo crea 3 tokens.
3. Firmar fuera de turno → `409` (“Ahora le corresponde firmar a: comprador”).
4. Firmar sin aceptar condiciones → `400`.
5. Comprador firma (canvas) → turno pasa a vendedor.
6. Vendedor firma (tipográfica) → turno pasa a administrador.
7. Acuerdo paralelo (arriendo): admin **rechaza** con observaciones → estado `rechazado`, observaciones registradas.
8. Admin firma (imagen) → estado `firmado`, PDF disponible.
9. Firmar con acuerdo cerrado → `409` (bloqueadas).
10. Verificar integridad → `integro: true`, 3/3 firmas verificadas.
11. Verificar acuerdo rechazado → `integro: true` (2/3 firmas + rechazo).
12. Alterar el contrato en BD → verificación responde `integro: false`.
13. PDF descargado desde GridFS (19 KB, cabecera `%PDF-`).
14. Token falso → `404`.

Además: `sharp` redimensiona y rechaza archivos corruptos; `next build` compila con la nueva ruta `/firma/[token]` (8.43 kB) y la portada intacta.

## 12. Limitaciones y mejoras futuras

- **Autenticación**: no hay login en la plataforma; la identidad se aporta en el enlace. Mejora: JWT/ magic links por email.
- **Firma digital certificada**: migrar a PKI (GovCo / Cámara de Comercio) para valor probatorio reforzado.
- **Notificaciones**: los enlaces se copian a mano; falta envío automático por correo (SMTP/SendGrid).
- **Storage de imágenes**: `api/uploads/` es local (efímero en Render). Mejora: Cloudinary/S3/GridFS.
- **Firmas de codeudores**: en arriendo, los codeudores no firman por separado (solo aparecen en el contrato); el flujo de 3 firmas es comprador/arrendador → vendedor/arrendatario → administrador.
- **Reintento de acuerdo rechazado**: actualmente se crea un nuevo acuerdo; no hay “reabrir el mismo”.
