
# Guía de Configuración de Proveedores Sociales (Google & Facebook) para Strapi

Este documento es un checklist operativo para asegurar que la configuración de los proveedores de autenticación social en Google Cloud y Meta for Developers sea correcta para la integración con Strapi.

## 1. Configuración de Google

**Ruta en Strapi:** `Settings` → `Users & Permissions Plugin` → `Providers` → `Google`.

### Checklist de Google

- [ ] **Client ID (en Strapi):**
  - **Verificación:** El valor debe ser una cadena larga que termina en `.apps.googleusercontent.com`.
  - **Ubicación:** Lo encuentras en Google Cloud Console → `APIs & Services` → `Credentials`.

- [ ] **Client Secret (en Strapi):**
  - **Verificación:** Debe ser el **OAuth client secret** del mismo cliente. **NO** es una API Key.
  - **Ubicación:** Google Cloud → `APIs & Services` → `Credentials` → `OAuth 2.0 Client IDs` → Haz clic en el nombre de tu cliente web para ver el `Client secret`.

- [ ] **Authorized redirect URIs (en Google Cloud Console):**
  - **Verificación:** La lista debe contener **exactamente** la siguiente URL del backend de Strapi.
  - **URL requerida:**
    ```
    https://graceful-bear-073b8037ba.strapiapp.com/api/connect/google/callback
    ```

- [ ] **Front-end redirect URL (en Strapi):**
  - **Verificación:** El campo "The redirect URL to your front-end app" debe apuntar a la página de callback de tu aplicación Next.js.
  - **URL requerida:**
    ```
    https://vestigio-6zsdplw2b-facundocanepas-projects.vercel.app/auth/callback
    ```

- [ ] **Consent Screen (en Google Cloud Console):**
  - **Verificación:** El estado de publicación debe ser **"In production"**. Si está en "Testing", tu cuenta de Google debe estar explícitamente añadida a la lista de "Test users".

### Prueba Esperada (Google)

Al iniciar el flujo de login con Google, deberías ser redirigido a la página de selección de cuentas de Google y, tras aceptarlo, volver a tu aplicación a una URL como esta:

`https://vestigio-6zsdplw2b-facundocanepas-projects.vercel.app/auth/callback?access_token=...`

---

## 2. Configuración de Facebook

**Ruta en Strapi:** `Settings` → `Users & Permissions Plugin` → `Providers` → `Facebook`.

### Checklist de Facebook

- [ ] **App Domains (en Meta for Developers):**
  - **Ubicación:** `Settings` → `Basic`
  - **Verificación:** La lista debe contener los dominios tanto de tu backend (Strapi) como de tu frontend (Next.js), sin `https://`.
  - **Dominios requeridos:**
    - `graceful-bear-073b8037ba.strapiapp.com`
    - `vestigio-6zsdplw2b-facundocanepas-projects.vercel.app`

- [ ] **Website URL (en Meta for Developers):**
  - **Ubicación:** `Add Platform` → `Website` → `Site URL`.
  - **Verificación:** Debe ser la URL completa de tu frontend.
  - **URL requerida:**
    ```
    https://vestigio-6zsdplw2b-facundocanepas-projects.vercel.app
    ```

- [ ] **Valid OAuth Redirect URIs (en Meta for Developers):**
  - **Ubicación:** `Facebook Login` (en el menú de la izquierda) → `Settings`.
  - **Verificación:** La lista debe contener **exactamente** la URL de callback de Strapi.
  - **URL requerida:**
    ```
    https://graceful-bear-073b8037ba.strapiapp.com/api/connect/facebook/callback
    ```

- [ ] **Front-end redirect URL (en Strapi):**
  - **Verificación:** El campo de redirección en la configuración del proveedor de Facebook en Strapi debe apuntar al callback de tu frontend.
  - **URL requerida:**
    ```
    https://vestigio-6zsdplw2b-facundocanepas-projects.vercel.app/auth/callback
    ```

- [ ] **Modo de la App (en Meta for Developers):**
  - **Verificación:** Si la app está en modo **"Development"**, tu cuenta personal de Facebook debe tener un rol asignado en la sección `Roles` → `Roles` de la app de Meta. Si está en modo **"Live"**, es accesible para todos.

### Prueba Esperada (Facebook)

Al iniciar el flujo, deberías ser redirigido a Facebook y, tras aceptar, volver a tu aplicación a la URL:

`https://vestigio-6zsdplw2b-facundocanepas-projects.vercel.app/auth/callback?access_token=...`

---

## 3. Diagnóstico Rápido (Qué mirar en la URL)

Observa la barra de direcciones del navegador después de la redirección desde el proveedor. Te dirá cuál es el problema.

- **Si la URL es `/auth/callback?error=invalid_client`:**
  - **Causa (Google):** El `Client Secret` en Strapi es incorrecto, o la `Authorized redirect URI` no está en la lista de permitidos en Google Cloud Console. Revisa el checklist de Google.

- **Si Facebook muestra un error de "No se puede cargar la URL":**
  - **Causa (Facebook):** Falta alguna de estas configuraciones en Meta for Developers: `App Domains`, `Website URL` o `Valid OAuth Redirect URIs`. Revisa el checklist de Facebook.

- **Si vuelves a `/auth/callback` pero sin `access_token` y sin `error`:**
  - **Causa:** El campo **"Front-end redirect URL"** dentro de la configuración del proveedor en **Strapi** está mal configurado o no coincide exactamente con el dominio de tu frontend.
