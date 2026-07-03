const { respond } = require("../middleware");
const localStorage = require("../repositories/localStorage");
const supabaseStorage = require("../repositories/supabaseStorage");
const { normalizeLead } = require("../services/leadService");

async function loadLeads(workspaceId) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.listLeads(workspaceId);
  }
  return localStorage.listLeads(workspaceId);
}

async function saveLead(workspaceId, data) {
  const lead = normalizeLead(data);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.upsertLead(workspaceId, lead);
  }
  return localStorage.upsertLead(workspaceId, lead);
}

async function patchLead(workspaceId, patch) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.updateOutreach(workspaceId, patch);
  }
  return localStorage.updateOutreach(workspaceId, patch);
}

async function ensureAdmin() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.ensureAdmin();
  }
  return localStorage.ensureAdmin();
}

async function findUser(workspaceId, email) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.findUser(workspaceId, email);
  }
  return localStorage.findUser(workspaceId, email);
}

async function createUser(workspaceId, user) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStorage.createUser(workspaceId, user);
  }
  return localStorage.createUser(workspaceId, user);
}

module.exports = {
  loadLeads,
  saveLead,
  patchLead,
  ensureAdmin,
  findUser,
  createUser
};
