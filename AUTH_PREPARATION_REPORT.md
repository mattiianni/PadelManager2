# Authentication System

Questo file documenta il sistema auth realmente implementato oggi.

## Architettura

- login via codice numerico a 6 cifre
- verifica backend con `bcrypt.compare`
- JWT firmato con `jsonwebtoken`
- token salvato in `localStorage`
- auth client gestita da `hooks/useAuth.tsx`
- gate iniziale in `components/auth/AuthGate.tsx`
- splash screen in `components/auth/SplashScreen.tsx`

## Backend

Endpoint:

- `POST /api/auth/login`
- `POST /api/auth/verify`

Middleware:

- `helmet`
- `cors`
- `express.json`
- rate limiting generale su `/api`
- rate limiting stretto su `/api/auth/login`
- `authenticateToken` per tutte le route API protette

## JWT payload

Il token contiene:

- `sub`: workspace id
- `wname`: nome workspace
- `admin`: flag admin

## Storage lato client

La codebase oggi usa `localStorage`, non cookie `httpOnly`.

Chiavi usate:

- `padel_elo_token`
- `padel_elo_workspace`

## Multi-workspace

Il server mantiene:

- `workspaces`
- `access_codes`
- `audit_logs`

Ogni record applicativo viene letto e scritto con `workspace_id`.

## Admin

Gli admin possono:

- creare workspace
- generare codici
- disattivare codici
- impostare `code_plain` per codici storici
- impersonare altri workspace
- leggere audit log
- ricalcolare ELO

## Bootstrap automatico

Se il database non contiene workspace:

- il server crea un workspace di default
- crea un codice admin di bootstrap
- assegna i dati esistenti al workspace di default

## Limiti attuali

- il token e' in `localStorage`, quindi il modello di sicurezza e' piu' semplice ma meno forte rispetto a cookie `httpOnly`
- il login prova il codice contro tutti gli hash attivi
- il blocco su tentativi falliti e' presente nel modello dati, ma il flusso applicativo oggi si appoggia soprattutto al rate limiting di login
