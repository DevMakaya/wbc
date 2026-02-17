import { supabase, hasSupabase } from "./supabase";
import defaultLenders from "../data/lenders.json";
import defaultPipeline from "../data/pipeline.json";
import defaultUsers from "../data/users.json";

const LENDERS_KEY = "wbc_lenders";
const PIPELINE_KEY = "wbc_pipeline";

function initLocal(key, defaults) {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export async function getLenders() {
  if (hasSupabase) {
    const { data, error } = await supabase.from("lenders").select("*").order("id");
    if (!error && data?.length) return data;
    if (!error) {
      const clean = defaultLenders.map(({ id, ...rest }) => rest);
      await supabase.from("lenders").insert(clean);
      const { data: seeded } = await supabase.from("lenders").select("*").order("id");
      if (seeded?.length) return seeded;
    }
  }
  return initLocal(LENDERS_KEY, defaultLenders);
}

export async function getLender(id) {
  if (hasSupabase) {
    const { data } = await supabase
      .from("lenders")
      .select("*")
      .eq("id", id)
      .single();
    if (data) return data;
  }
  const all = initLocal(LENDERS_KEY, defaultLenders);
  return all.find((l) => l.id === Number(id)) || null;
}

export async function upsertLenders(rows) {
  if (hasSupabase) {
    const { error } = await supabase.from("lenders").upsert(rows);
    if (!error) return true;
  }
  const existing = initLocal(LENDERS_KEY, defaultLenders);
  const idMap = new Map(existing.map((r) => [r.id, r]));
  let nextId = Math.max(...existing.map((r) => r.id), 0) + 1;
  for (const row of rows) {
    if (row.id && idMap.has(row.id)) {
      idMap.set(row.id, { ...idMap.get(row.id), ...row });
    } else {
      row.id = nextId++;
      idMap.set(row.id, row);
    }
  }
  const updated = Array.from(idMap.values()).sort((a, b) => a.id - b.id);
  saveLocal(LENDERS_KEY, updated);
  return true;
}

export async function getPipeline() {
  if (hasSupabase) {
    const { data, error } = await supabase.from("pipeline").select("*").order("id");
    if (!error && data?.length) return data;
    if (!error) {
      const clean = defaultPipeline.map(({ id, ...rest }) => rest);
      await supabase.from("pipeline").insert(clean);
      const { data: seeded } = await supabase.from("pipeline").select("*").order("id");
      if (seeded?.length) return seeded;
    }
  }
  return initLocal(PIPELINE_KEY, defaultPipeline);
}

export async function getDeal(id) {
  if (hasSupabase) {
    const { data } = await supabase
      .from("pipeline")
      .select("*")
      .eq("id", id)
      .single();
    if (data) return data;
  }
  const all = initLocal(PIPELINE_KEY, defaultPipeline);
  return all.find((p) => p.id === Number(id)) || null;
}

export const getProspect = getDeal;

export async function upsertPipeline(rows) {
  if (hasSupabase) {
    const { error } = await supabase.from("pipeline").upsert(rows);
    if (!error) return true;
  }
  const existing = initLocal(PIPELINE_KEY, defaultPipeline);
  const idMap = new Map(existing.map((r) => [r.id, r]));
  let nextId = Math.max(...existing.map((r) => r.id), 0) + 1;
  for (const row of rows) {
    if (row.id && idMap.has(row.id)) {
      idMap.set(row.id, { ...idMap.get(row.id), ...row });
    } else {
      row.id = nextId++;
      idMap.set(row.id, row);
    }
  }
  const updated = Array.from(idMap.values()).sort((a, b) => a.id - b.id);
  saveLocal(PIPELINE_KEY, updated);
  return true;
}

export async function createLender(data) {
  if (hasSupabase) {
    const { id, ...rest } = data;
    const { data: row, error } = await supabase.from("lenders").insert(rest).select().single();
    if (!error && row) return row;
  }
  const all = initLocal(LENDERS_KEY, defaultLenders);
  data.id = all.length ? Math.max(...all.map((l) => l.id)) + 1 : 1;
  all.push(data);
  saveLocal(LENDERS_KEY, all);
  return data;
}

export async function updateLender(id, updates) {
  if (hasSupabase) {
    const { error } = await supabase.from("lenders").update(updates).eq("id", id);
    if (!error) return true;
  }
  const all = initLocal(LENDERS_KEY, defaultLenders);
  const idx = all.findIndex((l) => l.id === Number(id));
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    saveLocal(LENDERS_KEY, all);
  }
  return true;
}

