# Auditoría Figma ↔ código — Stride MVP

**Archivo Figma:** `Stride` · página `Wireframes MVP (alta fidelidad)` (`node 129:2507`)
**Home / "Hoy":** `node 174:1170` (B1 día de entrenamiento / B1b día de descanso)
**Rama:** `ui-adjustments-figma-audit`
**Fecha:** 2026-09-08

Leyenda de estado:

| Estado | Significado |
|---|---|
| ✅ coincide | La pantalla de código ya reflejaba el Figma (o quedó igual tras el ajuste). |
| 🔧 adaptado | Había diferencias; se cambió el código para replicar el Figma. |
| ⚠️ desfasado a propósito | El Figma y las instrucciones de producto chocan → gana la instrucción. Documentado abajo. |
| 🕳️ falta pantalla | El Figma tiene una pantalla que no existe en el código. No se implementó en esta pasada. |

---

## Resumen por pantalla

| # | Figma | Pantalla de código | Estado | Qué se hizo / qué queda |
|---|---|---|---|---|
| A1 | Bienvenida | `auth/WelcomeScreen.tsx` | 🔧 adaptado | Logo centrado y más grande, bloque de texto centrado, subtítulo `ink/500`. Se mantiene el link "Ya tengo cuenta" (necesario para volver; el Figma no lo muestra). |
| A2 | Meta | `onboarding/OnboardingGoalScreen.tsx` | ✅ coincide | Sin back en paso 1 (coincide con instrucción #1 y con el Figma), progress pill, 7 OptionCards, footer fijo. |
| A3 / A3b | Punto de partida (tiempo / km) | `onboarding/OnboardingLevelScreen.tsx` | ✅ coincide | Opciones por modo tiempo/distancia, paso 2 con back. El Figma trunca la opción larga con "…"; el código la deja envolver a 2 líneas (diferencia menor, aceptada). |
| A4 | Disponibilidad | `onboarding/OnboardingDaysScreen.tsx` | ✅ coincide | 7 círculos L–D, selección `brand/500`, contador de días. (Ya adaptado en la fase previa.) |
| A5 | Proyección | — | 🕳️ falta pantalla | Paso de onboarding con gráfico "Así podría verse tu progreso". No existe en el código (el flujo va Disponibilidad → Fecha). Requiere componente de chart + lógica de proyección. |
| A6 | Plan generado | `PlanGeneratedScreen.tsx` | 🔧 adaptado / ⚠️ parcial | Copy nuevo: título "Tu plan semanal, listo" + subtítulo del Figma. **Se mantiene el acordeón multi-semana** (instrucción #6: "abrir de a una", minutos = sesión completa) en lugar de la lista simple de un tramo del Figma. Footer fijo ya aplicado. Se conservan la tarjeta "Tu meta" y los chips (no chocan con ninguna instrucción, pero el Figma no los muestra — diferencia menor mantenida por utilidad). |
| A7 | Cuenta | `auth/RegisterScreen.tsx` | 🔧 adaptado / ⚠️ parcial | Subtítulo → "…No pedimos tarjeta de crédito.", divisor "o" → "o continuar con", back con `Icon`. **Se mantiene** el campo Nombre (el Figma no lo pide pero la app usa `profile.name` para el saludo y el perfil) y el campo Confirmar contraseña (validación de seguridad). **No implementado:** ProgressSteps en Register, "Continuar con Apple" (`expo-apple-authentication` está en deps pero no configurado en nativo/web). |
| A8 | Permisos (onboarding) | — | 🕳️ falta pantalla | Paso "Dos permisos, explicados antes de pedirlos" con 2 tarjetas + "Continuar" / "Ahora no". El código pide GPS on-demand vía `GPSPermissionScreen` antes de la primera corrida. No se agregó el paso al flujo de onboarding. |
| B1 / B1b | Hoy (entrenamiento / descanso) | `HomeScreen.tsx` | 🔧 adaptado / ⚠️ | Reescrito en la fase previa contra `174:1170`: header avatar + "¿Listo/Lista para hoy?", card de hoy, hairline, bloque de progreso, "Próximos días" con chips. **⚠️ El botón "Empezar" queda inline (no en footer fijo)** — así lo muestra el Figma B1; la instrucción #6/#7 de "footer fijo" se aplicó solo a pantallas cuyo CTA vive al pie, y Home no es una de ellas. El avatar ahora abre la tab "Perfil" (antes empujaba la pantalla `Profile` sin salida en web). |
| B2 | Mi plan | `MyPlanScreen.tsx` | 🔧 adaptado | Header centrado "Mi plan" con back (3 zonas back/título/spacer). Filas de día: "Trote con intervalos", "Descanso" atenuado, y **"Trote con intervalos · hoy"** resaltado en la semana actual. Acordeón abre de a uno (instrucción #6). Footer "+ N semanas…". **Se registró la ruta `MyPlan` en el navigator** (antes el componente existía pero no estaba enrutado; Perfil → "Mi plan" abría `PlanGenerated`). |
| C1 | Pre-run | — | 🕳️ falta pantalla | Pantalla "preparate para correr". El código va `GPSPermission` → `ActiveTraining` directo. No implementada. |
| C2 | Tracking en vivo | `training/ActiveTrainingScreen.tsx` | 🔧 adaptado | Header → "Intervalo N de M · Trote" (orden del Figma). Labels de stats en mayúsculas. Layout de tracker a pantalla completa se mantiene (marcado para revisar contra Figma en detalle; el mapa GPS es un placeholder). |
| C3 | Pausa | `ActiveTrainingScreen.tsx` (modal) | 🔧 adaptado | Modal → **bottom sheet** con esquinas redondeadas, título centrado "Entrenamiento en pausa", 2 stat cards `surfaceMuted` con labels en mayúsculas ("TIEMPO" / "DISTANCIA"), distancia con unidad inline ("1.1 km"). Se quitó la ✕. Botones `Reanudar` (primary) + `Finalizar entrenamiento` (`tertiaryDanger`). |
| C4 | Resumen post-run | `training/TrainingCompletedScreen.tsx` | 🔧 adaptado | Header centrado "Resumen". Stat cards con labels en mayúsculas ("TIEMPO TOTAL" / "DISTANCIA" / "RITMO PROM."), distancia "2.1 km". Footer fijo "Volver a Hoy" ya aplicado. Se mantiene el subtítulo dinámico según la meta (mejora sobre el texto fijo del Figma). |
| E1 | Historial | `profile/HistorialScreen.tsx` | 🔧 adaptado | Fecha → `DD/MM/YYYY`. Tipo por defecto → "Trote con intervalos". Stats en una línea con separación por espacios y `tabular-nums` ("2.4 km   22 min   5:30 /km"), sin puntos medios. Back con `Icon`. Título 18/Bold. |
| E2 | Progreso | `progress/ProgressScreen.tsx` | 🔧 adaptado | Labels de SplitStat ("Semanas completadas" / "Racha actual") **sin** mayúsculas (así los muestra el Figma); labels de StatGrid ("KM TOTALES" / "TIEMPO TOTAL") sí en mayúsculas. Cards de historial alineadas al formato de E1. Botón de logros (icono) arriba a la derecha ya aplicado en la fase previa. |
| E3 | Logros | `profile/LogrosScreen.tsx` | ⚠️ fuera de página | La pantalla existe en el código y es alcanzable desde E2. No está en la página `Wireframes MVP (alta fidelidad)` del Figma, así que no hay referencia contra la cual auditar. |
| F3 | Permisos (ajustes) | `profile/PermissionsScreen.tsx` **(nueva)** | 🔧 adaptado | Pantalla nueva: header con back + "Permisos", 2 tarjetas (Ubicación con `pin` + `Switch` + badge de advertencia `warning`; Notificaciones con `bell` + `Switch`). Perfil → "Permisos" ahora abre esta pantalla (antes abría `GPSPermissionScreen`, que es el prompt de permiso, no el panel de ajustes). Los toggles son locales (sin persistencia todavía). |
| F4 | Perfil | `profile/ProfileScreen.tsx` | 🔧 adaptado | Sin botón back (es raíz de tab en el Figma). Avatar `surfaceMuted` + inicial `ink/900`. "Editar" → "Editar perfil" (`Button` secondary sm, hug). **Se quitó la fila "Logros"** (el Figma la dropea; sigue accesible desde E2). "Cerrar sesión" sin chevron. Orden de filas del Figma: Mi plan · Historial · Cambiar objetivo · Permisos · Cambiar contraseña · Cerrar sesión · Eliminar cuenta. |

---

## Pantallas fuera del alcance de auditoría (según instrucciones)

- **Login (`auth/LoginScreen.tsx`)** y **Register** quedan como formularios scrolleables normales (decisión: footer fijo solo en pantallas cuyo CTA vive al pie). Login ya tiene el ícono de ojo estilo `Icons` y el botón "Continuar con Google" como `Button` secondary con `GoogleGlyph`.
- **ForgotPassword / ForgotPasswordConfirm / EditProfile / ChangePassword / GPSPermission / InsufficientTime / OnboardingDate**: migradas a `Button` + `Icon` y (donde corresponde) a footer fijo en la fase previa. No tienen nodo propio en la página auditada más allá de lo ya cubierto.

---

## Puntos que quedan desfasados respecto del Figma (por instrucciones de producto)

1. **Back oculto en el paso 1 del onboarding (A2/A3…).** Instrucción #1. En este caso el Figma A2 *también* oculta el back, así que no hay conflicto real; sí lo habría si en algún nodo el Figma mostrara el back en el primer paso.
2. **Minutos = duración total de la sesión** (calentamiento + intervalos + enfriamiento), no solo el trote objetivo. Instrucción #6 + decisión "Duración total de la sesión". El mockup A6 escribe "10 min" / "12 min" como números ilustrativos; el código calcula el total real (`estimateSessionMinutes`), que para una semana 1 de 5K con Método Caco da ~30 min. **Gana la instrucción.**
3. **Acordeón "abrir de a uno" en Plan generado (A6) y Mi plan (B2).** Instrucción #6. El Figma A6 muestra una lista plana de un solo tramo; se mantiene el acordeón multi-semana con una sola sección abierta.
4. **Footer fijo solo en pantallas con CTA al pie.** Instrucción #6/#7 + decisión. Home (B1) mantiene "Empezar" inline como en el Figma; Login/Register siguen como formularios scrolleables. Sí tienen footer fijo: OnboardingDate, PlanGenerated, TrainingCompleted, GPSPermission, InsufficientTime, EditProfile, ChangePassword.
5. **Botones tipo píldora (`radius.full`) en todos lados.** Instrucción #8. Componente `Button` único (primary / secondary con borde `ink/900` 1.75 / tertiary / tertiaryDanger, tamaños sm/md). Coincide con el componente `Button` del Figma.
6. **Ícono de ojo del set `Icons`** en lugar del emoji. Instrucción #4. Aplicado en Login y Register vía `components/Icon.tsx` (SVG stroke web + fallback nativo).
7. **Saludo "¿Listo/Lista para hoy?"** según el nombre (primer token, `.endsWith('a')` → "Lista"). Instrucción #5 + decisión "Heurística por nombre".
8. **Subtítulo dinámico en C4** según la meta, en lugar del texto fijo del Figma ("Completaste tu primer entrenamiento…"). Mejora, no regresión.
9. **Campo Nombre y Confirmar contraseña en Register (A7)** — el Figma no los muestra; se conservan por necesidad de datos y de validación.

---

## Faltantes reales (Figma tiene, código no) — no implementados en esta pasada

| Pantalla | Nota |
|---|---|
| A5 · Proyección | Paso de onboarding con gráfico de proyección. Necesita componente de chart + cálculo de proyección. |
| A8 · Permisos (onboarding) | Paso "dos permisos explicados" antes de pedirlos. Hoy el permiso de GPS se pide on-demand. |
| C1 · Pre-run | Pantalla de "preparate" previa a la corrida. |

---

## Verificación

- `npx tsc --noEmit` → sin errores.
- Verificación visual en el preview web de las pantallas alcanzables sin auth (Splash, Welcome, Onboarding A2–A4, PlanGenerated, Login, Register).
- Las pantallas detrás de login (Home, Progreso, Perfil, Mi plan, ActiveTraining, TrainingCompleted, EditProfile, ChangePassword, Permisos) se revisaron por código contra los screenshots del Figma.
