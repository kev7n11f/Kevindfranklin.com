import { handleCors } from './utils/response.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  handleCors(req, res);

  res.status(200).json({
    success: true,
    message: 'Email Assistant API is running',
    timestamp: new Date().toISOString(),
  });
}
