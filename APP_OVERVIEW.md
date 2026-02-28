# App Fotometro / Gaffer Guild - Overview

## Objetivo (2026-02-27)
Entregar una build estable y revisable, con documentaci?n clara, persistencia confiable, exports s?lidos y flujo UX coherente para set. Esta versi?n prioriza utilidad real en rodaje y consistencia de datos.

## Modelo comercial y acceso (2026-02-20)
- **Season Pass**: 1 mes / 3 meses / 6 meses + anual.
- **Todo incluido** mientras la licencia est? activa (sin tiers ni m?dulos extra).
- **Modo lectura** al vencimiento: abrir/ver proyectos y exports previos; bloquear crear/editar/exportar nuevo.
- **Grace offline**: 7 d?as en m?viles. Web sin grace.
- **Watermark forense** en exports (PDF/PNG/CSV) con firma no reversible para trazabilidad.
- **Login obligatorio**: Google / Apple / Email (incluye Outlook/Hotmail).
- **Detecci?n de abuso**: alerta si una cuenta usa m?s de 8 dispositivos distintos.

## Nota de localizaci?n (ES/EN)
Desde que la app es biling?e, toda funcionalidad nueva debe quedar registrada en ambos idiomas (UI y documentaci?n). Este control se mantiene como parte del log de evoluci?n del proyecto.

## Spec de licencia
Ver `LICENSING_SPEC.md`.

## Estado actual (2026-02-28)
- Landing con registro beta + verificacion OTP por email (Supabase).
- SMTP custom (Gmail) configurado para evitar rate limits.
- Acceso web con gating: testers verificados entran a `/app/`.
- Landing narrativa azul con screenshots por modulo (hero + 5 highlights).
- Settings primero en pantalla con selector de tema (dropdown) y idioma (ES/EN).
- Now Bar compacto con Proyecto/Escena/Plano y estado de guardado.
- Dashboards por rol compactos y responsivos con grid adaptable.
- Modulos colapsados por defecto, apertura por foco o click.
- Persistencia robusta: backup, migraciones, auto-particionado.
- Offline-first para exports: cache + cola + flush al reconectar.
- Claqueta con mismatch visual rojo (ISO/T-stop/Shutter/WB/Escena/Plano).
- Camera Report dedicado (PDF/CSV) sobre mismo dataset de claqueta.
- Scouting: registros con lux + T-stop y selector de pasos (full/1/2/1/3).
- Ventana de luz: tz-lookup + badge "Aproximado" si falta `timeZone`, export PDF con fila "Approximate time".
- Long-press en controles de tiempo (15 min) y numericos.
- Slate + Camera Report visibles solo para rol AC.

## Advertencias conocidas (2026-02-28)
- Warning Expo: `@react-native-community/netinfo@11.5.2` vs expected `11.1.0`.
- Warning de engine: Node `>=20.19.4` recomendado (se detect? `20.9.0`).
- Vulnerabilidades reportadas por npm audit no corregidas (no se ejecut? `npm audit fix --force`).

## Closed Beta Ready - Checklist (2026-02-28)
1. Release discipline: `npm run verify` ejecutado y log actualizado.
2. OTP + SMTP estable: envios sin 429 en 3 registros seguidos.
3. Gating acceso: solo verificados entran a `/app/`.
4. UX errores OTP: mensajes claros (registrado, invalido, expirado, rate limit).
5. Rol AC: Slate + Camera Report visibles solo para AC.
6. Modo lectura: crear/editar/exportar bloqueado al expirar.
7. Exports criticos: Slate y Camera Report (PDF/CSV) OK.
8. Persistencia: refresh web conserva proyecto/escena/plano.
9. Performance basica: `perf:snapshot` actualizado con fecha.
10. Documentacion: MDs principales actualizados.

## Estado Etapa 1 Licencia (2026-02-20)
- Capa de licencia, banner y modal de login agregados (modo demo).
- Gating base y watermark forense implementados.
- **Pendiente**: comportamiento de modo lectura al desactivar demo no est? funcionando como se espera.

## Arquitectura de software (detalle t?cnico)
**Composition root**
- `App.js` orquesta providers, layout y gating de fuentes/contexto.
- `ProjectContext` expone un value segmentado y memoizado.
- `AppContent` se monta cuando `fontsLoaded && contextReady`.

