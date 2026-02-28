# Review Report (2026-02-28)

## Veredicto
Versi?n reviewable por un dev profesional. 8/10 defendible: arquitectura clara, m?dulos ?tiles y documentaci?n s?lida. Para 9/10 faltan p95 en segunda m?quina y pruebas de escala adicionales.

## Scorecard (0-10)
1. Setup y reproducibilidad: 8
2. Arquitectura y legibilidad: 8
3. Estado y modelo de datos: 8
4. Persistencia, migraciones y recuperaci?n: 8
5. Exports (PDF/CSV/PNG): 8
6. Tooling y calidad: 7
7. Rendimiento UI: 7
8. Seguridad y robustez: 7
9. UX/Producto: 8

## Evidencia t?cnica (ultima registrada)
- `npm run verify`: OK (2026-02-28).
- `stress:exports`: OK (generatedAt 2026-02-28T17:19:12.155Z).

## Nota (2026-02-28)
- Se corrigieron errores de sintaxis en `sunSeekerExport` detectados en bundling web.
- Se agreg? indicador de horario aproximado en Sun window (UI + export PDF).
- Se desactiv? acceso a Slate/Camera Report para rol Producci?n en entorno de producci?n.
- Se ajust? dashboard para evitar overflow de tarjetas (tipograf?as y wrapping).
- Landing renovada (narrativa azul) con screenshots clave por modulo.
- `sharp-cli` fijado a `^2.1.0` para evitar warning en deploy.

## Advertencias actuales
- Warning Expo: `@react-native-community/netinfo@11.5.2` vs expected `11.1.0`.
- Warning de engine: Node `>=20.19.4` recomendado (se detect? `20.9.0`).
- Vulnerabilidades reportadas por npm audit no corregidas (no se ejecut? `npm audit fix --force`).

## Log de decisiones (2026-02-20)
- **Modelo comercial**: Season Pass (1/3/6 meses) + anual, todo incluido mientras est? activo.
- **Modo lectura** al vencimiento: ver proyectos y exports previos; bloquear crear/editar/exportar nuevo.
- **Grace offline**: 7 d?as en m?viles; web sin grace.
- **Watermark forense** en exports (PDF/PNG/CSV) para trazabilidad.
- **Login obligatorio**: Google / Apple / Email (incluye Outlook/Hotmail).
- **Detecci?n de abuso**: alerta si una cuenta usa m?s de 8 dispositivos distintos.
- **Localizaci?n**: toda funcionalidad nueva debe quedar en ES/EN (UI y documentaci?n).
- **Spec de licencia**: documentado en `LICENSING_SPEC.md`.

## Estado actual (2026-02-28)
- Etapa 1 iniciada: capa de licencia, modal de login, banner, watermark forense y gating base implementados.
- **Problema abierto**: el flujo de ?modo lectura? no se comporta como se esperaba al desactivar demo. Requiere depuraci?n adicional.

## Actualizaciones relevantes
- Scouting: lux + T?stop con selector de pasos (full/1/2/1/3).
- Camera Setup: ISO y T?stop con medios/tercios y long?press.
- Ventana de luz: tz?lookup + badge ?Aproximado? si falta `timeZone`.
- Producci?n no ve Slate/Camera Report en producci?n.

## Resumen t?cnico (amplio)
- **Arquitectura:** composition root + controller + registry + services mantienen separaci?n clara y escalable.
- **Persistencia:** versionado, backups y auto?particionado reducen riesgo de corrupci?n.
- **Exports:** pipeline consistente con cola offline y reportes exportables.
- **UX/UI:** m?dulos colapsados y dashboards por rol reducen carga cognitiva.

## Flujo UX (realista en set)
- AC: c?mara ? contraste ? color ? claqueta ? camera report.
- Gaffer: c?mara ? contraste ? false color ? campo de visi?n ? ventana de luz.
- Producci?n: call sheet ? presupuesto ? inventario ? scouting ? ventana de luz.

## Potencial comercial
- Ofrece valor directo en rodaje: continuidad, reportes y log?stica.
- Diferencial con Campo de visi?n para overlay en planos.
- Segmentos objetivos claros: AC, Gaffer, Producci?n.

## Riesgos acordados
- Percepci?n si hay CTAs sin handler.
- Necesidad de evidencia p95 en 2 m?quinas.
- Validaci?n de dataset FoV en hardware real.

## Plan de acci?n para 9/10
1. Ejecutar p95 en segunda m?quina y registrar evidencia.
2. Validar dataset FoV con 2 c?maras reales.
3. Ajustar warnings web (shadow/NativeDriver) si se requiere limpieza.

## Checklist por rol (2026-02-27)
- Producci?n: Call Sheet, Presupuesto, Inventario, Scouting, Ventana de luz (Slate/Camera Report ocultos).
- AC: C?mara, Contraste, Color, FoV, Claqueta, Camera Report.
- Gaffer: C?mara, Contraste, Color, False Color, FoV, Ventana de luz, Inventario.

## Notas de datos aproximados
- Si falta `timeZone`, la UI y el PDF de Sun Seeker muestran ?Aproximado?.
