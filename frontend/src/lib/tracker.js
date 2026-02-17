import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase, hasSupabase } from "./supabase";

const EVENTS_KEY = "wbc_events";

function getCurrentUser() {
  return {
    user_name: localStorage.getItem("wbc_user") || "Unknown",
    user_role: localStorage.getItem("wbc_user_role") || "unknown",
  };
}

export function trackEvent(eventType, meta = {}) {
  const user = getCurrentUser();
  const { page, entity_type, entity_id, ...extra } = meta;
  const event = {
    ...user,
    event_type: eventType,
    page: page || window.location.pathname,
    entity_type: entity_type || null,
    entity_id: entity_id || null,
    metadata: Object.keys(extra).length ? JSON.stringify(extra) : null,
    created_at: new Date().toISOString(),
  };

  if (hasSupabase) {
    supabase.from("events").insert(event).then(() => {});
  }

  const all = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  event.id = all.length ? Math.max(...all.map((e) => e.id)) + 1 : 1;
  all.push(event);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(all));
}

export async function getEvents(filters = {}) {
  if (hasSupabase) {
    let query = supabase.from("events").select("*").order("created_at", { ascending: false });
    if (filters.event_type) query = query.eq("event_type", filters.event_type);
    if (filters.user_name) query = query.eq("user_name", filters.user_name);
    if (filters.user_role) query = query.eq("user_role", filters.user_role);
    if (filters.entity_id) query = query.eq("entity_id", filters.entity_id);
    if (filters.since) query = query.gte("created_at", filters.since);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  let all = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  if (filters.event_type) all = all.filter((e) => e.event_type === filters.event_type);
  if (filters.user_name) all = all.filter((e) => e.user_name === filters.user_name);
  if (filters.user_role) all = all.filter((e) => e.user_role === filters.user_role);
  if (filters.entity_id) all = all.filter((e) => e.entity_id === filters.entity_id);
  if (filters.since) all = all.filter((e) => new Date(e.created_at) >= new Date(filters.since));
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function usePageTracker() {
  const location = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      if (localStorage.getItem("wbc_auth") === "true") {
        trackEvent("page_view", { page: location.pathname });
      }
    }
  }, [location.pathname]);
}
