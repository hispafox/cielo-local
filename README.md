# Cielo local

Aplicación web estática para buscar una ciudad y consultar las condiciones actuales y la previsión meteorológica de los próximos siete días. La interfaz está en español y adapta la tarjeta de previsión a pantallas de escritorio y móvil.

## Funcionalidad

- Búsqueda de ciudades por nombre y elección de ubicación cuando hay varias coincidencias.
- Previsión actual con temperatura, sensación térmica, humedad, viento y precipitación.
- Previsión diaria de hasta siete días, con máximas, mínimas y probabilidad de precipitación.
- Previsión de temperaturas hora a hora para las próximas 12 horas, con máximas y mínimas del periodo.
- Reloj analógico de la hora local del navegador y reloj de la ubicación consultada, con segundos y lectura textual.
- La hora de destino utiliza la zona IANA devuelta por Forecast; no requiere permisos de ubicación ni una consulta adicional.
- Cambio entre Celsius y Fahrenheit sin volver a consultar la API.
- Estados de carga, búsqueda sin resultados y errores de conexión/API.
- Diseño responsive, navegación por teclado y atribución visible a la fuente meteorológica.
- Versión actual de la aplicación visible en el pie de página.

## Ejecutar localmente

No hace falta instalar dependencias para servir la aplicación. Desde la carpeta raíz del proyecto, inicia un servidor estático:

```powershell
python -m http.server 8000
```

Abre `http://localhost:8000` en el navegador. También puedes usar la extensión Live Server de VS Code. No abras `index.html` directamente con `file://`: los módulos JavaScript necesitan servirse por HTTP.

## API y condiciones de uso

La aplicación consulta directamente dos servicios de Open-Meteo:

1. [Geocoding API](https://open-meteo.com/en/docs/geocoding-api), para resolver el nombre de la ciudad y mostrar posibles coincidencias.
2. [Forecast API](https://open-meteo.com/en/docs), para consultar el tiempo por latitud y longitud.

El MVP no requiere clave API ni backend. La API gratuita de Open-Meteo está destinada a uso no comercial, tiene un límite publicado de 10.000 llamadas al día y no ofrece garantía de disponibilidad. Los datos requieren atribución bajo la licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); la aplicación incluye el crédito. Revisa las [condiciones y planes actuales](https://open-meteo.com/en/pricing) antes de publicar. Para uso comercial o un proveedor que exija una clave, utiliza el plan/proveedor adecuado y guarda cualquier secreto en un backend, nunca en el navegador.

Al buscar, el nombre de la ciudad se envía al servicio de geocodificación; después se consultan las coordenadas elegidas al servicio meteorológico. La hora de destino usa `timezone` de esa misma respuesta Forecast, y el reloj local usa el huso horario del navegador. La aplicación no usa GPS ni solicita permisos de ubicación. Guarda en el almacenamiento local del navegador los nombres y consultas de las ciudades cuya previsión se ha cargado correctamente, para mostrar el historial después de recargar. Ese historial no se envía ni se sincroniza con ningún servicio; al seleccionar una ciudad guardada, su consulta se vuelve a enviar a Geocoding mediante el flujo de búsqueda habitual. No se guardan datos de la previsión.

## Pruebas

Se necesita Node.js 18 o posterior. Las pruebas usan el ejecutor integrado de Node y respuestas simuladas; no llaman a las API reales. También comprueban la previsión horaria, las zonas horarias y el cambio horario:

```powershell
npm test
```

No hay dependencias npm de producción ni es necesario ejecutar `npm install`.

## Diseño responsive y accesibilidad

- En pantallas amplias, la tarjeta muestra los siete días en una fila.
- En móvil, los datos actuales pasan a una cuadrícula compacta y la previsión semanal se desplaza horizontalmente para mantener legibles las siete jornadas.
- La previsión de las próximas 12 horas se desplaza horizontalmente en pantallas estrechas e incluye las máximas y mínimas del periodo.
- Los relojes permanecen visibles junto a la previsión; en móvil se adaptan o apilan. Cada esfera tiene un nombre y una lectura textual accesible, sin anuncios automáticos por segundo.
- El formulario funciona con Enter y botón; los controles tienen etiquetas y foco visible, y los cambios de estado se anuncian a tecnologías de asistencia.
- La tarjeta utiliza fondos e iconos locales; no depende de la imagen de referencia como recurso de la interfaz.

## Estructura

```text
README.md
package.json
favicon.svg
index.html
styles.css
src/
  app.js
  weather-api.js
  weather-codes.js
  time-utils.js
  weather-utils.js
tests/
  weather-api.test.js
  weather-codes.test.js
  time-utils.test.js
  weather-utils.test.js
docs/
  analisis-proyecto-y-arquitectura.md
.github/
  copilot-instructions.md
  skills/
    commit-messages/
      SKILL.md
    versionado-semantico/
      SKILL.md
```

Consulta el [análisis del proyecto y la arquitectura](docs/analisis-proyecto-y-arquitectura.md) y las [instrucciones de Copilot](.github/copilot-instructions.md) para conocer el alcance y los criterios del MVP. La captura visual usada como referencia durante el desarrollo no se distribuye en este repositorio; el análisis conserva su descripción textual.
