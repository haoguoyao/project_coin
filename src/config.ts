const config = {
  apiBaseUrl: import.meta.env.PROD
    ? ''  // In production, API requests will be proxied through the same domain
    : 'http://localhost:3001'
};

export default config; 