# Sesion de trabajo (flujo seguro)

Este documento define el flujo minimo, logico y seguro para iniciar una sesion, trabajar cambios y dejar la app lista para deploy.

## 1) Arranque limpio

1. Ver estado del repo:
   `git status -s`
2. Si hay archivos sin trackear que no deben ir a Git, agregalos a `.gitignore` antes de continuar.
3. Si hay cambios locales previos, decide:
   - Continuar sobre esos cambios.
   - Commit parcial por tema.

## 2) Dependencias y entorno

1. Instalar dependencias:
   `npm install`
2. Verificar entorno (opcional):
   `npx expo-doctor`
3. Iniciar web:
   `npm run web`

## 3) Trabajo de cambios

1. Cambiar codigo/arte en el area necesaria.
2. Verificar visualmente los modulos tocados en web.
3. Si tocaste inventario y assets:
   - Revisar `data/inventoryConstants.js` y rutas de iconos.
   - Confirmar que los assets existan y se rendericen.

## 4) Verificacion minima antes de deploy

1. Tests basicos:
   `npm test`
2. Suite completa (si aplica a release):
   `npm run verify`

## 5) Commit y push (orden recomendado)

1. Revisar cambios:
   `git status -s`
2. Agregar archivos:
   `git add -A`
3. Commit con mensaje claro:
   `git commit -m "inventory: update grip icons"`
4. Push:
   `git push`

## 6) Deploy web

1. Deploy a GitHub Pages:
   `npm run deploy`
2. Verificar en:
   `https://juanscabrerarueda-pixel.github.io/gaffer-guild-closed-beta/`
   y dentro de `/app/`

## 7) Cierre de sesion

1. Snapshot local si es una jornada larga:
   `npm run dev:snapshot`
2. Confirmar que no queden cambios sin commitear:
   `git status -s`

