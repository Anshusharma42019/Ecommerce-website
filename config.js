// ===== API CONFIGURATION =====
// Set IS_LOCAL to true for local development, false for production.

const IS_LOCAL = true;

const ENV = {
  LEADS_API:    'https://backend-triven-crm.vercel.app/api/v1/leads/submit',
  PRODUCTS_API: 'https://ecommerce-backend-xi-ten.vercel.app/api/v1',
  ORDERS_API: 'https://ecommerce-backend-xi-ten.vercel.app/api/v1',
};
// const ENV = {
//   LEADS_API:    'https://backend-triven-crm.vercel.app/api/v1/leads/submit',
//   PRODUCTS_API: IS_LOCAL ? 'http://localhost:5000/api/v1' : 'https://ecommerce-backend-xi-ten.vercel.app/api/v1',
//   ORDERS_API:   IS_LOCAL ? 'http://localhost:5000/api/v1' : 'https://ecommerce-backend-xi-ten.vercel.app/api/v1',
// };
