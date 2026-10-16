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

## Paquetes y releases

Puedes descargar los ZIP para cada navegador desde [GitHub Releases](https://github.com/MarcosAvg/atendaplus/releases). En Chromium descomprime el ZIP y carga la carpeta. En Firefox selecciona el ZIP como complemento temporal. Las releases de Firefox no incluyen firma de Mozilla.

Para generar los paquetes localmente necesitas Node.js 22+ y Python 3.10+, sin dependencias adicionales:

```sh
node --check extension/notas.js
node tests/notas.test.cjs
python3 scripts/build.py
```

Se generan dos ZIP y `SHA256SUMS.txt` en `dist/v1.1.0/`, excluidos de Git. El script comprueba que coincidan las versiones y ambas copias de `notas.js`.

Para publicar una nueva release:

1. Actualiza `version` en ambos manifiestos, `CHANGELOG.md` y `RELEASE-NOTES.md`.
2. Ejecuta las pruebas anteriores y verifica la extensión en ambos navegadores. Las pruebas automatizadas usan un navegador simulado.
3. Haz commit y sube los cambios. Crea y sube el tag correspondiente (ejemplo para 1.1.0):

```sh
git add .
git commit -m "Prepare release 1.1.0"
git push origin main
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
```

El workflow **Release** verifica el tag, ejecuta las pruebas y publica ambos ZIP y sus sumas de comprobación. Requiere GitHub Actions habilitado; utiliza su `GITHUB_TOKEN`, sin tokens personales. Un push normal solo ejecuta **Validate** y genera artefactos de prueba. No publica en las tiendas ni solicita la firma de Mozilla.

Referencias: [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) y [firma de complementos Firefox](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Estructura

- `extension/`: versión para Chromium, Chrome y Edge.
- `extension-firefox/`: versión para Firefox.

Ambas carpetas contienen el mismo `notas.js`, con un manifiesto para cada navegador. Si cambias el código, actualiza ambos archivos.

La extensión procesa las respuestas de notas que la plataforma ya solicita. No guarda datos ni los envía a servicios externos. Al pulsar la fecha escribe solo esa fecha y hora en el portapapeles.

Si la plataforma cambia su estructura, puede ser necesario actualizar la extensión. Cuando varias notas tienen el mismo autor, descripción y fecha, omite la hora para evitar asociarla a la nota incorrecta.

Proyecto independiente, sin afiliación oficial con ATENDA. Licencia [MIT](LICENSE).
