# Baseline — Fase 0

**Fecha**: 2026-06-16
**Commit base**: `79fae5d` — feat: 7 mejoras de rendimiento, resiliencia y UX
**Rama de trabajo**: `refactor/plan-fases` (creada desde `main`)
**Stack**: Next.js 16.2.6 (Turbopack) + React 19.2.4 + TypeScript 5 + Playwright 1.60

Este documento congela el estado del proyecto **antes** de ejecutar las Fases 1–6 del `PLAN_FASES.md`. Cualquier regresión posterior se compara contra estas cifras.

---

## 1. Typecheck

```bash
npm run typecheck   # tsc --noEmit
```

- **Resultado**: ✅ 0 errores.
- **Tiempo**: ~10s.
- **Log**: `.baseline-typecheck.log`.

---

## 2. Lint

```bash
npm run lint   # eslint . --ext .ts,.tsx
```

- **Resultado**: 65 problemas — **47 errores** + **18 warnings**.
- Exit code: 0 (no bloquea CI; los `any` no rompen build).
- **Log**: `.baseline-lint.log`.

### Desglose por tipo
| Regla | Conteo | Tipo |
|-------|-------:|------|
| `@typescript-eslint/no-explicit-any` | 47 | error |
| `@typescript-eslint/no-unused-vars` | 16 | warning |
| `react-hooks/exhaustive-deps` | 1 | warning |
| `react-hooks/set-state-in-effect` | 1 | error |

### Archivos con más warnings (top 5)
1. `src/app/(dashboard)/guardia/[id]/[areaId]/page.tsx` — 11 hits
2. `src/app/(dashboard)/guardia/config/page.tsx` — 8 hits (incluye 1 error real de hook)
3. `src/app/(dashboard)/aft/historial/page.tsx` — 6 hits
4. `src/app/(dashboard)/guardia/[id]/page.tsx` — 7 hits
5. `src/app/actions/guardia.ts` — 8 hits (mix `any` + `unused-vars`)

### Hallazgo no contemplado en `INFORME_ANALISIS.md`
> `guardia/config/page.tsx:36` — error real `react-hooks/set-state-in-effect`: `loadData()` se llama síncronamente dentro de un `useEffect`. Causa cascading renders. Candidato para Fase 2 (refactor a Server Component, P5) o Fase 3 (extraer a hook con `useState` inicial diferido).

---

## 3. Build (producción, Turbopack)

```bash
npm run build   # next build
```

- **Resultado**: ✅ Compiled successfully in **10.7s**.
- TypeScript embedido: 8.0s.
- Generación static: 8 páginas en 501ms (`/`, `/_not-found`, `/login`, `/auth/callback`, etc.).
- **Log**: `.baseline-build.log`.

### Aviso del build (no error)
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
Next.js 16 está renombrando `middleware.ts` → `proxy.ts`. **No urgente**, pero conviene migrar antes de Next 17. Añadido como ítem **fuera del plan** (P-extra).

### Rutas detectadas (24 totales)
- **Estáticas (○, 4)**: `/`, `/_not-found`, `/login`.
- **Dinámicas (ƒ, 20)**: todo `(dashboard)/*` + `/api/aft/sync`, `/api/aft/upload`, `/auth/callback`.
- Esto confirma P5 del informe: la mayoría de páginas son client-side dinámicas; objetivo Fase 2 es convertir listados a Server Components.

### Tamaños de bundle
> ⚠️ El build de Next 16 con Turbopack **no imprime tabla de tamaños por ruta** en stdout (cambio respecto a Next 14/15). Para medir el bundle hay que inspeccionar `.next/static/` manualmente o usar `@next/bundle-analyzer`.

**Medición pendiente** (recomendada al iniciar Fase 3 antes de P12 dynamic imports):
```bash
npm install -D @next/bundle-analyzer
# wrapping en next.config.ts, luego ANALYZE=true npm run build
```
Para esta Fase 0 dejamos como **baseline cualitativo**: páginas `aft/*` cargan estáticamente `jspdf` (~250KB) + `qrcode` + `xlsx` — confirmado por grep de imports en `QrsPdfButton.tsx`.

---

## 4. Tests E2E (Playwright)

```bash
npm run start &       # servidor de producción en :3000
npm run test:e2e      # playwright test
```

