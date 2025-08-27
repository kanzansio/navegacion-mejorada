import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Esta es la función de servidor que maneja todas las peticiones de webhooks de Shopify.
 * Se ejecuta de forma segura en el servidor, nunca en el navegador del cliente.
 * @param {object} context - El contexto de la petición, que incluye el objeto `request`.
 * @returns {Response} - Una respuesta HTTP para Shopify.
 */
export const action = async ({ request }) => {
  // `authenticate.webhook` verifica la firma de la petición para asegurar que viene de Shopify.
  const { topic, shop, session } = await authenticate.webhook(request);

  // Si la sesión es nula, significa que la autenticación falló. Respondemos con un error.
  if (!session) {
    return new Response("Webhook authentication failed", { status: 401 });
  }

  // Usamos una estructura `switch` para manejar diferentes tipos de webhooks.
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        console.log(`Webhook 'APP_UNINSTALLED' recibido para la tienda: ${shop}`);
        // Cuando un comerciante desinstala la app, borramos su sesión de nuestra base de datos.
        await db.session.deleteMany({ where: { shop } });
        console.log(`Sesiones de la base de datos borradas para la tienda ${shop}.`);
      }
      break;

    // Estos son webhooks obligatorios para cumplir con las políticas de GDPR de Shopify.
    case "CUSTOMERS_DATA_REQUEST":
      console.log(`Webhook 'CUSTOMERS_DATA_REQUEST' (GDPR) recibido para la tienda: ${shop}`);
      // Aquí añadirías tu lógica para recopilar y enviar los datos de un cliente.
      break;
    case "CUSTOMERS_REDACT":
      console.log(`Webhook 'CUSTOMERS_REDACT' (GDPR) recibido para la tienda: ${shop}`);
      // Aquí añadirías tu lógica para borrar los datos de un cliente de tu base de datos.
      break;
    case "SHOP_REDACT":
      console.log(`Webhook 'SHOP_REDACT' (GDPR) recibido para la tienda: ${shop}`);
      // Aquí añadirías tu lógica para borrar todos los datos asociados a una tienda.
      break;

    default:
      // Si recibimos un webhook que no estamos manejando explícitamente, lo registramos.
      console.log(`Webhook recibido para un tema no manejado: ${topic}`);
      // Aún así, devolvemos un 200 para que Shopify no siga intentando enviarlo.
      break;
  }

  // Es crucial devolver siempre una respuesta exitosa (200) a Shopify.
  // Esto le confirma a Shopify que hemos recibido y procesado el webhook correctamente.
  return new Response(null, { status: 200 });
};