export async function createPipelineRecord(data) {
  if (hasSupabase) {
    const { id, ...rest } = data;
    const { data: row, error } = await supabase.from("pipeline").insert(rest).select().single();
    if (!error && row) return row;
  }
  const all = initLocal(PIPELINE_KEY, defaultPipeline);
  const record = { ...data, id: all.length ? Math.max(...all.map((r) => r.id)) + 1 : 1 };
  all.push(record);
  saveLocal(PIPELINE_KEY, all);
  return record;
}

export async function updatePipelineRecord(id, updates) {
  if (hasSupabase) {
    const { error } = await supabase.from("pipeline").update(updates).eq("id", id);
    if (!error) return true;
  }
  const all = initLocal(PIPELINE_KEY, defaultPipeline);
  const idx = all.findIndex((p) => p.id === Number(id));
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    saveLocal(PIPELINE_KEY, all);
  }
  return true;
}

const NOTES_KEY = "wbc_notes";
const CHANGELOG_KEY = "wbc_changelog";
const DOCUMENTS_KEY = "wbc_documents";

export async function getNotes(entityType, entityId) {
  if (hasSupabase) {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  return all
    .filter((n) => n.entity_type === entityType && n.entity_id === Number(entityId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function addNote(entityType, entityId, text) {
  const user = localStorage.getItem("wbc_user") || "Unknown";
  const note = {
    entity_type: entityType,
    entity_id: Number(entityId),
    user_name: user,
    text,
    created_at: new Date().toISOString(),
  };
  if (hasSupabase) {
    const { error } = await supabase.from("notes").insert(note);
    if (!error) return true;
  }
  const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  note.id = all.length ? Math.max(...all.map((n) => n.id)) + 1 : 1;
  all.push(note);
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
  return true;
}

export async function logChange({ entity_type, entity_id, entity_name, field, old_value, new_value }) {
  const user = localStorage.getItem("wbc_user") || "Unknown";
  const entry = {
    user_name: user,
    entity_type,
    entity_id: Number(entity_id),
    entity_name: entity_name || "",
    field,
    old_value: String(old_value ?? ""),
    new_value: String(new_value ?? ""),
    created_at: new Date().toISOString(),
  };
  if (hasSupabase) {
    const { error } = await supabase.from("changelog").insert(entry);
    if (!error) return true;
  }
  const all = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || "[]");
  entry.id = all.length ? Math.max(...all.map((e) => e.id)) + 1 : 1;
  all.push(entry);
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(all));
  return true;
}

export async function getChangelog(entityType, entityId) {
  if (hasSupabase) {
    let query = supabase.from("changelog").select("*").order("created_at", { ascending: false });
    if (entityType) query = query.eq("entity_type", entityType);
    if (entityId) query = query.eq("entity_id", entityId);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  let all = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || "[]");
  if (entityType) all = all.filter((e) => e.entity_type === entityType);
  if (entityId) all = all.filter((e) => e.entity_id === Number(entityId));
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getDocuments(dealId, folder) {
  if (hasSupabase) {
    let query = supabase
      .from("documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("uploaded_at", { ascending: false });
    if (folder) query = query.eq("folder", folder);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  let all = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || "[]");
  all = all.filter((d) => d.deal_id === Number(dealId));
  if (folder) all = all.filter((d) => d.folder === folder);
  return all.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
}

export async function saveDocumentMeta(meta) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("documents").insert(meta).select().single();
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || "[]");
  meta.id = all.length ? Math.max(...all.map((d) => d.id)) + 1 : 1;
  all.push(meta);
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
  return meta;
}

export async function deleteDocumentMeta(docId) {
  if (hasSupabase) {
    await supabase.from("documents").delete().eq("id", docId);
    return true;
  }
  let all = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || "[]");
  all = all.filter((d) => d.id !== docId);
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(all));
  return true;
}

const USERS_KEY = "wbc_users";
const DEAL_ACCESS_KEY = "wbc_deal_access";

function initUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  const seeded = defaultUsers.map((u, i) => ({
    ...u,
    id: u.id || i + 1,
    role: u.role || (u.email === "admin@wbc.com" ? "admin" : "manager"),
    status: u.status || "active",
    created_at: u.created_at || new Date().toISOString(),
    created_by: "system",
    last_login: null,
  }));
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded));
  return seeded;
}

export async function getUsers() {
  if (hasSupabase) {
    const { data, error } = await supabase.from("app_users").select("*").order("id");
    if (!error && data?.length) return data;
    if (!error) {
      const seeded = defaultUsers.map((u) => ({
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role || (u.email === "admin@wbc.com" ? "admin" : "manager"),
        status: u.status || "active",
        created_at: new Date().toISOString(),
        created_by: "system",
        last_login: null,
      }));
      await supabase.from("app_users").insert(seeded);
      const { data: fresh } = await supabase.from("app_users").select("*").order("id");
      if (fresh?.length) return fresh;
    }
  }
  return initUsers();
}

