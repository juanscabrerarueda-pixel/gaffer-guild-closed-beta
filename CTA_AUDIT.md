# CTA Audit (PR1 - No Dead Buttons)

Fecha: 2026-02-28

## Estado por rol (Dashboard)

### Producci?n
- Call Sheet (card): **Funcional** (focus a m?dulo `callSheet`).
- Presupuesto (card): **Funcional** (focus a m?dulo `budget`).
- Scouting/Logs (card): **Funcional** (focus a m?dulo `logs`).
- Inventario (card): **Funcional** (focus a m?dulo `inventory`).
- Ventana de luz (card): **Funcional** (focus a m?dulo `sunSeeker`).
- Slate/Camera Report: **Ocultos en producci?n**.

### AC
- Fotometr?a (card): **Funcional** (focus a m?dulo `camera`).
- Campo de visi?n (card): **Funcional** (focus a m?dulo `fov`).
- Relaci?n de contraste (card): **Funcional** (focus a m?dulo `contrast`).
- Contraste crom?tico (card): **Funcional** (focus a m?dulo `color`).
- Claqueta (card): **Funcional** (focus a m?dulo `slate`).
- Camera Report (card): **Funcional** (focus a m?dulo `cameraReport`).

### Gaffer
- Fotometr?a (card): **Funcional** (focus a m?dulo `camera`).
- Relaci?n de contraste (card): **Funcional** (focus a m?dulo `contrast`).
- Contraste crom?tico (card): **Funcional** (focus a m?dulo `color`).
- False Color (card): **Funcional** (focus a m?dulo `falseColor`).
- Campo de visi?n (card): **Funcional** (focus a m?dulo `fov`).
- Ventana de luz (card): **Funcional** (focus a m?dulo `sunSeeker`).

## Modales responsive (2026-02-28)
- Creacion/Rename/Delete: botones no desbordan en mobile.
- Date pickers (Call Sheet, Sun Seeker, Claqueta, Budget): width 100% + maxWidth.

## CTAs de export por m?dulo
- Call Sheet: **Export PDF funcional**.
- Campo de visi?n: **Export PNG funcional** (web).
- Ventana de luz: **Export PDF funcional**.
- Presupuesto: **Export CSV/PDF funcional**.
- Inventario: **Export PDF funcional**.
- Camera Report: **Export PDF/CSV funcional** (scope Activo/Todo; deshabilitado si no hay takes).
- Proyecto (Gestor de proyectos): **Export PDF funcional**.

## Herramientas (Gestor de Proyectos)
- Botones de acci?n codificados por color (renombrar amarillo, nuevo verde, duplicar rosado).
- Buscar (Ctrl+K): **Funcional**.
- Exportar reporte proyecto (PDF): **Funcional**.
- Reset m?dulos: **Funcional** (solo cuando toolsOpen).
- Benchmark (DEV): **Funcional** (solo __DEV__).

## Acciones sin handler
- Ninguna visible.
