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
