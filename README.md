git # Vestigio Magazine

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Google Analytics Integration

This project uses Google Analytics 4 (GA4) for tracking page views and powering the admin dashboard analytics.

### Client-Side Tracking (gtag)

- **Variable**: `NEXT_PUBLIC_GA_ID`
- **Purpose**: This is your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`). It is public and used in `app/layout.tsx` to inject the Google Analytics script for tracking page views.
- **Usage**: Add this variable to your `.env.local` file or your hosting provider's environment variables.

### Server-Side API (Google Analytics Data API)

- **Variable**: `GA4_PROPERTY_ID`
  - **Purpose**: This is the numeric ID of your GA4 property (e.g., `123456789`). It is used on the server to fetch data for the admin dashboard.
  - **Location**: You can find this in Google Analytics under `Admin > Property Settings`.

- **Variable**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
  - **Purpose**: This is the JSON content of a Google Cloud Service Account key. It is required for the server to authenticate with the Google Analytics Data API securely.
  - **Security**: **This is a sensitive credential and must never be exposed to the client-side.** Store it securely in your environment variables.

### How to Create Service Account Credentials

1.  **Go to Google Cloud Console**: Navigate to the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts).
2.  **Select Your Project**: Choose the Google Cloud project associated with your application.
3.  **Create Service Account**:
    *   Click **+ CREATE SERVICE ACCOUNT**.
    *   Give it a name (e.g., "GA4 Data API Reader").
    *   Click **CREATE AND CONTINUE**.
    *   In the "Grant this service account access to project" step, you don't need to add any roles here. Click **CONTINUE**.
    *   Click **DONE**.
4.  **Create a Key**:
    *   Find the newly created service account in the list.
    *   Click the three-dot menu (Actions) and select **Manage keys**.
    *   Click **ADD KEY** > **Create new key**.
    *   Choose **JSON** as the key type and click **CREATE**. A JSON file will be downloaded to your computer.
5.  **Add Service Account to Google Analytics**:
    *   Open your Google Analytics property.
    *   Go to **Admin > Property Access Management**.
    *   Click the **+** button and select **Add users**.
    *   In the "Email addresses" field, paste the `client_email` from the JSON file you downloaded.
    *   Under "Roles", assign the **Viewer** role. This provides read-only access, which is sufficient and secure.
    *   Click **Add**.
6.  **Set Environment Variable**:
    *   Copy the **entire content** of the downloaded JSON file.
    *   Create a new environment variable named `GOOGLE_APPLICATION_CREDENTIALS_JSON` and paste the JSON content as its value. Ensure it's a single line if your environment requires it.

## Flujo de comentarios

- **Variable obligatoria**: `NEXT_PUBLIC_STRAPI_URL` define la URL base de Strapi usada por todos los proxys (`/api/strapi/**`).
- **Autorización**:
  - `GET /api/strapi/comments` y `GET /api/strapi/articles/:id/comments` son públicos y normalizan la respuesta para exponer solamente `author.displayName` y ocultar `users_permissions_user`.
  - `POST /api/strapi/comments`, `PUT /api/strapi/comments/:id` y `DELETE /api/strapi/comments/:id` exigen sesión activa; el controlador valida que el usuario autenticado sea el dueño del comentario.
- **Rate limiting**: el `POST /api/strapi/comments` está limitado a 5 solicitudes por minuto combinando usuario (`Authorization`/`x-user-id`) o IP (`x-forwarded-for`). Excede el límite → `429` con cabecera `Retry-After`.
- **Observabilidad**:
  - Cada operación registra logs con `commentId`, `userId` y `articleId`.
  - Se exponen contadores in-memory para métodos HTTP (`GET/POST/PUT/DELETE`).
  - Al inicializar, se ejecuta una migración puntual que rellena `author_displayName` ausente usando los datos del usuario o el fallback "Usuario".

### DTO de comentarios

**Solicitud (`POST /api/strapi/comments`)**

```json
{
  "data": {
    "content": "Texto del comentario",
    "article": { "id": 123 },
    "estado": "approved",
    "parent": { "id": 456 }
  }
}
```

- `content`: requerido, se sanitiza y rechaza cadenas vacías.
- `article`: requerido; admite objeto Strapi (por `id`, `documentId`, `connect`, etc.).
- `estado`: opcional, validado contra el enum del modelo.
- `parent`: opcional para hilos (los hijos se resuelven en Strapi).

**Respuesta normalizada**

```json
{
  "data": {
    "id": 501,
    "attributes": {
      "content": "Texto del comentario",
      "estado": "approved",
      "author": { "displayName": "Nombre visible" },
      "children": { "data": [] }
    }
  }
}
```

El backend sólo expone la instantánea `author.displayName`; nunca retorna `users_permissions_user`.

### Checklist rápido

- Roles y ownership: sólo el autor puede actualizar/eliminar sus comentarios; terceros reciben `403`.
- Variables de entorno: `NEXT_PUBLIC_STRAPI_URL` requerida para el proxy.
- Endpoints de Next protegidos: mutaciones dependen del header `Authorization` (o sesión equivalente) y aplican rate limiting.
- Manejo de errores: validaciones de campos (`content`, `article`, `estado`) con respuestas `400`, `401`, `403` o `404` según corresponda.
- Migración: valores antiguos sin `author_displayName` se completan automáticamente en el primer acceso.
- Tests: `npm run test` ejecuta suites de DTO, controlador y rate limiting.