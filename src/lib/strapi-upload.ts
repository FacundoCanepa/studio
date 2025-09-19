import { validateImage } from './strapi-media-config';

/**
 * Uploads a file using the internal API that proxies the request to Strapi.
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
    Aplicar el mismo guard ya usado en /admin/articles y /admin/categories:

    Solo roles Administrador o Empleado acceden a /admin/authors, /new, /edit/[documetId].
    
    Si no cumple, redirigir o mostrar “Acceso restringido”.
    
    Centralizar en layout o middleware para no duplicar.
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: unknown = JSON.parse(xhr.responseText);

            if (Array.isArray(response)) {
              const first = response[0];
              if (first && typeof (first as any).id === 'number') {
                resolve((first as any).id);
                return;
              }
            } else if (response && typeof response === 'object') {
              const body = response as { id?: number; asset?: { id?: number }; error?: string };
              if (typeof body.id === 'number') {
                resolve(body.id);
                return;
              }
              if (body.asset && typeof body.asset.id === 'number') {
                resolve(body.asset.id);
                return;
              }
              if (body.error) {
                reject(new Error(body.error));
                return;
              }
            }

            reject(new Error('Respuesta de subida inválida desde el servidor.'));
          } catch (e) {
            reject(new Error('Error al parsear la respuesta de subida.'));
          }
        } else {
          reject(new Error(`Error en la subida: ${xhr.status} ${xhr.responseText}`));
        }
      }
    };
    
    // 4. POST to the Strapi upload endpoint.

    // 4. POST to the internal Strapi upload endpoint.
    xhr.open('POST', '/api/strapi/upload');
    // 5. Authorization headers are handled on the server; FormData sets Content-Type automatically.
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
