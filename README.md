# App Fotometro / Gaffer Guild

Aplicaci?n Expo/React Native para gaffers con look pixel?art. Registra exposici?n, color, continuidad (proyecto/escena/plano), log?stica de set y exporta reportes (PDF/CSV) con metadata completa.

## Objetivo
Entregar una build estable, reviewable por un dev profesional, con disciplina de calidad, checklist completo y documentaci?n verificable para evaluaci?n t?cnica. Esta versi?n prioriza persistencia robusta, exports confiables, performance UI y consistencia de textos (acentos RAE).

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
- SMTP custom configurado (Gmail) para evitar rate limits de Supabase.
- Acceso web con gating: solo testers verificados entran a `/app/`.
- Landing actualizada con narrativa azul y screenshots clave por modulo.
- Claqueta (Slate) y Camera Report visibles solo para rol AC.
- Dashboards por rol compactos y responsivos con grid adaptable.
- Scouting/Logs: lux + T-stop por locacion, selector de pasos (full/1/2/1/3).
- Camera Setup: ISO y T-stop con medios/tercios; long-press en controles.
- Ventana de luz: tz-lookup + badge "Aproximado" si falta zona horaria; export PDF con fila "Approximate time".
- Modales responsive (creacion/rename/delete, Call Sheet, Sun Seeker, Claqueta, Budget) ajustados para movil.

## Advertencias conocidas (2026-02-28)
- Warning Expo: `@react-native-community/netinfo@11.5.2` vs expected `11.1.0`.
- Warning de engine: Node `>=20.19.4` recomendado (se detect? `20.9.0`).
- Vulnerabilidades reportadas por npm audit no corregidas (no se ejecut? `npm audit fix --force`).

## Instalaci?n
1. `npm install`
2. `npm run web`

## Comandos clave
- `npm run web` ? levanta la app en web.
- `npm test` ? tests unitarios.
- `npm run verify` ? suite completa (tests + encoding + stress exports + perf snapshot + bench check).
- `npm run perf:snapshot` ? captura de performance.
- `npx expo-doctor` ? sanity check del entorno.
- `npm run deploy` ? build web + landing y publica en GitHub Pages (gh-pages).

## Variables ?tiles (dev)
- `FOTOMETRO_PERF=1` ? habilita logs de performance.
- `FOTOMETRO_AUDIT=1` ? auditor?a de estado (ids faltantes, duplicados de c?mara en m?dulos no c?mara).
- `STORAGE_PARTITIONED=1` ? fuerza modo de storage particionado.
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` ? login email (OTP) en web.
- `EXPO_PUBLIC_EVENT_TABLE` ? tabla remota para telemetry de eventos (por defecto `event_log`).

## Roles y dashboard (2026-02-27)
- Selector de rol persistente (Producci?n / AC / Gaffer).
- Now Bar con Proyecto/Escena/Plano + estado de guardado.
- Dashboards por rol compactos y responsivos (grid adaptable).
- Permisos reales por rol (view/edit/export) con CTAs deshabilitados + razones.
- M?dulos colapsados por defecto; se abren al click o focus.
- Call Sheet con hora de llamado por persona y notas por contacto + export PDF (opt?in sensible).
- Ventana de luz con GPS/ciudad/pa?s y horarios solares precisos + export PDF.
- Claqueta + Camera Report (mismo dataset) con export PDF/CSV (Activo/Todo).

## Arquitectura (detalle)
- `App.js` como composition root: providers + layout + gating de fonts/contexto + bootstrap de cola offline.
- `useProjectController` como fuente ?nica de verdad y persistencia (migraciones, backup, auto?particionado).
- `useAppViewState` orquesta UI con sub?hooks especializados (creaci?n, borrado, b?squeda, UI de entidades).
- `modules/registry` + `ModulesRenderer` para render declarativo y memoizado.
- `services/*` concentra side effects (storage, exports, filesystem/share, colas).
- `utils/*` mantiene helpers puros (formatters, c?lculos, false color, logging sanitizado).

## Flujo de datos (alto nivel)
UI ? acciones ? `useProjectController` ? persistencia ? rehidrataci?n ? render.  
Exports ? m?dulo ? servicio ? cola offline ? flush al reconectar.

## Seguridad y protecci?n
- Logs sanitizados (sin payload sensible).
- Exports con warning/fallback web.
- Export expl?cito de datos sensibles (Call Sheet).

## Protecci?n de desarrollo (local)
Protocolo local para proteger archivos clave durante desarrollo.
Ver `scripts/DEV_PROTECTION.md`.

## Import seguro
- Pre?import snapshot.
- Rollback autom?tico si falla la importaci?n.

## Deploy web (GitHub Pages)
1. `npm run deploy`
2. En GitHub: Settings ? Pages ? Source: `gh-pages` branch.
3. URL esperada: `https://juanscabrerarueda-pixel.github.io/gaffer-guild-closed-beta/`
4. La web app vive en `/app/` y la landing en `/`

## Estado beta / early access (2026-02-28)
- Funciona para testers externos: link publico + OTP por email.
- Requiere que el tester reciba el codigo y lo ingrese en la landing.
- Riesgo conocido: si SMTP no esta configurado, Supabase rate-limit activa (429).
- Recomendacion: mantener SMTP activo y pedir codigo una sola vez por minuto.

## Verify log (2026-02-28)
- `npm run verify` OK (tests + encoding + stress exports + perf snapshot + bench check).
- `stress:exports` generatedAt: `2026-02-28T17:19:12.155Z`.

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
