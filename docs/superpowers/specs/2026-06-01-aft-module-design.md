# Spec: Módulo de Activos Fijos Tangibles (AFT)

## 1. Visión General
Implementing a comprehensive Asset Management (AFT) system inspired by the `aft-control-activos` reference project, adapted to the SITRADE ERP architecture. The system allows tracking of physical assets, periodic inventory controls, and movement history.

## 2. Arquitectura de Datos
The system uses the existing ERP tables in Supabase:

- **`activos`**: Main asset registry (id, locale_id, tipo, numero_medio_basico, marca, modelo, etc.)
- **`movimientos_activos`**: History of asset transfers between locales.
- **`controles_aft`**: Periodic inventory sessions (planned, in_progress, completed).
- **`detalles_control`**: Results of a specific asset check (present: boolean, estado_observado).

## 3. Implementación Web (Admin Portal)

### 3.1. Dashboard y Gestión de Activos
- **Navigation**: `/aft` as the main hub.
- **Visual Style**: Gradient headers, status-coded cards (following the "Aulas" module pattern).
- **Key Features**:
    - **Massive Upload**: Excel parser using `xlsx` to bulk-insert assets into the `activos` table.
    - **QR Generation**: Generation of 3x5 grid PDF labels with QR codes mapping to `numero_medio_basico`.
    - **Asset Registry**: Searchable table with filters by area and status.

### 3.2. Inventory Control & Reconciliation
- **Session Management**: CRUD for `controles_aft`.
- **Reconciliation Logic**:
    - Compare `activos` (expected in `locale_id`) vs `detalles_control` (scanned by technician).
    - Identify **Missing** (Expected but not found).
    - Identify **Surplus** (Found but not expected in that locale).
- **Reports**:PDF/Excel summaries of the reconciliation process.

## 4. Implementación Móvil (App Expo)

### 4.1. Offline-First Strategy
- **Local DB**: Use `expo-sqlite` to cache areas and assets for the current inventory.
- **Pending Queue**: Store scans in `pending_scans` table until synchronized.
- **Sync Mechanism**: Batch upload to server actions/API with retry logic.

### 4.2. User Experience
- **QR Scanner**: Full-screen camera view with haptic feedback and real-time validation.
- **Manual Entry**: Fallback input for damaged labels.
- **Status Tracker**: Real-time count of scanned vs total assets.

## 5. Seguridad y Permisos
- **RLS**: Enforced via Supabase policies.
- **Roles**: `admin` and `jefe` have full control. `tecnico de activos fijos` can execute controls and move assets.
- **Auth**: Middleware protection for web routes; secure session persistence for mobile.

## 6. Flujo de Trabajo (Workflow)
1. Admin $\rightarrow$ Uploads assets via Excel.
2. Admin $\rightarrow$ Creates a Control session for a Locale.
3. Technician $\rightarrow$ Downloads local assets to App $\rightarrow$ Scans items in field.
4. Technician $\rightarrow$ Syncs data to server.
5. Admin $\rightarrow$ Reviews reconciliation $\rightarrow$ Generates final report.
