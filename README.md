# ATENDA · Fecha y hora de notas

Extensión para mostrar la fecha y hora de creación junto al autor de cada nota de ATENDA.

**Ejemplo:** `usuario · 16/10/2026 09:24:59`

Haz clic en la fecha y hora para copiarla. La hora se muestra tal como la entrega el servidor, sin cambiar la zona horaria.

## Chrome, Chromium y Edge

1. Abre `chrome://extensions` o `edge://extensions`.
2. Activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y selecciona la carpeta `extension`.
4. Recarga ATENDA y abre las notas.

Requiere Chromium/Chrome 111 o posterior, o Edge equivalente.

## Firefox

1. Abre `about:debugging#/runtime/this-firefox`.
2. Pulsa **Cargar complemento temporal**.
3. Selecciona `extension-firefox/manifest.json`.
4. Recarga ATENDA y abre las notas.

Requiere Firefox 140 o posterior. El complemento no está firmado: la carga es temporal y debes repetirla al reiniciar Firefox. Para instalarlo permanentemente necesita firma de Mozilla.

## Archivos

- `extension/`: versión para Chromium, Chrome y Edge.
- `extension-firefox/`: versión para Firefox.

Ambas carpetas contienen el mismo `notas.js`, con un manifiesto para cada navegador. Si cambias el código, actualiza ambos archivos.

La extensión procesa las respuestas de notas que la plataforma ya solicita. No guarda datos ni los envía a servicios externos. Al pulsar la fecha escribe solo esa fecha y hora en el portapapeles.

Si la plataforma cambia su estructura, puede ser necesario actualizar la extensión. Cuando varias notas tienen el mismo autor, descripción y fecha, omite la hora para evitar asociarla a la nota incorrecta.

Proyecto independiente, sin afiliación oficial con ATENDA. Licencia [MIT](LICENSE).
