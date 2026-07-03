module.exports = {
  appName: process.env.APP_NAME || "MEUS-ARQUIVOS",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  port: Number(process.env.PORT || 3000),
  env: process.env.NODE_ENV || "development",
  apiKey: process.env.APP_API_KEY || process.env.API_KEY || "dev-api-key-change-me",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-change-me",
  adminEmail: (process.env.ADMIN_EMAIL || "admin@meus-arquivos.local").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123456",
  
  storage: process.env.STORAGE || "local",
  supabaseUrl: process.env.SUPABASE_URL || "http://localhost:54321",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  
  evolutionApiUrl: (process.env.EVOLUTION_API_URL || (process.env.CONTAINER_MODE === "true" ? "http://evolution-api:8080" : "http://localhost:8080")).replace(/\/$/, ""),
  evolutionInstance: process.env.EVOLUTION_INSTANCE || "MEUS-ARQUIVOS",
  evolutionApiKey: process.env.EVOLUTION_API_KEY || "",
  
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
};
