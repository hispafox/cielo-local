# Arquitectura de agentes y skills

Este documento describe los cuatro agentes del proyecto: un Orquestador coordinador y tres subagentes —Planificador, Desarrollador y Verificador—. El flujo parte de un issue existente, crea una rama y termina con un pull request aprobado; no crea issues ni fusiona el PR.

## Mapa de un vistazo

El usuario habla con el Orquestador. Este reparte el trabajo y conserva la ruta del plan entre el Planificador, el Desarrollador y el Verificador. El Desarrollador implementa el plan y atiende las correcciones solicitadas por el Verificador; no hay un agente Implementador separado.

```mermaid
flowchart LR
    U["Usuario: issue existente"] --> O["Orquestador<br/>agente coordinador"]
    O -->|"issue"| P["Planificador<br/>subagente"]
    P -->|"crea"| PLAN["docs/planificacion-*.md"]
    PLAN -->|"ruta exacta"| O
    O -->|"issue + ruta del plan"| D["Desarrollador<br/>subagente"]
    D -->|"implementación + pruebas"| O
    O -->|"plan + implementación"| V["Verificador<br/>subagente"]
    V -->|"aprobación o hallazgos"| O
    O -->|"si falla, reitera hasta 3 ciclos"| D
    O -->|"solo tras aprobación"| G["Versionado, commit y PR"]
```

## Inventario de agentes

| Agente | Archivo | Responsabilidad |
|---|---|---|
| **Orquestador de issues** | [orquestador-issues.agent.md](../.github/agents/orquestador-issues.agent.md) | Recibe un issue existente, crea una rama antes de delegar, coordina a los tres subagentes y prepara la publicación cuando el Verificador aprueba. No crea issues ni implementa funcionalidad directamente. |
| **Planificador de issues** | [planificador-issues.agent.md](../.github/agents/planificador-issues.agent.md) | Analiza el issue y crea un plan accionable en `docs/`. Devuelve la ruta exacta del documento; no implementa. |
| **Desarrollador de planes** | [desarrollador-planes.agent.md](../.github/agents/desarrollador-planes.agent.md) | Implementa el plan en el primer ciclo y corrige hallazgos verificados en ciclos posteriores. Ejecuta pruebas; no crea commits, ramas ni PR. |
| **Verificador de planes** | [verificador-planes.agent.md](../.github/agents/verificador-planes.agent.md) | Compara la implementación con los criterios del plan, ejecuta comprobaciones pertinentes y emite un veredicto independiente. No modifica archivos. |

El Desarrollador y el Verificador repiten el ciclo hasta que se aprueben los criterios obligatorios o se completen **tres ciclos**. Si se agota el límite, el Orquestador se detiene sin publicar.

## Skills del proyecto

El inventario incluye todas las skills presentes en `.github/skills/`. Las skills sin agente llamador siguen disponibles para invocación directa cuando corresponda.

| Skill | Uso en el flujo |
|---|---|
| [versionado-semantico](../.github/skills/versionado-semantico/SKILL.md) | **Orquestador**: tras la verificación aprobada y antes de preparar el commit. Determina el incremento de versión o confirma que no corresponde. |
| [commit-messages](../.github/skills/commit-messages/SKILL.md) | **Orquestador**: después del versionado y de preparar el diff, redacta el mensaje del commit. |
| [crap-diseno](../.github/skills/crap-diseno/SKILL.md) | **Desarrollador**, si el plan o las correcciones afectan al diseño visual. |
| [ui-ux-pro-max](../.github/skills/ui-ux-pro-max/SKILL.md) | **Desarrollador**, si el plan o las correcciones afectan a la interfaz o experiencia de usuario. |
| [docx](../.github/skills/docx/SKILL.md) | Sin agente llamador. |
| [pdf](../.github/skills/pdf/SKILL.md) | Sin agente llamador. |
| [pptx](../.github/skills/pptx/SKILL.md) | Sin agente llamador. |
| [xlsx](../.github/skills/xlsx/SKILL.md) | Sin agente llamador. |

Por tanto, las skills sin agente llamador son **docx**, **pdf**, **pptx** y **xlsx**.

