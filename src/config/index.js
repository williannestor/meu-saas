module.exports = {
  appName: process.env.APP_NAME || "MEUS-ARQUIVOS",
  appUrl: process.env.APP_URL || "https://app.meus-arquivos.local",
  port: Number(process.env.PORT || 3000),
  env: process.env.NODE_ENV || "development",
  apiKey: process.env.EVOLUTION_API_KEY || process.env.API_KEY || "dev-api-key-change-me",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret-change-me",
  adminEmail: (process.env.ADMIN_EMAIL || "admin@meus-arquivos.local").toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123456",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  evolutionApiUrl: (process.env.EVOLUTION_API_URL || "https://evolution.meus-arquivos.local").replace(/\/$/, ""),
  evolutionInstance: process.env.EVOLUTION_INSTANCE || "MEUS-ARQUIVOS",
  evolutionApiKey: process.env.EVOLUTION_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
};
