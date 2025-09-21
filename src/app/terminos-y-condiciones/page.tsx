
import { Metadata } from 'next';
import * as React from 'react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Lee los términos y condiciones de uso de Vestigio Magazine.',
};

export default function TerminosYCondicionesPage() {
  return (
    <div className="container mx-auto max-w-4xl py-16 px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Términos y Condiciones</h1>
        <p className="mt-2 text-muted-foreground">Última actualización: 1 de Agosto de 2024</p>
      </header>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          Bienvenido a Vestigio Magazine. Estos términos y condiciones describen las reglas y regulaciones para el uso del sitio web de Vestigio Magazine, ubicado en [URL de tu sitio web].
        </p>
        <p>
          Al acceder a este sitio web, asumimos que aceptas estos términos y condiciones. No continúes usando Vestigio Magazine si no estás de acuerdo con todos los términos y condiciones establecidos en esta página.
        </p>

        <h2>1. Licencia</h2>
        <p>
          A menos que se indique lo contrario, Vestigio Magazine y/o sus licenciantes poseen los derechos de propiedad intelectual de todo el material en Vestigio Magazine. Todos los derechos de propiedad intelectual están reservados. Puedes acceder a esto desde Vestigio Magazine para tu uso personal, sujeto a las restricciones establecidas en estos términos y condiciones.
        </p>
        <p>No debes:</p>
        <ul>
          <li>Republicar material de Vestigio Magazine</li>
          <li>Vender, alquilar o sublicenciar material de Vestigio Magazine</li>
          <li>Reproducir, duplicar o copiar material de Vestigio Magazine</li>
          <li>Redistribuir contenido de Vestigio Magazine</li>
        </ul>
        
        <h2>2. Cuentas de usuario</h2>
        <p>
          Si creas una cuenta en nuestro sitio web, eres responsable de mantener la seguridad de tu cuenta y eres totalmente responsable de todas las actividades que ocurran bajo la cuenta y cualquier otra acción tomada en conexión con ella. Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta o cualquier otra violación de seguridad.
        </p>
        
        <h2>3. Contenido del usuario</h2>
        <p>
          En estos términos y condiciones, "tu contenido de usuario" significará cualquier material de audio, video, texto, imágenes u otro material que elijas mostrar en este sitio web. Al mostrar tu contenido de usuario, otorgas a Vestigio Magazine una licencia no exclusiva, mundial, irrevocable y sublicenciable para usarlo, reproducirlo, adaptarlo, publicarlo, traducirlo y distribuirlo en cualquier medio.
        </p>
        
        <h2>4. Limitación de responsabilidad</h2>
        <p>
          En ningún caso Vestigio Magazine, ni ninguno de sus funcionarios, directores y empleados, será responsable de nada que surja o esté relacionado de alguna manera con tu uso de este sitio web, ya sea que dicha responsabilidad esté bajo contrato. Vestigio Magazine, incluidos sus funcionarios, directores y empleados, no será responsable de ninguna responsabilidad indirecta, consecuente o especial que surja de o esté relacionada de alguna manera con tu uso de este sitio web.
        </p>
        
        <h2>5. Cambios en los términos</h2>
        <p>
          Nos reservamos el derecho de revisar estos términos y condiciones en cualquier momento según lo consideremos oportuno. Al usar este sitio web, se espera que revises estos términos regularmente.
        </p>
      </div>
    </div>
  );
}
