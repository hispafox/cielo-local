---
name: ui-ux-pro-max
description: "Consulta las guías locales de UI/UX Pro Max para diseñar, implementar o revisar interfaces web, responsive, sistemas visuales, tipografía, color, interacción y accesibilidad. Úsalo en cambios de interfaz y experiencia de usuario."
---

# UX/UI Pro Max

Usa el catálogo y las herramientas locales de este skill para fundamentar decisiones de interfaz en guías concretas de producto, estilo, color, tipografía, interacción y stack. Es una fuente de recomendaciones, no una autorización para cambiar los requisitos del producto o la arquitectura.

## Cuándo usarlo

- Crear o modificar pantallas, componentes visuales, estilos o comportamiento responsive.
- Revisar jerarquía, legibilidad, navegación, accesibilidad o interacción de una interfaz.
- Buscar orientación específica para un tipo de producto, estilo, patrón o tecnología.

## Procedimiento

1. Inspecciona primero la interfaz existente, las instrucciones del proyecto, los requisitos de producto y su stack. Identifica el público, la tarea principal y los tamaños o estados relevantes.
2. Consulta las herramientas de búsqueda incluidas en `scripts/` para obtener recomendaciones pertinentes del catálogo en `data/`. Desde la raíz del repositorio, el comando de búsqueda general es:

   ```powershell
   python .github\skills\ui-ux-pro-max\scripts\search.py "consulta concreta de producto y necesidad" --domain web --max-results 5
   ```

   Para consultar guías de UX o generar recomendaciones de sistema visual, usa `--domain ux` o añade `--design-system -p "Nombre del proyecto"` a una consulta relevante. Consulta `--help` para ver los dominios, stacks y opciones disponibles; usa una guía de stack solo si coincide con la tecnología real del proyecto.
3. Contrasta las recomendaciones con la interfaz y los requisitos. Prioriza soluciones accesibles, claras, consistentes y adecuadas a la tarea. No adoptes sugerencias que contradigan el diseño existente, la especificación, el alcance aprobado o las tecnologías del proyecto; explica la discrepancia si impide implementar el plan.
4. Implementa los cambios mínimos que resuelvan el problema, reutilizando patrones y tokens existentes. No introduzcas frameworks, dependencias, recursos remotos ni cambios de stack solo para ajustarte al catálogo.
5. Valida la interfaz en los tamaños, estados e interacciones afectados. Comprueba, cuando sea posible, la vista renderizada, el teclado, el foco, la legibilidad, el contraste y el comportamiento responsive. Indica las comprobaciones no realizadas.

## Persistencia y límites

- No uses las opciones de persistencia del generador (`--persist`, `--page` o `--force`) salvo que el alcance aprobado solicite expresamente crear o actualizar esos artefactos.
- Las recomendaciones del catálogo no sustituyen los criterios de aceptación, las instrucciones de accesibilidad ni la fuente de verdad del producto.
- No afirmes que ejecutaste una búsqueda o validación si no se realizó.
