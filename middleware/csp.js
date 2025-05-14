/**
 * Express middleware to set Content Security Policy allowing Supabase connections.
 */
module.exports = function cspMiddleware(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' https://iafamwvctehdltqmnhyx.supabase.co;"
  );
  next();
};