export async function getUser(id) {
  if (hasSupabase) {
    const { data } = await supabase.from("app_users").select("*").eq("id", id).single();
    if (data) return data;
  }
  const all = initUsers();
  return all.find((u) => u.id === Number(id)) || null;
}

export async function createUser({ email, password, name, role }) {
  const creator = localStorage.getItem("wbc_user") || "Unknown";
  const user = {
    email,
    password,
    name,
    role: role || "manager",
    status: "active",
    created_at: new Date().toISOString(),
    created_by: creator,
    last_login: null,
  };
  if (hasSupabase) {
    const { data, error } = await supabase.from("app_users").insert(user).select().single();
    if (!error && data) return data;
  }
  const all = initUsers();
  user.id = all.length ? Math.max(...all.map((u) => u.id)) + 1 : 1;
  all.push(user);
  saveLocal(USERS_KEY, all);
  return user;
}

export async function updateUser(id, updates) {
  if (hasSupabase) {
    const { error } = await supabase.from("app_users").update(updates).eq("id", id);
    if (!error) return true;
  }
  const all = initUsers();
  const idx = all.findIndex((u) => u.id === Number(id));
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    saveLocal(USERS_KEY, all);
  }
  return true;
}

export async function deleteUser(id) {
  if (hasSupabase) {
    await supabase.from("app_users").delete().eq("id", id);
    return true;
  }
  let all = initUsers();
  all = all.filter((u) => u.id !== Number(id));
  saveLocal(USERS_KEY, all);
  return true;
}

export async function getDealAccess(dealId) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_access").select("*").eq("deal_id", dealId);
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(DEAL_ACCESS_KEY) || "[]");
  return all.filter((a) => a.deal_id === Number(dealId));
}

export async function getUserDealAccess(userId) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_access").select("*").eq("user_id", userId);
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(DEAL_ACCESS_KEY) || "[]");
  return all.filter((a) => a.user_id === Number(userId));
}

export async function getAllDealAccess() {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_access").select("*");
    if (!error && data) return data;
  }
  return JSON.parse(localStorage.getItem(DEAL_ACCESS_KEY) || "[]");
}

export async function grantDealAccess(userId, dealId) {
  const grantedBy = localStorage.getItem("wbc_user") || "Unknown";
  const access = {
    user_id: Number(userId),
    deal_id: Number(dealId),
    granted_by: grantedBy,
    granted_at: new Date().toISOString(),
  };
  if (hasSupabase) {
    const { error } = await supabase.from("deal_access").insert(access);
    if (!error) return true;
  }
  const all = JSON.parse(localStorage.getItem(DEAL_ACCESS_KEY) || "[]");
  if (!all.find((a) => a.user_id === access.user_id && a.deal_id === access.deal_id)) {
    access.id = all.length ? Math.max(...all.map((a) => a.id)) + 1 : 1;
    all.push(access);
    localStorage.setItem(DEAL_ACCESS_KEY, JSON.stringify(all));
  }
  return true;
}

export async function revokeDealAccess(userId, dealId) {
  if (hasSupabase) {
    await supabase.from("deal_access").delete().eq("user_id", userId).eq("deal_id", dealId);
    return true;
  }
  let all = JSON.parse(localStorage.getItem(DEAL_ACCESS_KEY) || "[]");
  all = all.filter((a) => !(a.user_id === Number(userId) && a.deal_id === Number(dealId)));
  localStorage.setItem(DEAL_ACCESS_KEY, JSON.stringify(all));
  return true;
}

const VARIABLES_KEY = "wbc_variables";
const FOLDERS_KEY = "wbc_folders";

