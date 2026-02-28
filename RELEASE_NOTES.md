# Release Notes (2026-02-28)

## Version
- Estado: reviewable por un dev profesional (score 8/10 defendible).

## Cambios principales
- Landing beta con registro + OTP email (Supabase).
- SMTP custom (Gmail) para evitar rate limits.
- Acceso web con gating: testers verificados entran a `/app/`.
- Claqueta + Camera Report visibles solo para rol AC.
- Dashboard compacto y responsive.
- Landing narrativa azul con screenshots clave por modulo.
- Dependencia `sharp-cli` fijada a `^2.1.0` a nivel proyecto.
- Modales responsive en mobile (creacion/rename/delete, Call Sheet, Sun Seeker, Claqueta y Budget).

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

## Fixes
- Verificacion OTP robusta (tipos signup/email/magiclink).
- Mensajes de error claros para rate limit y OTP invalido.
- Deploy web sin warning de `sharp-cli`.
- Boton de cancelar y acciones de modal ajustados para no desbordar en pantallas pequenas.

## Advertencias conocidas
- Warning Expo: `@react-native-community/netinfo@11.5.2` vs expected `11.1.0`.
- Warning de engine: Node `>=20.19.4` recomendado (detectado `20.9.0`).
- Vulnerabilidades npm audit no corregidas (no se ejecut? `npm audit fix --force`).

## Evidencia t?cnica
- `npm run verify` OK (tests + encoding + stress exports + perf snapshot + bench check).
- `stress:exports` generatedAt: `2026-02-28T17:19:12.155Z`.

## Cr?ditos
- Autor y creador: Juan Sebasti?n Cabrera R.
- Hecho en Bogot?, Colombia.
