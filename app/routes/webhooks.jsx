  import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (!shop) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(`Received webhook. Topic: ${topic}, Shop: ${shop}`);

  switch (topic) {
    case "APP_UNINSTALLED":
      // Lógica para cuando se desinstala la app
      break;
    case "CUSTOMERS_DATA_REQUEST":
      // Lógica para la solicitud de datos del cliente
      break;
    case "CUSTOMERS_REDACT":
      // Lógica para la eliminación de datos del cliente
      break;
    case "SHOP_REDACT":
      // Lógica para la eliminación de datos de la tienda
      break;
    default:
      console.log(`Unhandled webhook topic: ${topic}`);
      break;
  }

  return new Response(null, { status: 200 });
};