const DEFAULT_VARIABLES = [
  { category: "pipeline_status", value: "Active" },
  { category: "pipeline_status", value: "On Hold" },
  { category: "pipeline_status", value: "Closed - Won" },
  { category: "pipeline_status", value: "Closed - Lost" },
  { category: "pipeline_status", value: "Closed - Mandate" },
  { category: "deal_stage", value: "1. Lead / Intake" },
  { category: "deal_stage", value: "2. Discovery & NDA" },
  { category: "deal_stage", value: "3. Internal Conviction & Approval" },
  { category: "deal_stage", value: "4. Preliminary Analysis (Two Pager)" },
  { category: "deal_stage", value: "5. Market Sounding & Client Engagement" },
  { category: "deal_stage", value: "6. Diligence & Financing Memo" },
  { category: "deal_stage", value: "7. Term Sheets & Negotiation" },
  { category: "deal_stage", value: "8. Term Sheet Signed & Closing" },
  { category: "deal_stage", value: "9. Closed" },
  { category: "wbc_product", value: "Lending" },
  { category: "wbc_product", value: "Advisory" },
  { category: "wbc_sub_product", value: "CRE" },
  { category: "wbc_sub_product", value: "Fund Finance" },
  { category: "wbc_sub_product", value: "Asset-Based" },
  { category: "wbc_sub_product", value: "Specialty" },
  { category: "client_type", value: "Individual" },
  { category: "client_type", value: "Company" },
  { category: "client_type", value: "Fund" },
  { category: "client_type", value: "Trust" },
  { category: "lead_source", value: "Referral" },
  { category: "lead_source", value: "Direct" },
  { category: "lead_source", value: "Website" },
  { category: "lead_source", value: "Conference" },
  { category: "sector", value: "Real Estate" },
  { category: "sector", value: "Finance" },
  { category: "sector", value: "Technology" },
  { category: "sector", value: "Healthcare" },
  { category: "sector", value: "Energy" },
  { category: "lender_type", value: "Bank" },
  { category: "lender_type", value: "Non-Bank" },
  { category: "lender_type", value: "Private Credit" },
  { category: "lender_type", value: "Family Office" },
];

function initVariables() {
  const stored = localStorage.getItem(VARIABLES_KEY);
  if (stored) return JSON.parse(stored);
  const seeded = DEFAULT_VARIABLES.map((v, i) => ({ ...v, id: i + 1, sort_order: i }));
  localStorage.setItem(VARIABLES_KEY, JSON.stringify(seeded));
  return seeded;
}

export async function getAllVariables() {
  if (hasSupabase) {
    const { data, error } = await supabase.from("app_variables").select("*").order("sort_order");
    if (!error && data?.length) return data;
    if (!error) {
      const seeded = DEFAULT_VARIABLES.map((v, i) => ({ ...v, sort_order: i }));
      await supabase.from("app_variables").insert(seeded);
      const { data: fresh } = await supabase.from("app_variables").select("*").order("sort_order");
      if (fresh?.length) return fresh;
    }
  }
  return initVariables();
}

export async function getVariables(category) {
  const all = await getAllVariables();
  return all.filter((v) => v.category === category);
}

export async function saveVariable({ category, value, sort_order }) {
  const record = { category, value, sort_order: sort_order ?? 0 };
  if (hasSupabase) {
    const { data, error } = await supabase.from("app_variables").insert(record).select().single();
    if (!error && data) return data;
  }
  const all = initVariables();
  record.id = all.length ? Math.max(...all.map((v) => v.id)) + 1 : 1;
  all.push(record);
  saveLocal(VARIABLES_KEY, all);
  return record;
}

export async function updateVariable(id, updates) {
  if (hasSupabase) {
    await supabase.from("app_variables").update(updates).eq("id", id);
    return true;
  }
  const all = initVariables();
  const idx = all.findIndex((v) => v.id === Number(id));
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; saveLocal(VARIABLES_KEY, all); }
  return true;
}

export async function deleteVariable(id) {
  if (hasSupabase) {
    await supabase.from("app_variables").delete().eq("id", id);
    return true;
  }
  let all = initVariables();
  all = all.filter((v) => v.id !== Number(id));
  saveLocal(VARIABLES_KEY, all);
  return true;
}

const DEFAULT_DEAL_FOLDERS = ["Closing Documents", "Monthly Reporting", "Due Diligence", "Correspondence", "Other"];

export async function getDealFolders(dealId) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_folders").select("*").eq("deal_id", Number(dealId)).order("sort_order");
    if (!error && data?.length) return data;
    if (!error) {
      const seeded = DEFAULT_DEAL_FOLDERS.map((name, i) => ({ deal_id: Number(dealId), name, sort_order: i, created_by: localStorage.getItem("wbc_user") || "system", created_at: new Date().toISOString() }));
      await supabase.from("deal_folders").insert(seeded);
      const { data: fresh } = await supabase.from("deal_folders").select("*").eq("deal_id", Number(dealId)).order("sort_order");
      if (fresh?.length) return fresh;
    }
  }
  const all = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  const existing = all.filter((f) => f.deal_id === Number(dealId));
  if (existing.length) return existing;
  const seeded = DEFAULT_DEAL_FOLDERS.map((name, i) => ({ id: all.length + i + 1, deal_id: Number(dealId), name, sort_order: i, created_by: localStorage.getItem("wbc_user") || "system", created_at: new Date().toISOString() }));
  all.push(...seeded);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(all));
  return seeded;
}

