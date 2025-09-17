
'use server';

import {
  STRAPI_URL,
  STRAPI_API_TOKEN,
  validateImage,
  type StrapiAsset,
} from './strapi-media-config';

/**
 * Uploads a file to Strapi's Media Library.
 * This function uses XMLHttpRequest to support upload progress tracking.
 *
 * @param file The file to upload.
 * @param onProgress An optional callback function to track upload progress (0-100).
 * @returns A promise that resolves with the numeric ID of the uploaded asset.
 */
export function uploadFileToStrapi(
  file: File,
  onProgress?: (progress: number) => void
): Promise<number> {
  return new Promise((resolve, reject) => {
    // 1. Validate the image before proceeding.
    const validation = validateImage(file);
    if (!validation.ok) {
      // Throwing an error here allows the calling action to catch it and inform the UI.
      return reject(new Error(validation.error));
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('files', file, file.name);

    // 2. Add progress listener if onProgress callback is provided.
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded * 100) / event.total);
          onProgress(percentage);
        }
      };
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: StrapiAsset[] = JSON.parse(xhr.responseText);
            if (response && response[0]?.id) {
              resolve(response[0].id); // 3. Return the ID of the uploaded asset.
            } else {
              reject(new Error('Respuesta de subida inválida desde Strapi.'));
            }
          } catch (e) {
            reject(new Error('Error al parsear la respuesta de subida.'));
          }
        } else {
          reject(new Error(`Error en la subida: ${xhr.status} ${xhr.responseText}`));
        }
      }
    };
    
    // 4. POST to the Strapi upload endpoint.
    xhr.open('POST', `${STRAPI_URL}/api/upload`);
    // 5. Set Authorization header. Content-Type is set automatically by the browser for FormData.
    xhr.setRequestHeader('Authorization', `Bearer ${STRAPI_API_TOKEN}`);
    xhr.send(formData);
  });
}

/**
 * NOTE: Deleting a media relation in Strapi does not delete the file.
 * When an article's cover or carousel image is removed, we are only detaching the
 * relation (setting it to null or removing it from the list). The actual media asset
 * remains in the Strapi Media Library. This is standard Strapi behavior to prevent
 * accidental deletion of an asset that might be used elsewhere.
 */
export function deleteOnlyRelationNote() {
    console.log("Recordatorio: La eliminación de medios solo rompe la relación, no borra el archivo de la Media Library.");
}
