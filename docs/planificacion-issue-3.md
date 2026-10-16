# Planificación del issue #3: Mostrar y guardar en el navegador las ciudades consultadas

**Referencia:** [Issue #3](https://github.com/hispafox/cielo-local/issues/3)

## 1. Resumen y objetivo

El issue pide conservar en `localStorage` las ciudades cuya previsión se haya consultado, mostrar la lista debajo del campo de búsqueda y permitir iniciar de nuevo la consulta al seleccionar una ciudad. La lista debe sobrevivir a una recarga en el mismo navegador, no debe sincronizarse con un servidor y debe permanecer oculta cuando no haya ciudades guardadas.

El objetivo de implementación es añadir ese historial local como una extensión pequeña del flujo de búsqueda existente, reutilizando la geocodificación, la selección de coincidencias y la consulta meteorológica actuales. No se requiere backend, base de datos ni una API nueva.

## 2. Alcance, exclusiones y criterios de aceptación

### Alcance

- Guardar una ciudad después de que su previsión se haya cargado correctamente.
- Recuperar la lista al iniciar la aplicación y mostrarla justo debajo del campo de búsqueda.
- Permitir activar una ciudad guardada con teclado o puntero y volver a iniciar el flujo de búsqueda existente.
- Ocultar el bloque completo cuando la lista esté vacía.
- Mantener la persistencia únicamente en el navegador mediante `localStorage`.

### Exclusiones

- No enviar ni sincronizar el historial con Open-Meteo ni con otro servidor; tampoco añadir backend o base de datos.
- No añadir cuentas, favoritos, caducidad, controles de borrado ni otras funciones de historial que el issue no solicita.
- No cambiar el contrato ni las peticiones meteorológicas existentes; seleccionar una ciudad guardada reutiliza el flujo actual.

### Criterios de aceptación del issue

1. Tras consultar una ciudad, aparece en la lista bajo el campo de búsqueda.
2. Tras recargar la página en el mismo navegador, la lista se recupera de `localStorage`.
3. Seleccionar una ciudad guardada inicia su consulta.
4. Si no hay ciudades guardadas, no se muestra una lista vacía.

Como detalle de implementación propuesto, se guardará una entrada cuando Forecast haya respondido y la respuesta haya pasado la validación vigente. Una búsqueda sin resultados, cancelada o fallida no se considerará una ciudad consultada con éxito.

## 3. Estado actual relevante del repositorio

**Hechos observados:**

- `index.html` contiene el formulario `#search-form`, el campo `#city-input` y la ayuda `#city-help`. La ayuda ya está asociada al campo mediante `aria-describedby`; no hay una región para las ciudades consultadas.
- `src/app.js` implementa el envío del formulario en `handleSearch`, consulta ubicaciones con `searchLocations`, muestra las coincidencias en `showLocationChoices` y obtiene la previsión en `loadForecast`. Una ubicación ambigua se resuelve con el selector existente. La aplicación mantiene la ubicación actual en memoria y no usa `localStorage`.
- `loadForecast` ya identifica el punto en que la petición concluye con éxito y la ubicación actual queda establecida; es el lugar adecuado para registrar una consulta completada, comprobando antes que la respuesta corresponde a la petición vigente.
- `src/weather-api.js` encapsula las peticiones y validaciones de Open-Meteo. No se aprecia necesidad de modificarlo para este issue.
- `styles.css` define estilos para el formulario, la ayuda (`.field-hint`), las listas de ubicaciones (`.location-list`) y los controles con foco visible. Se puede seguir esa convención para una lista compacta de ciudades recientes.
- `package.json` define `npm test` como `node --test`. Las pruebas actuales están en `tests/` y cubren módulos meteorológicos, horarios y el estado del flujo; no se observa un conjunto de pruebas DOM para la interfaz ni pruebas actuales de persistencia local.
- `docs/analisis-proyecto-y-arquitectura.md`, sección 3, excluye actualmente «favoritos persistentes, base de datos o historial». El issue introduce explícitamente una excepción acotada: historial local de búsquedas meteorológicas en el navegador, sin servidor.

## 4. Propuesta de solución y decisiones

### Propuesta

1. Añadir en `index.html`, inmediatamente después de la ayuda del campo y dentro del área del formulario de búsqueda, una sección semántica con título y lista. La sección empezará oculta y cada ciudad se representará como un botón de tipo `button`, para no enviar el formulario por accidente.
2. Añadir una pequeña capa de persistencia, preferiblemente en `src/recent-cities.js`, que lea, valide, añada y guarde entradas en `localStorage`. Mantenerla independiente del DOM facilita probarla con el ejecutor Node ya disponible.
3. Persistir solo información textual necesaria para volver a buscar y mostrar una ciudad (por ejemplo, etiqueta visible y consulta canónica con ciudad, región y país disponibles); no guardar previsiones ni coordenadas si basta con repetir la búsqueda geográfica. Tratar el contenido almacenado como no confiable: validar su estructura al leerlo y renderizar nombres con `textContent`.
4. Al cargar la aplicación, recuperar las entradas válidas. Renderizar la sección solo si existe al menos una y volver a ocultarla cuando no quede ninguna.
5. Tras una previsión válida y vigente en `loadForecast`, añadir o actualizar la ciudad y volver a renderizar la lista. Deduplicar por una clave normalizada y poner la consulta más reciente primero es la convención recomendada para evitar copias de una misma ciudad.
6. Al activar un botón, colocar la consulta guardada en el campo y enviar el formulario mediante el mecanismo de envío existente. Así se reutilizan sus estados de carga/error, la cancelación de peticiones y el selector de coincidencias ambiguas, en lugar de crear una ruta de consulta paralela.
7. Actualizar `docs/analisis-proyecto-y-arquitectura.md` para que la exclusión de historial no contradiga el alcance aprobado: dejar explícito que se admite el historial de ciudades consultadas solo en almacenamiento local del navegador, mientras siguen excluidos favoritos sincronizados, cuentas, backend y base de datos.

### Decisiones y supuestos

- Se propone registrar solo consultas meteorológicas completadas con éxito, no las búsquedas tecleadas ni las que terminan en error.
- Se propone conservar la última consulta primero y no añadir un límite arbitrario de elementos en esta implementación; el formato debe seguir siendo pequeño y sencillo.
- Al volver a buscar puede reaparecer el selector actual si el servicio devuelve varias coincidencias; no se eludirá la desambiguación ni se seleccionará una ubicación silenciosamente.
- Si `localStorage` no está disponible, contiene JSON dañado o falla una escritura, la aplicación debe seguir permitiendo búsquedas y no bloquear el renderizado. En ese caso no puede garantizarse persistencia; se debe evitar que el fallo de almacenamiento se presente como un fallo meteorológico.
- La incompatibilidad entre la exclusión general de historial de la especificación y este issue no es bloqueante: el issue concreta una excepción local, y el cambio de documentación propuesto mantiene ambas fuentes coherentes antes de implementar.

## 5. Plan de trabajo ordenado

1. **Alinear la especificación del producto.** Actualizar el apartado de alcance y, si procede, los criterios de aceptación de `docs/analisis-proyecto-y-arquitectura.md` para reflejar solo el historial local solicitado.
   **Dependencia:** ninguna. Debe preceder a la implementación para evitar que la especificación vigente la contradiga.
2. **Diseñar y probar la persistencia.** Crear `src/recent-cities.js` con lectura validada, serialización, deduplicación y manejo seguro de errores de almacenamiento. Añadir pruebas unitarias con un almacenamiento simulado, incluyendo una lectura posterior que represente la recarga.
3. **Añadir la interfaz accesible.** Incorporar el contenedor ocultable y sus botones en `index.html`, con estilos acordes al formulario en `styles.css`; conservar foco visible, nombres accesibles y operación por teclado.
4. **Conectar el flujo de aplicación.** Integrar la carga inicial y el renderizado de la lista en `src/app.js`; registrar solo la ubicación de una previsión vigente y exitosa; conectar los botones con el envío del formulario existente.
5. **Validar el recorrido completo.** Ejecutar las pruebas automatizadas existentes y las nuevas; realizar comprobaciones manuales en navegador para la interfaz, recarga, selección y casos de almacenamiento no disponible.

### Áreas previsiblemente afectadas

- `docs/analisis-proyecto-y-arquitectura.md` — coherencia de alcance con el nuevo requisito.
- `index.html` — región de ciudades consultadas debajo del campo.
- `src/app.js` — inicialización, renderizado, registro tras éxito y activación de una ciudad.
- `src/recent-cities.js` — **archivo nuevo propuesto** para persistencia y validación.
- `styles.css` — presentación responsive y estados de los elementos de la lista.
- `tests/recent-cities.test.js` — **archivo nuevo propuesto** para pruebas unitarias del almacenamiento.

No se prevé modificar `src/weather-api.js`: la selección guardada debe pasar por la búsqueda y las peticiones que ya existen.

## 6. Validación y pruebas previstas

- Ejecutar `npm test` para comprobar que las pruebas existentes siguen pasando junto con las nuevas. No se requiere usar la API en vivo.
- En `tests/recent-cities.test.js`, cubrir como mínimo:
  - almacenamiento vacío y recuperación de varias entradas válidas;
  - persistencia al volver a leer el valor serializado, simulando una recarga;
  - datos JSON inválidos o entradas con estructura/campos incorrectos;
  - deduplicación y orden de más reciente primero, según la convención propuesta;
  - errores de lectura/escritura de `localStorage` sin propagar una excepción que interrumpa la aplicación.
- Comprobación manual en navegador:
  1. Con almacenamiento vacío, confirmar que no aparece el contenedor ni una lista vacía.
  2. Consultar una ciudad y comprobar que aparece bajo el campo al completarse la previsión.
  3. Recargar en el mismo origen y comprobar que la entrada reaparece.
  4. Activar la entrada con teclado y con puntero; verificar que comienza la búsqueda y que las coincidencias ambiguas siguen requiriendo selección.
  5. Comprobar que errores/cancelaciones no se guardan como consultas exitosas y que almacenamiento dañado o no disponible no impide una búsqueda normal.
  6. Revisar en móvil y escritorio el orden bajo el campo, el foco visible y la ausencia de desbordamiento; confirmar que no se añadió ninguna petición o destino de sincronización distinto del flujo existente.

## 7. Riesgos, supuestos y preguntas abiertas

### Riesgos

- `localStorage` está limitado al origen y al navegador; limpiar los datos del sitio o cambiar de origen elimina o separa la lista. Esto coincide con el alcance local del issue, pero no es una copia de seguridad.
- El acceso al almacenamiento puede estar bloqueado o fallar por cuota; el fallo debe degradar solo la persistencia, no el servicio meteorológico.
- Una consulta canónica que siga siendo ambigua puede volver a mostrar el selector. El flujo existente debe conservar el control del usuario y no asociar una previsión a una ciudad incorrecta.
- El análisis de arquitectura vigente excluye el historial de manera general; debe corregirse esa frase de alcance conforme a la propuesta antes o durante la implementación.

### Supuestos

- «Ciudades consultadas» significa ubicaciones cuya previsión terminó de cargarse correctamente.
- La lista se limita al perfil y navegador actuales y no necesita exportación, sincronización ni datos meteorológicos almacenados.
- No se introduce un máximo de entradas ni una acción para borrar el historial, dado que el issue no los define.

### Preguntas abiertas (no bloqueantes)

- ¿Debe definirse un máximo de ciudades guardadas? La propuesta inicial es no imponer un límite de producto y guardar solo etiquetas/consultas breves.
- ¿Se confirma el orden de más reciente primero y la eliminación de duplicados como comportamiento esperado? Es la recomendación para que el historial resulte útil, pero el issue no los especifica.
- ¿Se desea una acción explícita para borrar ciudades en una iteración posterior? No está incluida en este issue.