export async function createDealFolder(dealId, name) {
  const record = { deal_id: Number(dealId), name, sort_order: 999, created_by: localStorage.getItem("wbc_user") || "Unknown", created_at: new Date().toISOString() };
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_folders").insert(record).select().single();
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  record.id = all.length ? Math.max(...all.map((f) => f.id)) + 1 : 1;
  all.push(record);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(all));
  return record;
}

export async function deleteDealFolder(folderId) {
  if (hasSupabase) {
    await supabase.from("deal_folders").delete().eq("id", folderId);
    return true;
  }
  let all = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
  all = all.filter((f) => f.id !== Number(folderId));
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(all));
  return true;
}

const OUTREACH_KEY = "wbc_outreach";

export async function getDealOutreach(dealId) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_lender_outreach").select("*").eq("deal_id", Number(dealId)).order("id");
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(OUTREACH_KEY) || "[]");
  return all.filter((o) => o.deal_id === Number(dealId));
}

export async function addDealOutreach(data) {
  const record = { ...data, created_at: new Date().toISOString() };
  if (hasSupabase) {
    const { id, ...rest } = record;
    const { data: row, error } = await supabase.from("deal_lender_outreach").insert(rest).select().single();
    if (!error && row) return row;
  }
  const all = JSON.parse(localStorage.getItem(OUTREACH_KEY) || "[]");
  record.id = all.length ? Math.max(...all.map((o) => o.id)) + 1 : 1;
  all.push(record);
  localStorage.setItem(OUTREACH_KEY, JSON.stringify(all));
  return record;
}

export async function updateDealOutreach(id, updates) {
  if (hasSupabase) {
    await supabase.from("deal_lender_outreach").update(updates).eq("id", id);
    return true;
  }
  const all = JSON.parse(localStorage.getItem(OUTREACH_KEY) || "[]");
  const idx = all.findIndex((o) => o.id === Number(id));
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; localStorage.setItem(OUTREACH_KEY, JSON.stringify(all)); }
  return true;
}

export async function deleteDealOutreach(id) {
  if (hasSupabase) {
    await supabase.from("deal_lender_outreach").delete().eq("id", id);
    return true;
  }
  let all = JSON.parse(localStorage.getItem(OUTREACH_KEY) || "[]");
  all = all.filter((o) => o.id !== Number(id));
  localStorage.setItem(OUTREACH_KEY, JSON.stringify(all));
  return true;
}

const TERM_SHEETS_KEY = "wbc_term_sheets";

export async function getDealTermSheets(dealId) {
  if (hasSupabase) {
    const { data, error } = await supabase.from("deal_term_sheets").select("*").eq("deal_id", Number(dealId)).order("id");
    if (!error && data) return data;
  }
  const all = JSON.parse(localStorage.getItem(TERM_SHEETS_KEY) || "[]");
  return all.filter((t) => t.deal_id === Number(dealId));
}

export async function addTermSheet(data) {
  const record = { ...data, created_at: new Date().toISOString() };
  if (hasSupabase) {
    const { id, ...rest } = record;
    const { data: row, error } = await supabase.from("deal_term_sheets").insert(rest).select().single();
    if (!error && row) return row;
  }
  const all = JSON.parse(localStorage.getItem(TERM_SHEETS_KEY) || "[]");
  record.id = all.length ? Math.max(...all.map((t) => t.id)) + 1 : 1;
  all.push(record);
  localStorage.setItem(TERM_SHEETS_KEY, JSON.stringify(all));
  return record;
}

export async function updateTermSheet(id, updates) {
  if (hasSupabase) {
    await supabase.from("deal_term_sheets").update(updates).eq("id", id);
    return true;
  }
  const all = JSON.parse(localStorage.getItem(TERM_SHEETS_KEY) || "[]");
  const idx = all.findIndex((t) => t.id === Number(id));
  if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; localStorage.setItem(TERM_SHEETS_KEY, JSON.stringify(all)); }
  return true;
}

export async function deleteTermSheet(id) {
  if (hasSupabase) {
    await supabase.from("deal_term_sheets").delete().eq("id", id);
    return true;
  }
  let all = JSON.parse(localStorage.getItem(TERM_SHEETS_KEY) || "[]");
  all = all.filter((t) => t.id !== Number(id));
  localStorage.setItem(TERM_SHEETS_KEY, JSON.stringify(all));
  return true;
}
