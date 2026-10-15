# Planificación del issue #1: Añadir relojes analógicos para la hora local y la hora de la ubicación consultada

**Referencia:** issue #1 — estado OPEN.

## 2. Resumen y objetivo

Añadir, junto a la previsión, dos relojes analógicos redondos: uno para la hora local del navegador y otro para la hora de la ubicación meteorológica elegida. La hora de destino debe proceder exclusivamente de la zona IANA `timezone` de la respuesta de Open-Meteo Forecast solicitada con `timezone=auto`; no se debe deducir del nombre de la ciudad ni añadir una consulta.

Los relojes deben avanzar mientras la página esté abierta, mostrar también una hora textual accesible y adaptarse a escritorio y móvil. La hora local no requiere conocer la ubicación de la persona. El reloj de destino debe quedar explícitamente sin ubicación durante una búsqueda pendiente, ambigua o fallida, sin conservar el valor de una consulta anterior.

## 3. Alcance, exclusiones y criterios de aceptación

### Alcance

- Mostrar las esferas con las etiquetas **«Hora local»** y **«Hora en {ubicación seleccionada}»**.
- Obtener la zona local del entorno del navegador y la hora de destino de `timezone` en la respuesta de previsión.
- Actualizar manecillas y hora textual con precisión de segundos y permitir que cada zona aplique sus cambios estacionales.
- Mantener visible y actualizado el reloj local antes de una selección y durante búsquedas o errores; presentar un estado explícito para el reloj de destino hasta disponer de una previsión válida.
- Integrar los relojes en el estilo atmosférico actual, con contraste, diseño responsive y accesibilidad por teclado/lector de pantalla.
- Actualizar la especificación del MVP y las instrucciones de validación del proyecto para incluir esta ampliación.

### Exclusiones

- No añadir geolocalización, solicitudes de permiso, búsqueda automática por GPS ni coordenadas de la persona usuaria.
- No inferir la zona horaria desde el nombre de ciudad, la abreviatura de zona ni un desplazamiento UTC, ni hacer una petición adicional.
- No añadir frameworks, backend o dependencias salvo que una necesidad concreta descubierta durante la implementación lo justifique.

### Criterios de aceptación

1. Se ven dos esferas redondas y etiquetadas, con la ubicación seleccionada en el nombre del reloj de destino.
2. La hora local coincide con la del sistema/navegador sin geolocalización ni permisos.
3. La hora de destino utiliza la zona IANA devuelta por Forecast para las coordenadas elegidas y refleja cambios estacionales; no se basa solo en el offset UTC actual.
4. Ambos relojes avanzan de forma útil y representan correctamente horas, minutos y segundos.
5. El reloj de destino no conserva datos durante una nueva búsqueda ni tras un error; el reloj local sigue funcionando.
6. Cada reloj tiene un nombre accesible y una representación textual de su hora para tecnologías de asistencia; el significado no depende solo de las manecillas.
7. El diseño funciona en escritorio y móvil, conserva contraste y muestra foco visible en los controles que se incorporen.
8. Las pruebas comprueban formato por zona IANA y horario estacional con datos/relojes controlados, sin depender de Open-Meteo en vivo.
9. Se actualizan el análisis/arquitectura y las instrucciones de validación para reflejar el nuevo alcance del MVP.

## 4. Estado actual relevante del repositorio

Los siguientes son hechos observados en el worktree aislado `F:\w\repos\DemoTiempo-issue-1` (rama `issue/1`, según el contexto de la solicitud):

- `.github/copilot-instructions.md` define una aplicación estática en español con HTML semántico, módulos JavaScript nativos, CSS local, validación de respuestas y pruebas automatizadas sin API en vivo. También indica que el análisis de arquitectura es la especificación del MVP y debe actualizarse cuando cambie el producto.
- `docs/analisis-proyecto-y-arquitectura.md` describe el MVP de búsqueda meteorológica y ya excluye explícitamente la búsqueda automática por GPS. Documenta Forecast con `timezone=auto`, pero no contempla relojes ni incorpora `timezone` al modelo funcional del producto.
- `index.html` contiene el formulario, los estados de búsqueda y `#weather-view`, inicialmente oculto, con la tarjeta atmosférica y la previsión semanal. No contiene relojes.
- `src/weather-api.js` ya envía `timezone=auto` a Forecast y valida los campos meteorológicos normalizados, pero no valida ni devuelve `payload.timezone`.
- `src/app.js` coordina la búsqueda, cancela solicitudes obsoletas y `clearPreviousResults()` oculta la previsión y limpia la ubicación y el tiempo actuales. No hay temporizador ni ciclo de renderizado de relojes.
- `src/weather-utils.js` contiene funciones puras de conversión de temperatura y formato de fechas con `Intl`; todavía no tiene utilidades para formato horario por zona.
- `styles.css` define la tarjeta atmosférica, estilos adaptables a móvil y foco visible para controles existentes. No hay estilos de esfera analógica.
- `tests/weather-api.test.js` simula las respuestas de Forecast, actualmente sin `timezone`. `tests/weather-utils.test.js` cubre conversión de temperaturas y formato de días. Las pruebas usan el ejecutor integrado de Node.
- `package.json` ofrece `npm test` (`node --test`) sin dependencias npm. `README.md` resume las funciones y estructura actuales y documenta cómo ejecutar las pruebas.
- El destino `docs/planificacion-issue-1.md` no existía al inspeccionarlo.