**Estado y dominio**
- `useProjectController` es la fuente ?nica de verdad.
- Persistencia con versionado, migraciones, backup y auto?particionado.
- Guardrails y auditor?a en dev (`FOTOMETRO_AUDIT=1`).

**Orquestaci?n UI**
- `features/app/useAppViewState` compone la UI desde objetos estables.
- Sub?hooks: creaci?n, borrado, b?squeda y UI de entidades.
- Computados UI en `features/app/useAppComputed`.

**Render de m?dulos**
- `modules/registry.js` es el cat?logo declarativo.
- `ModulesRenderer` renderiza con memoizaci?n.
- Cada m?dulo expone `ModuleCard` + container.

**Servicios y side effects**
- `services/*` concentra filesystem/share, storage, exports, colas offline.
- `services/storage.js` maneja particionado y l?mites de payload.

**Flujo de datos (alto nivel)**
- UI ? acciones ? controller ? persistencia ? rehidrataci?n ? render.
- Exports: m?dulo ? servicio ? cola offline ? flush al reconectar.

## Modulos (narrativa comercial y necesidad que resuelve)
A) **Configuracion de camara**: centraliza ISO, T-stop, FPS, shutter y ND (con medios/tercios). Resuelve el dolor de la incoherencia tecnica en set y crea una base unica para mediciones y continuidad.
B) **Campo de vision**: calcula FoV por camara, modo y lente, con export PNG. Evita estimaciones a ojo y entrega un overlay confiable para decidir encuadres.
C) **Relacion de contraste**: mide key/fill en stops con lectura clara. Quita la ambiguedad del contraste y alinea al equipo con un numero objetivo.
D) **Aparatos de luz / Fixtures**: modela fixture, distancia y difusion. Resuelve dudas de caida y consistencia de luz sin perder tiempo en tablas externas.
E) **False Color**: guia IRE por preset de camara con disclaimers. Permite decisiones rapidas de exposicion con un lenguaje visual estandar.
F) **Contraste cromatico**: CCT y tinte de key/fill vs camara. Evita dominantes no deseadas y sostiene continuidad de color entre planos.
G) **Scouting**: registro por locacion con lux + T-stop y notas. Convierte el scouting en un historial util que no se pierde ni se queda en papel.
H) **Inventario y rinonera**: lista de equipo y resumen con export. Mantiene el control logistico real del set y reduce olvidos.
I) **Presupuesto**: lineas por dia con export CSV/PDF. Da visibilidad inmediata de costos y facilita reporte sin hojas sueltas.
J) **Claqueta**: metadatos de toma con sync de camara. Garantiza continuidad y evita reprocesos por datos incompletos.
K) **Camera Report**: export PDF/CSV con scope Activo/Todo. Entrega reporte profesional sin duplicar data ni trabajo manual.
L) **Call Sheet**: plan del dia con opt-in de datos sensibles. Resuelve coordinacion de equipo y seguridad en un solo documento.
M) **Ventana de luz**: azimut/altura, amanecer/atardecer, golden/blue hour. Permite decidir rodaje con informacion solar real y verificable.

## UX/UI (principios)
- UI pixel?art con alto contraste para set.
- Dashboards compactos por rol con m?tricas accionables.
- Acciones cr?ticas visibles y consistentes.
- M?dulos colapsados por defecto para reducir saturaci?n.
- Acciones del gestor de proyectos con codificaci?n por color para lectura r?pida.

## Exports (PDF/CSV/PNG)
- PDF con warning de HTML grande + fallback en web.
- CSV para mediciones, presupuesto y reportes.
- PNG para Campo de visi?n (overlay).

## Persistencia y offline
- Versionado, backup y auto?particionado.
- Cola offline para exports con flush autom?tico.

## Rendimiento y medici?n p95
- `ModulesRenderer` y `*ModuleCard` memoizados.
- Props estables por m?dulo; context value segmentado.
- Perf logs bajo flag `FOTOMETRO_PERF`.

## Riesgos acordados (producto + engineering)
- CTAs sin handler pueden da?ar percepci?n de producto.
- Datos sensibles en Call Sheet requieren cuidado.
- Falta evidencia de p95 en segunda m?quina.

## Protecci?n de desarrollo (local)
Protocolo local para proteger archivos clave durante desarrollo.
Ver `scripts/DEV_PROTECTION.md`.
