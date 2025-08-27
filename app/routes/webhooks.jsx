// app/routes/webhooks.jsx

import { authenticate } from "../shopify.server";
import db from "../db.server"; // La importación en sí está bien aquí.

// ¡CRÍTICO! TODA la lógica que usa 'db' o 'authenticate' debe ir DENTRO de esta función.
export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  if (!session) {
    // Si no hay sesión, responde con un error y termina.
    return new Response("No session found", { status: 401 });
  }

  // Ahora puedes usar la lógica del servidor de forma segura.
  switch (topic) {
    case "APP_UNINSTALLED":
      console.log("App desinstalada en la tienda:", shop);
      // Aquí puedes hacer operaciones con la base de datos de forma segura
      // await db.session.deleteMany({ where: { shop } });
      break;
    case "ORDERS_CREATE":
      // Lógica para cuando se crea una orden...
      break;
    case "PRODUCTS_UPDATE":
      // Lógica para cuando se actualiza un producto...
      break;
  }

  // Siempre devuelve una respuesta al final.
  return new Response(null, { status: 200 });
};