- **Resultado**: ⚠️ **17 passed, 1 failed, 1 did not run**.
- **Tiempo**: 2 min 6 s.
- **Log**: `.baseline-e2e.log`.
- **Trace del fallo**: `test-results/guardia-Guardia---Flujo-En-6549d-crea-parte-llena-5-entregas-chromium/`.

### Resumen por suite
| Suite | Pasados | Fallidos | Skipped |
|-------|--------:|---------:|--------:|
| `auth.spec.ts` | 9 | 0 | 0 |
| `aft.spec.ts` | 5 | 0 | 0 |
| `aulas.spec.ts` | 3 | 0 | 0 |
| `guardia.spec.ts` | 0 | 1 | 1 (serial dep.) |

### Fallo registrado
`guardia.spec.ts:55` — **"tecnicoE crea parte, llena 5 entregas"**
- Timeout 60s; el assertion `expect(reciboBtn.isDisabled()).toBe(false)` no se cumplió en 15s.
- El test serial siguiente (`tecnicoR llena 5 recibos`) quedó `did not run` por la dependencia.
- **Interpretación**: la línea 113-115 espera que un botón "Recibo" se habilite después de guardar la entrega. O bien hay regresión real, o flakiness del flujo (ya documentado en informe sobre Supabase auth bajo carga).

### Divergencia con `INFORME_ANALISIS.md`
> El informe afirma "19 tests E2E pasando" (sección 2.4). Hoy: **17 verdes, 1 rojo, 1 bloqueado**. Posibles causas:
> 1. El informe se redactó con dev server (`next dev`); aquí ejecutamos con `next start`. El cambio de servidor puede alterar timing.
> 2. Regresión introducida entre el momento del informe y este baseline.
> 3. Flakiness genuina del flujo Guardia.
>
> **No es trabajo de Fase 0 arreglarlo**. Quedará registrado y se reverificará al inicio de la Fase 4 (calidad/testing).

---

## 5. Resumen ejecutivo

| Métrica | Esperado por informe | Medido en baseline | Veredicto |
|---------|----------------------|--------------------|-----------|
| Typecheck errores | 0 | 0 | ✅ Coincide |
| Lint warnings (`any`) | 47 | 47 errores `any` + 18 warnings adicionales | ⚠️ Más detalle del que el informe reportaba |
| Build OK | ✅ | ✅ 10.7s | ✅ Coincide |
| E2E verdes | 19/19 | 17/19 (+1 fail, +1 skipped) | ❌ Divergencia |
| Bundle `aft/[id]` | "carga jspdf static" | Sin medición numérica (Turbopack no imprime tabla) | ⚙️ Medir en Fase 3 |
| `middleware` deprecado | — | Avisado por Next 16 | ➕ Hallazgo extra |
| `set-state-in-effect` | — | 1 error real en `guardia/config/page.tsx:36` | ➕ Hallazgo extra |

---

## 6. Estado de Fase 0

- [x] 0.1 Rama `refactor/plan-fases` creada y activa.
- [x] 0.2 Baseline capturado (typecheck, lint, build, E2E).
- [x] 0.3 Documento `BASELINE.md` generado.

**Logs persistidos** (no commitear; añadir a `.gitignore` si conviene):
- `.baseline-typecheck.log`
- `.baseline-lint.log`
- `.baseline-build.log`
- `.baseline-e2e.log`
- `test-results/` y `playwright-report/` (artefactos del fallo)

---

## 7. Recomendaciones antes de Fase 1

1. **Investigar fallo E2E de guardia** (10-30 min): abrir el trace `npx playwright show-trace test-results/.../trace.zip` y decidir si es regresión real (entonces fixearlo antes de tocar seguridad) o flakiness (entonces dejar nota y seguir).
2. **No commitear los `.log`**: añadir `.baseline-*.log` a `.gitignore` si no quieres que viajen.
3. **`BASELINE.md`**: dejarlo como documento vivo en la raíz junto a `PLAN_FASES.md` e `INFORME_ANALISIS.md`. Decidir si va al repo o queda local.
4. **Próximo paso**: P3 de la Fase 1 — rotación de `service_role_key` y password Postgres (acción manual en dashboard Supabase, no cambia código).