## 5. Propuesta de solución y decisiones que haya que tomar

### Propuesta

- Incorporar un bloque de relojes junto a la tarjeta de previsión, con presentación coherente con sus superficies, tipografía y paleta. Mantenerlo independiente del contenido meteorológico que se oculta durante las búsquedas: así puede seguir mostrándose la hora local desde el inicio y mientras no haya una ubicación válida.
- Implementar las esferas con elementos HTML/SVG/CSS accesibles y estilables, y proporcionar una lectura textual de hora para cada reloj. La lectura textual debe exponerse a lectores de pantalla sin convertir cada actualización de segundo en un anuncio intrusivo.
- Extraer funciones puras para obtener hora/partes y posición de manecillas a partir de un instante explícito y una zona IANA. Usar `Intl.DateTimeFormat` con `es-ES` y `timeZone`; derivar la esfera y el texto del mismo instante para que no discrepen. No calcular la hora de destino sumando offsets.
- Ampliar el objeto normalizado de Forecast con la zona horaria validada devuelta por `payload.timezone`. Validarla con las capacidades de `Intl` del navegador; no sustituirla por `utc_offset_seconds` ni por la zona del dispositivo. La respuesta de prueba simulada deberá incluir una zona real válida.
- Mantener un único ciclo de actualización por segundo mientras la página esté abierta, compartiendo el instante de cada actualización entre los dos relojes. La hora local se basa en la zona del navegador; la de destino solo se activa cuando una respuesta válida corresponde a la búsqueda vigente.
- Integrar el estado con el flujo de búsqueda y su cancelación existente. Al comenzar una búsqueda, al esperar una selección ambigua o al fallar la carga, limpiar el reloj de destino y mostrar un mensaje/placeholder explícito. Las verificaciones existentes de `requestId` y `AbortController` deben impedir que una respuesta obsoleta reactive una zona anterior.
- Mantener la zona como identificador IANA de la respuesta (por ejemplo, `Europe/Madrid`) y permitir que `Intl` resuelva la hora de cada instante, de modo que el cambio estacional no dependa de una compensación fija.
- Actualizar `docs/analisis-proyecto-y-arquitectura.md` para incorporar estos relojes al objetivo, alcance del MVP, contrato de Forecast, arquitectura, accesibilidad, criterios de aceptación y verificación; conservar GPS como exclusión. Actualizar `.github/copilot-instructions.md` con las convenciones para probar formato por zona y horario estacional con reloj/datos controlados. Revisar también las funciones y estructura de `README.md` para que describan los relojes y cualquier módulo nuevo.

### Decisiones propuestas

- Presentar los relojes en una sección compacta próxima a la tarjeta meteorológica y conservar esa sección visible incluso cuando la previsión esté oculta. En móvil, apilar o ajustar las dos esferas sin reducir su legibilidad.
- Usar un módulo puro nuevo, previsiblemente `src/time-utils.js`, y su prueba `tests/time-utils.test.js`, para evitar mezclar la geometría/formato de relojes con la conversión de temperaturas y fechas meteorológicas. Si la implementación demuestra que la utilidad cabe mejor en `weather-utils.js`, mantener las mismas garantías y pruebas sin duplicar lógica.
- Si `timezone` falta o no es aceptable por `Intl`, no presentar una hora de destino calculada por aproximación. La interfaz debe exponer el estado no disponible del reloj de destino.

### Pregunta abierta no bloqueante

- El issue no determina si una respuesta meteorológica con campos meteorológicos válidos pero `timezone` ausente/no válida debe invalidar toda la previsión o permitir mostrar la previsión con el reloj de destino marcado como no disponible. Propuesta: conservar la previsión si los datos meteorológicos pasan su validación actual y dejar explícitamente no disponible el reloj; no mostrar un valor horario inventado.

## 6. Plan de trabajo ordenado

