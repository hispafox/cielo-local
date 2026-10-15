---
name: crap-diseno
description: "Revisa, explica y mejora interfaces visuales aplicando Contraste, Repetición, Alineación y Proximidad (CRAP). Úsalo para detectar incoherencias visuales, jerarquía débil, patrones inconsistentes, problemas de alineación o agrupación, y para corregir o auditar una interfaz web."
---

# Revisión de diseño con CRAP

Aplica los principios de Contraste, Repetición, Alineación y Proximidad para que una interfaz tenga jerarquía clara, consistencia y relaciones visuales comprensibles. Úsalo como marco de diagnóstico, no como una plantilla estética rígida.

## Cuándo usarlo

- Revisar o corregir una pantalla con elementos incongruentes o desalineados.
- Evaluar jerarquía visual, consistencia de estilos, agrupación o espaciado.
- Analizar una página a partir de su código, una captura o una vista ejecutándose en el navegador.
- Mejorar una interfaz existente sin cambiar su identidad, contenido ni comportamiento.

Si la solicitud pide solo una evaluación, informa los hallazgos y no edites archivos. Si pide implementar mejoras, realiza los cambios acotados y valídalos.

## Procedimiento

1. **Delimita la experiencia que se revisa.** Identifica la pantalla, los tamaños de vista pertinentes y el objetivo de usuario. Lee las instrucciones del proyecto y reutiliza sus tokens, componentes y convenciones existentes. En este repositorio, [el análisis del proyecto](../../../docs/analisis-proyecto-y-arquitectura.md) define el producto y la dirección visual de Cielo Local.
2. **Reúne evidencia.** Inspecciona el HTML, CSS y componentes relevantes. Si el usuario adjunta una captura, ábrela y trátala como evidencia de solo lectura; no afirmes que falta sin comprobarlo. Da prioridad al último mensaje y a la captura más reciente sobre una evaluación previa. Para cambios visuales de frontend, observa la página renderizada y, cuando haya herramientas disponibles, comprueba escritorio y móvil. Distingue un defecto reproducible de una preferencia estética.
3. **Identifica el estado y su dueño.** Determina si la apariencia depende de una preferencia global (claro/oscuro), del sistema operativo, de los datos o del contexto del contenido (por ejemplo, día/noche en la ubicación consultada). No llames «modo oscuro» a un estado contextual ni añadas un selector de tema si no se solicitó. En Cielo local, verifica si el fondo responde a `is_day` del destino o a la hora del dispositivo; los relojes local y de destino son datos distintos.
4. **Evalúa y anota los cuatro principios** en la pantalla y sus estados relevantes:
   - **Contraste:** comprueba que los elementos importantes se distingan de los secundarios mediante diferencias deliberadas de tamaño, peso, forma, color o espacio. Verifica legibilidad y contraste de texto; no comuniques significado solo con color.
   - **Repetición:** busca patrones consistentes en tipografía, color, espaciado, bordes, iconos, controles y estados. Reutiliza estilos y componentes existentes. Mantén las variaciones necesarias para que acciones, estados o niveles diferentes sigan siendo distinguibles.
   - **Alineación:** revisa ejes, márgenes, cuadrículas, líneas base y bordes compartidos entre títulos, contenido, controles y tarjetas. Alinea intencionalmente; no fuerces todos los elementos a un mismo eje si la composición tiene una razón clara.
   - **Proximidad:** agrupa elementos que comparten propósito y separa los grupos distintos con espacio y estructura. Comprueba que etiquetas, valores, controles y mensajes asociados se perciban juntos, también en pantallas estrechas.
5. **Prioriza los hallazgos.** Describe cada problema con su ubicación, principio implicado y efecto en la comprensión o uso. Prioriza los que dificultan encontrar, entender u operar contenido frente a los que son solo preferencias decorativas. No inventes defectos ni fuerces cambios para completar los cuatro principios; declara explícitamente cuando uno ya se cumple.
6. **Aplica la corrección mínima que resuelva la causa.** Ajusta primero los estilos, tokens o componentes existentes; evita duplicar reglas, introducir dependencias o rehacer zonas no relacionadas. Conserva contenido, funcionamiento, semántica, foco visible, teclado, lectores de pantalla y diseño responsive. Si hay varias soluciones con consecuencias de producto o identidad visual sustancialmente distintas, pregunta antes de elegir.
7. **Valida la experiencia resultante.** Ejecuta las comprobaciones existentes relevantes y vuelve a observar los estados y tamaños afectados. Comprueba jerarquía, consistencia, alineación, agrupación, accesibilidad y responsive. En contraste, mide los colores renderizados cuando sea posible: mínimo 4.5:1 para texto normal, 3:1 para texto grande y elementos gráficos relevantes. No cuentes una muestra de color fuente como medición de un fondo compuesto por transparencias. No afirmes una validación visual que no se haya realizado.
8. **Comunica el resultado con claridad.** Resume la evidencia y el cambio de cada principio CRAP, incluso cuando la decisión sea no cambiarlo, e indica qué estados/tamaños se observaron y qué validaciones no pudieron ejecutarse. Responde primero a la pregunta directa del usuario.

## Criterios de aplicación

- Los cuatro principios se complementan: un cambio de espaciado puede resolver proximidad y alineación a la vez.
- La repetición crea coherencia, no uniformidad absoluta; reserva el contraste para diferencias con significado.
- El espacio en blanco también organiza: no añadas bordes, colores o adornos si la separación ya es clara.
- Revisa la proximidad entre componentes hermanos además de la agrupación dentro de un componente: dos tarjetas con propósitos distintos que se tocan pueden parecer una sola superficie.
- Si el usuario vuelve a corregir la evaluación o aporta otra captura, inspecciona esa evidencia nueva y ajusta el diagnóstico; no repitas la conclusión anterior ni respondas con una lista de tareas ya hechas.
- Respeta la lectura y el orden semántico. La composición visual no debe ocultar relaciones ni cambiar el orden de interacción por teclado.
- Para Cielo Local, conserva la tarjeta meteorológica clara y atmosférica, la legibilidad de la banda de siete días en móvil y las decisiones de producto descritas en el análisis del proyecto.

## Referencia

La formulación de estos principios se inspira en [Diseñando con CRAP](https://isopixel.net/2007/08/07/disenando-con-crap/). Este skill resume los conceptos con palabras propias y los convierte en un flujo de revisión de interfaces.
