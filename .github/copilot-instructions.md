# Instrucciones del proyecto

## Fuente de verdad

- Usa [el análisis del proyecto y la arquitectura](../docs/analisis-proyecto-y-arquitectura.md) como especificación del MVP: alcance, API, criterios de aceptación y decisiones técnicas.
- Usa la descripción textual de la referencia visual en el [análisis del proyecto y la arquitectura](../docs/analisis-proyecto-y-arquitectura.md) para orientar la composición y el ambiente de la tarjeta. La captura original no se distribuye en este repositorio; no reutilices marcas ni conviertas textos o temperaturas de ejemplo en datos de la aplicación.
- Si un cambio modifica una decisión del producto, actualiza también el análisis para mantener ambas fuentes coherentes.

## Stack y arquitectura

- Mantén la aplicación como sitio estático con HTML semántico, JavaScript nativo en módulos y CSS local. No añadas framework, backend, base de datos ni dependencias innecesarias.
- Tailwind es opcional: si se adopta, compílalo como parte del build; no uses su CDN en producción.
- Mantén separadas las peticiones meteorológicas, la traducción de códigos WMO, las funciones puras de unidades/fechas y la lógica de interfaz, siguiendo la estructura existente del proyecto.

## Comportamiento y datos

- La interfaz y sus mensajes deben estar en español (`es-ES`); formatea fechas con `Intl.DateTimeFormat`.
- Usa un formulario real para que la búsqueda funcione tanto con Enter como con el botón. No consultes las API en cada pulsación; exige al menos dos caracteres y permite elegir ubicación cuando haya coincidencias ambiguas.
- Usa Open-Meteo Geocoding para resolver la ciudad y Open-Meteo Forecast para consultar por las coordenadas elegidas. Construye parámetros con `URLSearchParams` y utiliza HTTPS.
- Muestra las condiciones actuales y siete días de previsión. Usa Celsius por defecto y permite cambiar a Fahrenheit convirtiendo en el cliente todas las temperaturas (actual, sensación térmica, máximas y mínimas), sin otra petición a la API.
- Traduce los códigos meteorológicos WMO desde una única correspondencia. Renderiza solo datos recibidos y validados; nunca uses valores de la imagen de referencia como valores predeterminados.

## Diseño y accesibilidad

- Sigue la tarjeta clara y atmosférica descrita en el análisis: ubicación y condiciones actuales, temperatura destacada, máximas/mínimas, selector de unidades y banda de siete días. En móvil, la previsión debe seguir siendo legible y desplazable.
- Usa gradientes e iconografía propia CSS/SVG; conserva buen contraste y no comuniques las condiciones solo mediante color.
- Mantén controles etiquetados, foco visible, operación completa con teclado y estados anunciados con `aria-live`. El selector `°C`/`°F` debe exponer su estado accesiblemente.

## Robustez, seguridad y atribución

- Presenta estados explícitos de carga, sin resultados y error. Valida respuestas HTTP y su estructura; cancela peticiones obsoletas y no muestres previsiones antiguas como actuales.
- Trata nombres y otros datos de las API como texto (`textContent`), no como HTML sin escapar.
- No incluyas claves secretas en el cliente ni en el repositorio. Si un proveedor futuro requiere una clave, usa un backend o función serverless y almacénala en el servidor.
- Incluye un crédito visible y enlazado a Open-Meteo. Revisa límites, licencia y condiciones de uso antes de publicar, especialmente para uso comercial.

## Validación

- Antes de cambiar código, inspecciona la estructura, dependencias y pruebas existentes; sigue sus convenciones y no inventes comandos de build o test.
- Añade o ajusta pruebas focalizadas para lógica de unidades, fechas y códigos WMO. Simula las respuestas HTTP en pruebas automatizadas en vez de depender de la API en vivo.
- Ejecuta la validación existente más acotada que cubra el cambio y comunica cualquier comprobación que no se haya podido ejecutar.
