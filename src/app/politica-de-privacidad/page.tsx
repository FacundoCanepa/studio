
import { Metadata } from 'next';
import * as React from 'react';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Conoce cómo manejamos tu información en Vestigio Magazine.',
};

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="container mx-auto max-w-4xl py-16 px-4 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold">Política de Privacidad</h1>
        <p className="mt-2 text-muted-foreground">Última actualización: 1 de Agosto de 2024</p>
      </header>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p>
          En Vestigio Magazine, respetamos tu privacidad y estamos comprometidos a proteger tus datos personales. Esta política de privacidad te informará sobre cómo cuidamos tus datos personales cuando visitas nuestro sitio web (independientemente de dónde lo visites) y te informará sobre tus derechos de privacidad y cómo la ley te protege.
        </p>

        <h2>1. Información que recopilamos</h2>
        <p>
          Podemos recopilar, usar, almacenar y transferir diferentes tipos de datos personales sobre ti, que hemos agrupado de la siguiente manera:
        </p>
        <ul>
          <li>
            <strong>Datos de Identidad:</strong> Incluyen nombre, apellido y nombre de usuario.
          </li>
          <li>
            <strong>Datos de Contacto:</strong> Incluyen dirección de correo electrónico.
          </li>
          <li>
            <strong>Datos Técnicos:</strong> Incluyen la dirección del protocolo de Internet (IP), tus datos de inicio de sesión, el tipo y la versión del navegador, la configuración de la zona horaria y la ubicación, los tipos y versiones de los complementos del navegador, el sistema operativo y la plataforma, y otra tecnología en los dispositivos que utilizas para acceder a este sitio web.
          </li>
          <li>
            <strong>Datos de Uso:</strong> Incluyen información sobre cómo utilizas nuestro sitio web, productos y servicios.
          </li>
        </ul>

        <h2>2. Cómo usamos tu información</h2>
        <p>
          Utilizaremos tus datos personales en las siguientes circunstancias:
        </p>
        <ul>
          <li>Cuando necesitemos cumplir con el contrato que estamos a punto de celebrar o que hemos celebrado contigo.</li>
          <li>Cuando sea necesario para nuestros intereses legítimos (o los de un tercero) y tus intereses y derechos fundamentales no prevalezcan sobre dichos intereses.</li>
          <li>Cuando necesitemos cumplir con una obligación legal o regulatoria.</li>
        </ul>

        <h2>3. Seguridad de los datos</h2>
        <p>
          Hemos implementado medidas de seguridad apropiadas para evitar que tus datos personales se pierdan accidentalmente, se usen o se acceda a ellos de forma no autorizada, se alteren o se divulguen. Además, limitamos el acceso a tus datos personales a aquellos empleados, agentes, contratistas y otros terceros que tienen una necesidad comercial de conocerlos.
        </p>

        <h2>4. Tus derechos legales</h2>
        <p>
          En determinadas circunstancias, tienes derechos en virtud de las leyes de protección de datos en relación con tus datos personales. Estos incluyen el derecho a solicitar acceso, corrección, eliminación, restricción, transferencia, y a oponerte al procesamiento, así como el derecho a retirar el consentimiento.
        </p>

        <h2>5. Contacto</h2>
        <p>
          Si tienes alguna pregunta sobre esta política de privacidad, incluidas las solicitudes para ejercer tus derechos legales, por favor contáctanos a través de nuestro correo electrónico de soporte: <a href="mailto:soporte@vestigiomagazine.com">soporte@vestigiomagazine.com</a>.
        </p>
      </div>
    </div>
  );
}
