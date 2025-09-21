'use server';

import { BetaAnalyticsDataClient } from '@google-analytics/data';

let analyticsDataClient: BetaAnalyticsDataClient | null = null;
let propertyId: string | null = null;

/**
 * Initializes and returns a singleton instance of the Google Analytics Data Client.
 * This function is server-only and relies on environment variables for configuration.
 */
function initializeGaClient() {
  if (analyticsDataClient) {
    return;
  }

  const ga4PropertyId = process.env.GA4_PROPERTY_ID;
  const googleAppCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!ga4PropertyId || ga4PropertyId === 'YOUR_GA4_PROPERTY_ID') {
    console.warn('[GA4_ENV] GA4_PROPERTY_ID environment variable is not set correctly. Google Analytics client will not be initialized.');
    return;
  }
  
  if (!googleAppCredsJson) {
    console.warn('[GA4_ENV] GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Google Analytics client will not be initialized.');
    return;
  }

  try {
    const credentials = JSON.parse(googleAppCredsJson);
    
    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });
    
    propertyId = ga4PropertyId;
    console.log('[GA4] Google Analytics Data Client initialized successfully.');

  } catch (error) {
    console.error('[GA4_ENV] Failed to initialize Google Analytics Data Client:', error);
    analyticsDataClient = null;
    propertyId = null;
  }
}

/**
 * Returns a configured singleton instance of the BetaAnalyticsDataClient and the property ID.
 * The client will be null if the environment variables are not correctly set.
 * 
 * @returns An object containing the client instance and property ID.
 */
export async function getGaClient(): Promise<{
  client: BetaAnalyticsDataClient | null;
  propertyId: string | null;
}> {
  if (!analyticsDataClient) {
    initializeGaClient();
  }
  return { client: analyticsDataClient, propertyId };
}
