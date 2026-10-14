---
name: versionado-semantico
description: "Analiza los cambios de la aplicación y aplica el incremento MAJOR.MINOR.PATCH correcto. Es el primer paso antes de invocar el skill de mensajes de commit o crear un commit con cambios de la aplicación."
---

# Versionado semántico de la aplicación

Determina el impacto de los cambios previstos para el commit y mantiene sincronizada la versión que se muestra en la aplicación.

## Orden de ejecución

Este skill debe ejecutarse como una etapa independiente antes de invocar el skill de mensajes de commit. Cuando una solicitud incluya preparar un mensaje para cambios de la aplicación, completa primero este flujo; después, y solo entonces, invoca el skill de mensajes de commit si hace falta redactarlo.

## Cuándo ejecutarlo

- Ejecútalo antes de invocar el skill de mensajes de commit para los cambios de la aplicación.
- Ejecútalo antes de crear un commit que vaya a subirse. No modifiques commits ya creados al hacer `push`.
- Si solo se está preparando un mensaje, aplica las reglas de alcance del skill de mensajes de commit: usa los cambios preparados y no incluyas cambios sin preparar salvo que el usuario indique que formarán parte del commit.

## Procedimiento

1. Determina qué cambios formarán parte del commit. Revisa `git status --short`, `git diff --cached` y, solo cuando corresponda, `git diff` y el contenido de los archivos nuevos. No deduzcas el impacto solo por los nombres de archivo o por el mensaje de commit.
2. Si no hay cambios identificables, no inventes un incremento. Si no puedes determinar el alcance del commit o no estás en un repositorio Git, detente y pide la información necesaria.
3. Clasifica los cambios de la aplicación por su impacto más alto:
   - **MAJOR**: rompe compatibilidad o impide un flujo de uso que antes estaba soportado.
   - **MINOR**: añade una capacidad o funcionalidad de usuario compatible con lo existente.
   - **PATCH**: corrige un defecto o hace una mejora menor y compatible, por ejemplo de interfaz, accesibilidad o rendimiento.
   - **Sin incremento**: cambios exclusivamente de documentación, pruebas, comentarios, formato, refactorización interna o herramientas que no cambien el comportamiento de la aplicación.
   Si hay varios impactos, aplica solo el incremento más alto: MAJOR sobre MINOR sobre PATCH. Si la clasificación depende de una intención que no se puede determinar a partir de los cambios, pregunta antes de continuar.
4. La fuente de verdad de la versión visible es el texto `Versión MAJOR.MINOR.PATCH` del pie de página en [index.html](../../../index.html). Exige una única coincidencia con tres componentes numéricos SemVer. Si falta, aparece más de una vez o tiene otro formato, no la normalices ni edites por conjetura: pregunta al usuario.
5. No cuentes una modificación existente del número de versión como un cambio funcional ni la incrementes por segunda vez. Si el conjunto previsto ya contiene una actualización de versión, valida que sea un único incremento SemVer coherente con los otros cambios; si no puedes validarlo, detente y pregunta.
6. Si corresponde un incremento, cambia solo el número visible:
   - MAJOR: incrementa el primer componente y pon los otros dos a cero.
   - MINOR: incrementa el segundo componente y pon el tercero a cero.
   - PATCH: incrementa el tercer componente.
   - Sin incremento: conserva el número actual.
7. Antes de editar, comprueba si [index.html](../../../index.html) tiene cambios preparados o sin preparar. Si estaba limpio, actualiza el número y añade únicamente ese archivo con `git add -- index.html`; verifica que el diff preparado solo contenga el cambio de versión. Si ya tenía otros cambios, consérvalos, modifica solo el número y no añadas el archivo al staging. En ese caso, informa al usuario y resuelve con él cómo incluir la versión antes de redactar el mensaje del commit.
8. Comunica brevemente la categoría, el motivo y el cambio `versión anterior → versión nueva` (o que no hubo incremento). Cuando este flujo haya terminado, el orquestador podrá invocar el skill de mensajes de commit, que revisará el diff preparado final para redactar el mensaje.

No hagas commit ni push. No cambies otros archivos ni descartes o stages cambios del usuario.
