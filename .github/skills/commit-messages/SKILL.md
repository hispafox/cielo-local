---
name: commit-messages
description: "Úsalo después de ejecutar el skill de versionado semántico, al preparar un commit, pedir un mensaje de commit o revisar su redacción. Propone un resumen concreto y conciso con cuerpo opcional."
---

# Mensajes de commit

## Procedimiento

1. Comprueba que el skill de versionado semántico ya se ejecutó como etapa previa independiente para el conjunto de cambios de este commit. Si no se ejecutó, no redactes el mensaje: devuelve el control para que se ejecute primero y vuelve a invocar este skill después.
2. Comprueba qué cambios formarán parte del commit con `git status --short` y revisa el diff preparado con `git diff --cached`. Revisa también el diff sin preparar solo si el usuario indica que esos cambios se incluirán. No mezcles cambios sin preparar en el mensaje del commit por defecto.
3. Basa el mensaje en los cambios observables y su propósito; usa el contexto de la petición solo para aclarar la intención. No atribuyas motivos, impactos ni cambios que el diff no confirme.
4. Escribe la primera línea como `tipo: descripción concreta`, en español salvo que el usuario o una convención clara del proyecto indiquen otro idioma. Elige un tipo que describa el cambio (`feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `perf` o `chore`) y empieza la descripción con una acción específica.
5. Añade un cuerpo solo si aporta detalles útiles sobre qué cambió, por qué o qué comportamiento afecta. Sepáralo del resumen con una línea en blanco y no repitas lo que ya dice la primera línea. Para cambios triviales, usa una sola línea.
6. Devuelve un mensaje recomendado, normalmente en un bloque de código, sin explicaciones redundantes. Si los cambios pertenecen a commits distintos o no se puede determinar qué se incluirá, indícalo en vez de inventar un mensaje único.

## Criterios

- Sé específico: nombra el área, comportamiento o contenido modificado, no solo la acción genérica de editar un archivo.
- Sé breve sin ser vago. Por ejemplo, `docs: cambiar el idioma del código de inglés a castellano` describe el cambio; `actualizar instrucciones` no.
- Sigue la convención existente del proyecto cuando sea visible, sin añadir prefijos, alcances o metadatos que no use.
- No prepares otros archivos ni ejecutes `git commit` solo por redactar un mensaje. La única excepción es el cambio de versión y staging seguro de `index.html` que realiza el skill de versionado semántico conforme a sus reglas.
- Si el usuario pide efectuar el commit, sigue sus instrucciones explícitas para esa operación.