```mermaid
flowchart LR
    subgraph Agentes
        O["Orquestador"]
        P["Planificador"]
        D["Desarrollador"]
        V["Verificador"]
    end

    subgraph Skills["Skills de .github/skills"]
        SEM["versionado-semantico"]
        CM["commit-messages"]
        CRAP["crap-diseno"]
        UX["ui-ux-pro-max"]
        DOCX["docx"]
        PDF["pdf"]
        PPTX["pptx"]
        XLSX["xlsx"]
    end

    O -->|"antes del commit"| SEM
    O -->|"tras versionar y preparar el diff"| CM
    D -->|"cambios visuales"| CRAP
    D -->|"cambios de interfaz/UX"| UX
```

## Ciclo completo, paso a paso

El siguiente diagrama representa el proceso habitual desde que el usuario entrega el issue hasta que el pull request está creado. El PR no se fusiona automáticamente.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant O as Orquestador
    participant G as Git y GitHub
    participant P as Planificador
    participant D as Desarrollador
    participant V as Verificador
    participant S as versionado-semantico
    participant C as commit-messages

    U->>O: Issue existente o referencia
    O->>G: Comprobar árbol limpio, origin y autenticación
    O->>G: Actualizar rama base y crear rama del issue
    opt Solo se proporcionó una referencia
        O->>G: Leer issue existente con gh
    end
    O->>P: Pasar issue para planificación
    P-->>O: Crear plan y devolver su ruta
    loop Desarrollo y verificación, máximo 3 ciclos
        O->>D: Issue + ruta exacta del plan<br/>+ hallazgos si es reintento
        D-->>O: Implementación/correcciones y pruebas
        O->>V: Pasar plan e implementación para revisión
        V-->>O: Veredicto y evidencia
        alt Criterios obligatorios no aprobados
            Note over O,V: Si queda un ciclo, el informe se entrega al Desarrollador
        else Criterios obligatorios aprobados
            Note over O,V: Continuar al cierre y publicación
        end
    end

    Note over O,V: Si se agotan los 3 ciclos sin aprobación, detenerse sin commit ni PR
    O->>S: Ejecutar versionado como etapa independiente
    S-->>O: Incremento aplicado o versión sin cambios
    opt El versionado modifica archivos
        O->>V: Verificar el estado final
        V-->>O: Confirmar aprobación o devolver hallazgos al ciclo
    end
    O->>G: Preparar únicamente los archivos de la tarea
    O->>C: Solicitar mensaje sobre el diff preparado
    C-->>O: Mensaje de commit recomendado
    O->>G: Commit con tráiler de coautoría y push de la rama
    O->>G: Crear PR contra la rama predeterminada
    G-->>O: URL del pull request
    O-->>U: Informar resultado y URL del PR
```

## Flujo de control

Este diagrama deja explícitas las condiciones de parada y el límite de reintentos, incluido el caso en que el versionado semántico modifica archivos.

```mermaid
flowchart TD
    A["Usuario entrega un issue existente"] --> B["Comprobar prerrequisitos y crear rama"]
    B --> C["Planificador crea el plan"]
    C --> D["Desarrollador implementa o corrige<br/>siguiente ciclo disponible (máximo 3)"]
    D --> E["Verificador revisa el mismo plan"]
    E --> F{"¿Cumple todos los criterios obligatorios?"}
    F -->|"No"| G{"¿Queda algún ciclo?"}
    G -->|"Sí"| D
    G -->|"No"| STOP["Detenerse sin commit ni PR"]
    F -->|"Sí"| S["Ejecutar versionado-semantico"]
    S --> T{"¿Cambió archivos?"}
    T -->|"No"| STAGE["Preparar solo archivos de la tarea"]
    T -->|"Sí"| V["Verificar de nuevo el estado final"]
    V --> W{"¿La verificación final aprueba?"}
    W -->|"Sí"| STAGE
    W -->|"No"| X{"¿Queda algún ciclo?"}
    X -->|"Sí"| D
    X -->|"No"| STOP
    STAGE --> M["Invocar commit-messages"]
    M --> K["Crear commit"]
    K --> P["Push y crear pull request"]
    P --> END["Informar URL del PR; no fusionarlo"]
```

Si falla un prerrequisito, un agente se bloquea, se agotan los tres ciclos o no se aprueba una verificación final, el Orquestador informa del motivo y no publica el trabajo.