1. **Acordar el contrato de la zona horaria y del estado no disponible.** Confirmar que `timezone` será obligatorio para activar el reloj de destino y resolver la pregunta abierta sobre el tratamiento de una respuesta sin zona válida. No requiere cambios de API: Forecast ya se solicita con `timezone=auto`.
2. **Ampliar y probar la normalización de Forecast.** En `src/weather-api.js`, extraer y validar la zona del payload sin inferirla; actualizar el fixture de `tests/weather-api.test.js` y añadir casos para zona válida y datos ausentes/no válidos. Esta tarea precede al renderizado del reloj de destino.
3. **Añadir utilidades deterministas de reloj.** Crear o ubicar en `src/time-utils.js` funciones puras que, dado un `Date` controlado y una zona, produzcan texto localizado y datos de manecillas. Añadir `tests/time-utils.test.js` con casos de avance de segundos y cambios estacionales por zonas IANA.
4. **Añadir la estructura semántica y los estados en `index.html` y `src/app.js`.** Integrar un bloque visible desde el inicio, renderizar hora local y estado pendiente para destino, enlazar la zona únicamente con el resultado meteorológico vigente y limpiar el destino al iniciar/bloquear/fallar una búsqueda. Conservar el ciclo local independientemente de la previsión.
5. **Conectar actualización y renderizado.** Mantener un único temporizador/ciclo de actualización, alimentar ambos relojes con el mismo instante, actualizar la hora textual y las manecillas, y evitar que solicitudes anteriores cambien la zona activa.
6. **Dar estilo responsive y accesible.** En `styles.css`, implementar esferas redondas legibles, superficies y contraste coherentes con la tarjeta, disposición móvil y foco visible si hay controles asociados. Revisar nombres accesibles y que el estado sea comprensible sin depender de la posición visual.
7. **Actualizar documentación del producto y validación.** Incorporar las reglas en `docs/analisis-proyecto-y-arquitectura.md` y `.github/copilot-instructions.md`; sincronizar las funciones/estructura de `README.md` si cambian.
8. **Ejecutar pruebas y revisión de interfaz.** Completar la validación automatizada y comprobar los estados de búsqueda, accesibilidad y disposición en escritorio/móvil, sin llamadas reales a Open-Meteo.

Las tareas 2 y 3 pueden desarrollarse en paralelo tras acordar el contrato; las tareas 4 y 5 dependen del modelo normalizado de Forecast y de las utilidades horarias. El estilo puede prepararse en paralelo con el trabajo de interfaz una vez fijada la estructura semántica.

## 7. Validación y pruebas previstas

- Ejecutar `npm test` (script existente: `node --test`) y comprobar que todas las pruebas utilizan datos simulados, nunca la API en vivo.
- En las pruebas de `weather-api`, comprobar que el resultado normalizado conserva la zona válida de Forecast y que una zona ausente/no válida no se convierte en offset o zona inferida.
- En pruebas con instantes inyectados/controlados, verificar formato de `es-ES` para zonas IANA distintas, avance de segundos/manecillas y al menos un cambio estacional en una zona que lo observe. Incluir una zona sin cambio estacional como control si resulta útil.
- Probar transiciones de estado: carga inicial, nueva búsqueda, selección ambigua, error y respuesta obsoleta/cancelada. Confirmar que el reloj local permanece activo, que el reloj de destino no conserva la zona anterior y que solo la respuesta vigente lo habilita.
- Revisar que no se invoca geolocalización ni se solicitan permisos y que el cambio de hora no añade peticiones a Forecast.
- Hacer una comprobación manual en navegador de contraste, lectura con tecnología de asistencia, ausencia de anuncios excesivos por segundo, foco visible, esferas redondas y ajuste en escritorio/móvil.

## 8. Riesgos, supuestos y preguntas abiertas

### Riesgos

- La interfaz o el conjunto de zonas admitidas por `Intl` puede variar entre motores. La validación debe fallar de forma explícita para el reloj de destino; nunca degradar silenciosamente a UTC o a un offset fijo.
- Actualizar un lector de pantalla cada segundo puede resultar intrusivo. La representación textual debe estar accesible sin emitir anuncios continuos no solicitados.
- El temporizador y las búsquedas asíncronas podrían reactivar una zona antigua si no se coordinan con el identificador de solicitud actual. Debe existir una única fuente de verdad para la zona activa.
- Los cambios horarios pueden producir saltos o repeticiones locales de hora; se debe confiar en `Intl` y en la zona IANA, no asumir incrementos horarios uniformes.

### Supuestos

- `timezone=auto` seguirá devolviendo en Forecast una zona horaria utilizable como IANA para las coordenadas consultadas.
- El formato horario visible incluirá segundos, tal como requieren los criterios de avance y representación textual; el estilo exacto de esfera/manecillas queda a criterio del diseño existente.
- «Junto a la previsión» permite una sección propia contigua a la tarjeta, necesaria para mantener la hora local visible cuando la tarjeta meteorológica se oculta en búsquedas o errores.

### Preguntas abiertas

1. Ante campos meteorológicos válidos pero `timezone` ausente o inválida, ¿se conserva la previsión y se marca solo el reloj de destino como no disponible (propuesta), o se considera inválida toda la respuesta?
2. ¿Se desea alguna preferencia de presentación de hora (12/24 horas)? El issue exige español y precisión de segundos, pero no fija ciclo horario; mientras no se decida, usar el formato localizado `es-ES`.
