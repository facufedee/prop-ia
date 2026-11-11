#!/usr/bin/env node
// Evaluates firestore.rules against a test suite with the Firebase Rules API
// (projects.test). It only evaluates — nothing is deployed or released.
//
// Usage:
//   node scripts/test_firestore_rules.mjs
//   GOOGLE_OAUTH_ACCESS_TOKEN=$(gcloud auth print-access-token) node scripts/test_firestore_rules.mjs
//
// Env: GOOGLE_OAUTH_ACCESS_TOKEN (optional; falls back to `gcloud auth print-access-token`),
//      FIREBASE_PROJECT (default "prop-ia"), FIRESTORE_DATABASE (default "propia").

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT = process.env.FIREBASE_PROJECT || "prop-ia";
const DATABASE = process.env.FIRESTORE_DATABASE || "propia";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RULES = readFileSync(path.join(ROOT, "firestore.rules"), "utf8");

function accessToken() {
    if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) return process.env.GOOGLE_OAUTH_ACCESS_TOKEN.trim();
    return execSync("gcloud auth print-access-token", { encoding: "utf8", shell: true }).trim();
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const docPath = (p) => `/databases/${DATABASE}/documents/${p}`;

const ROLES = {
    role_super: { name: "Super Admin", permissions: ["/dashboard", "/dashboard/blog", "/dashboard/emprendimientos"] },
    role_admin: { name: "Administrador", permissions: ["/dashboard"] },
    role_basic: { name: "Cliente Básico", permissions: ["/dashboard", "/dashboard/propiedades"] },
    role_pro: { name: "Cliente Pro", permissions: ["/dashboard", "/dashboard/blog", "/dashboard/emprendimientos"] },
    role_agent: { name: "Agente", permissions: ["/dashboard", "/dashboard/blog"] },
};

const USERS = {
    owner: { email: "owner@agency.com", roleId: "role_basic" },
    other: { email: "other@agency.com", roleId: "role_basic" },
    pro: { email: "pro@agency.com", roleId: "role_pro" },
    superadmin: { email: "super@zeta.com", roleId: "role_super" },
    admin: { email: "admin@zeta.com", roleId: "role_admin" },
    agent: { email: "agent@agency.com", roleId: "role_agent", organizationId: "owner" },
    norole: { email: "norole@x.com" },
};

// Auth contexts
const anon = null;
const as = (uid, extraToken = {}) => {
    const email = USERS[uid]?.email ?? `${uid}@x.com`;
    return { uid, token: { email, email_verified: true, ...extraToken } };
};
const rootOwner = { uid: "root", token: { email: "facundoflores8@gmail.com", email_verified: true } };

function mock(fn, p, value) {
    return { function: fn, args: [{ exactValue: docPath(p) }], result: { value } };
}

// Mocks for the caller's users/{uid} doc and its role doc.
function actorMocks(auth) {
    if (!auth) return [];
    const u = USERS[auth.uid];
    if (!u) return [mock("exists", `users/${auth.uid}`, false)];
    const m = [mock("exists", `users/${auth.uid}`, true), mock("get", `users/${auth.uid}`, { data: u })];
    if (u.roleId) {
        m.push(mock("exists", `roles/${u.roleId}`, true), mock("get", `roles/${u.roleId}`, { data: ROLES[u.roleId] }));
    }
    return m;
}

// Mocks for any role doc (used by self-signup checks).
const allRoleMocks = () =>
    Object.entries(ROLES).flatMap(([id, data]) => [mock("exists", `roles/${id}`, true), mock("get", `roles/${id}`, { data })]);

// Fallbacks: anything else does not exist.
const fallbackMocks = [{ function: "exists", args: [{ anyValue: {} }], result: { value: false } }];

// ---------------------------------------------------------------------------
// Test case builder
// ---------------------------------------------------------------------------
const cases = [];
/**
 * t(name, expectation, { auth, method, path, data (existing resource), newData (request.resource), mocks })
 */
function t(name, expectation, { auth = anon, method, path: p, data, newData, mocks = [] }) {
    const request = { auth, path: docPath(p), method };
    if (newData !== undefined) request.resource = { data: newData };
    const tc = {
        expectation,
        request,
        functionMocks: [...mocks, ...actorMocks(auth), ...fallbackMocks],
    };
    if (data !== undefined) tc.resource = { data };
    cases.push({ name, tc });
}
const ALLOW = "ALLOW";
const DENY = "DENY";

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
t("users: anonymous get (public agency info)", ALLOW, { method: "get", path: "users/owner", data: USERS.owner });
t("users: anonymous list denied", DENY, { method: "list", path: "users/owner", data: USERS.owner });
t("users: other user list of a stranger denied", DENY, { auth: as("other"), method: "list", path: "users/owner", data: USERS.owner });
t("users: owner list by own id", ALLOW, { auth: as("owner"), method: "list", path: "users/owner", data: USERS.owner });
t("users: org owner lists its agents", ALLOW, { auth: as("owner"), method: "list", path: "users/agent", data: USERS.agent });
t("users: agent lists org members", ALLOW, { auth: as("agent"), method: "list", path: "users/agent2", data: { organizationId: "owner" } });
t("users: admin list", ALLOW, { auth: as("superadmin"), method: "list", path: "users/owner", data: USERS.owner });
t("users: platform owner email list", ALLOW, { auth: rootOwner, method: "list", path: "users/owner", data: USERS.owner });
t("users: self signup with default role", ALLOW, {
    auth: as("newbie"), method: "create", path: "users/newbie",
    newData: { email: "newbie@x.com", roleId: "role_basic", displayName: "N" }, mocks: allRoleMocks(),
});
t("users: self signup with null role", ALLOW, {
    auth: as("newbie"), method: "create", path: "users/newbie", newData: { email: "newbie@x.com", roleId: null },
});
t("users: self signup as Super Admin denied", DENY, {
    auth: as("newbie"), method: "create", path: "users/newbie",
    newData: { email: "newbie@x.com", roleId: "role_super" }, mocks: allRoleMocks(),
});
t("users: invited agent signup", ALLOW, {
    auth: as("newagent"), method: "create", path: "users/newagent",
    newData: { email: "newagent@x.com", roleId: "role_agent", organizationId: "owner", branchId: "b1" }, mocks: allRoleMocks(),
});
t("users: agent signup without organization denied", DENY, {
    auth: as("newagent"), method: "create", path: "users/newagent",
    newData: { email: "newagent@x.com", roleId: "role_agent" }, mocks: allRoleMocks(),
});
t("users: signup with privileged flag denied", DENY, {
    auth: as("newbie"), method: "create", path: "users/newbie",
    newData: { email: "newbie@x.com", roleId: "role_basic", isVerified: true }, mocks: allRoleMocks(),
});
t("users: create someone else's profile denied", DENY, {
    auth: as("other"), method: "create", path: "users/victim", newData: { email: "v@x.com", roleId: null },
});
t("users: owner updates profile fields", ALLOW, {
    auth: as("owner"), method: "update", path: "users/owner",
    data: USERS.owner, newData: { ...USERS.owner, displayName: "Agency", loginCount: 3 },
});
t("users: owner escalates roleId denied", DENY, {
    auth: as("owner"), method: "update", path: "users/owner",
    data: USERS.owner, newData: { ...USERS.owner, roleId: "role_super" },
});
t("users: owner sets organizationId denied", DENY, {
    auth: as("owner"), method: "update", path: "users/owner",
    data: USERS.owner, newData: { ...USERS.owner, organizationId: "pro" },
});
t("users: other user update denied", DENY, {
    auth: as("other"), method: "update", path: "users/owner", data: USERS.owner, newData: { ...USERS.owner, displayName: "x" },
});
t("users: admin assigns role", ALLOW, {
    auth: as("admin"), method: "update", path: "users/owner", data: USERS.owner, newData: { ...USERS.owner, roleId: "role_pro" },
});
t("users: owner delete denied", DENY, { auth: as("owner"), method: "delete", path: "users/owner", data: USERS.owner });
t("users: admin delete", ALLOW, { auth: as("superadmin"), method: "delete", path: "users/owner", data: USERS.owner });
t("users/config: owner receipt counter", ALLOW, {
    auth: as("owner"), method: "update", path: "users/owner/config/receiptCounter", data: { count: 1 }, newData: { count: 2 },
});
t("users/config: other user denied", DENY, { auth: as("other"), method: "get", path: "users/owner/config/receiptCounter", data: { count: 1 } });

// ---------------------------------------------------------------------------
// roles / permissions_list / plans / addons
// ---------------------------------------------------------------------------
t("roles: anonymous read denied", DENY, { method: "get", path: "roles/role_basic", data: ROLES.role_basic });
t("roles: signed-in read", ALLOW, { auth: as("owner"), method: "list", path: "roles/role_basic", data: ROLES.role_basic });
t("roles: non-admin write denied", DENY, { auth: as("owner"), method: "create", path: "roles/x", newData: { name: "Super Admin" } });
t("roles: admin write", ALLOW, { auth: as("admin"), method: "update", path: "roles/role_basic", data: ROLES.role_basic, newData: ROLES.role_pro });
t("permissions_list: non-admin write denied", DENY, { auth: as("owner"), method: "create", path: "permissions_list/x", newData: { id: "x" } });
t("plans: anonymous read (pricing)", ALLOW, { method: "list", path: "plans/p1", data: { tier: "pro" } });
t("plans: owner write denied", DENY, { auth: as("owner"), method: "update", path: "plans/p1", data: { price: 1 }, newData: { price: 0 } });
t("plans: admin write", ALLOW, { auth: as("superadmin"), method: "create", path: "plans/p2", newData: { price: 10 } });
t("addons: anonymous read denied", DENY, { method: "list", path: "addons/a1", data: {} });

// ---------------------------------------------------------------------------
// properties
// ---------------------------------------------------------------------------
const propPortal = { userId: "owner", publishToPortal: true, status: "active", title: "Casa" };
const propPrivate = { userId: "owner", publishToPortal: false, status: "inactive", title: "Borrador" };
t("properties: anonymous get portal property", ALLOW, { method: "get", path: "properties/p1", data: propPortal });
t("properties: anonymous list publishToPortal query", ALLOW, { method: "list", path: "properties/p1", data: propPortal });
t("properties: anonymous get active non-portal property", ALLOW, {
    method: "get", path: "properties/p3", data: { ...propPrivate, status: "active" },
});
t("properties: anonymous get inactive private property denied", DENY, { method: "get", path: "properties/p2", data: propPrivate });
t("properties: owner reads private property", ALLOW, { auth: as("owner"), method: "get", path: "properties/p2", data: propPrivate });
t("properties: other user reads private property denied", DENY, { auth: as("other"), method: "get", path: "properties/p2", data: propPrivate });
t("properties: admin reads private property", ALLOW, { auth: as("admin"), method: "list", path: "properties/p2", data: propPrivate });
t("properties: owner create", ALLOW, { auth: as("owner"), method: "create", path: "properties/new", newData: { ...propPortal } });
t("properties: spoofed owner create denied", DENY, { auth: as("other"), method: "create", path: "properties/new", newData: { ...propPortal } });
t("properties: anonymous create denied", DENY, { method: "create", path: "properties/new", newData: { ...propPortal } });
t("properties: owner update", ALLOW, {
    auth: as("owner"), method: "update", path: "properties/p1", data: propPortal, newData: { ...propPortal, price: 5 },
});
t("properties: owner transfers ownership denied", DENY, {
    auth: as("owner"), method: "update", path: "properties/p1", data: propPortal, newData: { ...propPortal, userId: "other" },
});
t("properties: other user update denied", DENY, {
    auth: as("other"), method: "update", path: "properties/p1", data: propPortal, newData: { ...propPortal, price: 5 },
});
t("properties: owner delete", ALLOW, { auth: as("owner"), method: "delete", path: "properties/p1", data: propPortal });
t("properties: other delete denied", DENY, { auth: as("other"), method: "delete", path: "properties/p1", data: propPortal });

// ---------------------------------------------------------------------------
// Owner-scoped collections (userId)
// ---------------------------------------------------------------------------
for (const col of ["alquileres", "inquilinos", "propietarios", "leads", "visitas", "ventas", "transacciones", "carteles", "configuracion_comisiones"]) {
    const d = { userId: "owner", nombre: "x" };
    t(`${col}: anonymous read denied`, DENY, { method: "get", path: `${col}/d1`, data: d });
    t(`${col}: anonymous list denied`, DENY, { method: "list", path: `${col}/d1`, data: d });
    t(`${col}: owner read`, ALLOW, { auth: as("owner"), method: "list", path: `${col}/d1`, data: d });
    t(`${col}: other user read denied`, DENY, { auth: as("other"), method: "get", path: `${col}/d1`, data: d });
    t(`${col}: admin read`, ALLOW, { auth: as("superadmin"), method: "get", path: `${col}/d1`, data: d });
    t(`${col}: owner create`, ALLOW, { auth: as("owner"), method: "create", path: `${col}/d2`, newData: d });
    t(`${col}: spoofed owner create denied`, DENY, { auth: as("other"), method: "create", path: `${col}/d2`, newData: d });
    t(`${col}: anonymous create denied`, DENY, { method: "create", path: `${col}/d2`, newData: d });
    t(`${col}: owner update`, ALLOW, { auth: as("owner"), method: "update", path: `${col}/d1`, data: d, newData: { ...d, nombre: "y" } });
    t(`${col}: owner changes userId denied`, DENY, { auth: as("owner"), method: "update", path: `${col}/d1`, data: d, newData: { ...d, userId: "other" } });
    t(`${col}: other user update denied`, DENY, { auth: as("other"), method: "update", path: `${col}/d1`, data: d, newData: { ...d, nombre: "y" } });
    t(`${col}: owner delete`, ALLOW, { auth: as("owner"), method: "delete", path: `${col}/d1`, data: d });
    t(`${col}: other delete denied`, DENY, { auth: as("other"), method: "delete", path: `${col}/d1`, data: d });
}
t("leads: admin reads platform inbox", ALLOW, { auth: as("superadmin"), method: "list", path: "leads/l1", data: { userId: "SYSTEM_ZETA_PROP" } });
t("leads: anonymous create denied (forms use /api/leads)", DENY, { method: "create", path: "leads/l9", newData: { userId: "owner", nombre: "x" } });
t("alquileres: anonymous tenant lookup by code denied", DENY, { method: "list", path: "alquileres/a1", data: { userId: "owner", codigoAlquiler: "ABC" } });
t("configuracion_comisiones: org agent reads org config", ALLOW, { auth: as("agent"), method: "list", path: "configuracion_comisiones/c1", data: { userId: "owner" } });
t("configuracion_comisiones: agent cannot write org config", DENY, {
    auth: as("agent"), method: "update", path: "configuracion_comisiones/c1", data: { userId: "owner", pct: 1 }, newData: { userId: "owner", pct: 2 },
});

// ---------------------------------------------------------------------------
// agentes / invitations / branches
// ---------------------------------------------------------------------------
const agenteDoc = { userId: "owner", email: "Invited@Agency.com", nombre: "Ana" };
t("agentes: owner read", ALLOW, { auth: as("owner"), method: "list", path: "agentes/ag1", data: agenteDoc });
t("agentes: other read denied", DENY, { auth: as("other"), method: "get", path: "agentes/ag1", data: agenteDoc });
t("agentes: linked agent reads own record", ALLOW, { auth: as("agent"), method: "get", path: "agentes/ag1", data: { ...agenteDoc, authUserId: "agent" } });
t("agentes: invited user links itself", ALLOW, {
    auth: as("invited", { email: "invited@agency.com" }), method: "update", path: "agentes/ag1",
    data: agenteDoc, newData: { ...agenteDoc, authUserId: "invited", phone: "+54", updatedAt: "now" },
});
t("agentes: stranger links itself denied", DENY, {
    auth: as("other"), method: "update", path: "agentes/ag1",
    data: agenteDoc, newData: { ...agenteDoc, authUserId: "other", updatedAt: "now" },
});
t("agentes: invited user changing userId denied", DENY, {
    auth: as("invited", { email: "invited@agency.com" }), method: "update", path: "agentes/ag1",
    data: agenteDoc, newData: { ...agenteDoc, authUserId: "invited", userId: "invited" },
});
t("agentes: relink an already linked record denied", DENY, {
    auth: as("invited", { email: "invited@agency.com" }), method: "update", path: "agentes/ag1",
    data: { ...agenteDoc, authUserId: "someone" }, newData: { ...agenteDoc, authUserId: "invited" },
});
t("agentes: spoofed create denied", DENY, { auth: as("other"), method: "create", path: "agentes/ag2", newData: agenteDoc });

const invitation = { organizationId: "owner", email: "invited@agency.com", token: "t", status: "pending", agenteId: "ag1" };
t("invitations: anonymous token lookup denied", DENY, { method: "list", path: "invitations/i1", data: invitation });
t("invitations: invitee reads its invitation", ALLOW, { auth: as("invited", { email: "invited@agency.com" }), method: "list", path: "invitations/i1", data: invitation });
t("invitations: invitee marks used", ALLOW, {
    auth: as("invited", { email: "invited@agency.com" }), method: "update", path: "invitations/i1", data: invitation, newData: { ...invitation, status: "used" },
});
t("invitations: invitee changes org denied", DENY, {
    auth: as("invited", { email: "invited@agency.com" }), method: "update", path: "invitations/i1", data: invitation, newData: { ...invitation, status: "used", organizationId: "x" },
});
t("invitations: owner creates for own org", ALLOW, { auth: as("owner"), method: "create", path: "invitations/i2", newData: invitation });
t("invitations: create for another org denied", DENY, { auth: as("other"), method: "create", path: "invitations/i2", newData: invitation });
t("invitations: stranger read denied", DENY, { auth: as("other"), method: "get", path: "invitations/i1", data: invitation });

const branch = { organizationId: "owner", name: "Centro" };
t("branches: owner read", ALLOW, { auth: as("owner"), method: "list", path: "branches/b1", data: branch });
t("branches: org agent read", ALLOW, { auth: as("agent"), method: "list", path: "branches/b1", data: branch });
t("branches: other read denied", DENY, { auth: as("other"), method: "list", path: "branches/b1", data: branch });
t("branches: anonymous read denied", DENY, { method: "get", path: "branches/b1", data: branch });
t("branches: owner create", ALLOW, { auth: as("owner"), method: "create", path: "branches/b2", newData: branch });
t("branches: agent create denied", DENY, { auth: as("agent"), method: "create", path: "branches/b2", newData: branch });
t("branches: owner update", ALLOW, { auth: as("owner"), method: "update", path: "branches/b1", data: branch, newData: { ...branch, name: "N" } });
t("branches: agent update denied", DENY, { auth: as("agent"), method: "update", path: "branches/b1", data: branch, newData: { ...branch, name: "N" } });

// ---------------------------------------------------------------------------
// rentalServices
// ---------------------------------------------------------------------------
const rs = { rentalId: "a1", createdBy: "owner", month: 1, year: 2026 };
const rentalMock = [mock("get", "alquileres/a1", { data: { userId: "owner" } })];
t("rentalServices: creator read", ALLOW, { auth: as("owner"), method: "get", path: "rentalServices/s1", data: rs });
t("rentalServices: rental owner read", ALLOW, { auth: as("owner"), method: "get", path: "rentalServices/s1", data: { ...rs, createdBy: "x" }, mocks: rentalMock });
t("rentalServices: other read denied", DENY, { auth: as("other"), method: "get", path: "rentalServices/s1", data: rs, mocks: rentalMock });
t("rentalServices: anonymous read denied", DENY, { method: "get", path: "rentalServices/s1", data: rs });
t("rentalServices: spoofed create denied", DENY, { auth: as("other"), method: "create", path: "rentalServices/s2", newData: rs });
t("rentalServices: creator update", ALLOW, { auth: as("owner"), method: "update", path: "rentalServices/s1", data: rs, newData: { ...rs, sent: true } });

// ---------------------------------------------------------------------------
// tickets / ticket_messages
// ---------------------------------------------------------------------------
const ticket = { userId: "owner", title: "Ayuda", status: "abierto" };
const ticketMock = [mock("get", "tickets/t1", { data: ticket })];
t("tickets: owner read", ALLOW, { auth: as("owner"), method: "list", path: "tickets/t1", data: ticket });
t("tickets: other read denied", DENY, { auth: as("other"), method: "get", path: "tickets/t1", data: ticket });
t("tickets: admin read all", ALLOW, { auth: as("admin"), method: "list", path: "tickets/t1", data: ticket });
t("tickets: owner create", ALLOW, { auth: as("owner"), method: "create", path: "tickets/t2", newData: ticket });
t("tickets: spoofed create denied", DENY, { auth: as("other"), method: "create", path: "tickets/t2", newData: ticket });
t("tickets: owner delete denied", DENY, { auth: as("owner"), method: "delete", path: "tickets/t1", data: ticket });
t("ticket_messages: owner reads admin reply", ALLOW, {
    auth: as("owner"), method: "get", path: "ticket_messages/m1", data: { ticketId: "t1", userId: "admin", isAdmin: true }, mocks: ticketMock,
});
t("ticket_messages: other reads denied", DENY, {
    auth: as("other"), method: "get", path: "ticket_messages/m1", data: { ticketId: "t1", userId: "admin", isAdmin: true }, mocks: ticketMock,
});
t("ticket_messages: owner posts on own ticket", ALLOW, {
    auth: as("owner"), method: "create", path: "ticket_messages/m2", newData: { ticketId: "t1", userId: "owner", isAdmin: false, message: "hola" }, mocks: ticketMock,
});
t("ticket_messages: owner posing as admin denied", DENY, {
    auth: as("owner"), method: "create", path: "ticket_messages/m2", newData: { ticketId: "t1", userId: "owner", isAdmin: true, message: "hola" }, mocks: ticketMock,
});
t("ticket_messages: stranger posts on someone's ticket denied", DENY, {
    auth: as("other"), method: "create", path: "ticket_messages/m2", newData: { ticketId: "t1", userId: "other", isAdmin: false, message: "x" }, mocks: ticketMock,
});
t("ticket_messages: admin replies", ALLOW, {
    auth: as("superadmin"), method: "create", path: "ticket_messages/m3", newData: { ticketId: "t1", userId: "superadmin", isAdmin: true, message: "ok" },
});
t("ticket_messages: edits denied", DENY, {
    auth: as("owner"), method: "update", path: "ticket_messages/m2", data: { ticketId: "t1", userId: "owner" }, newData: { ticketId: "t1", userId: "owner", message: "x" },
});

// ---------------------------------------------------------------------------
// audit_logs
// ---------------------------------------------------------------------------
const log = { userId: "owner", organizationId: "owner", action: "login" };
t("audit_logs: author create", ALLOW, { auth: as("owner"), method: "create", path: "audit_logs/l1", newData: log });
t("audit_logs: spoofed author denied", DENY, { auth: as("other"), method: "create", path: "audit_logs/l1", newData: log });
t("audit_logs: anonymous create denied", DENY, { method: "create", path: "audit_logs/l1", newData: log });
t("audit_logs: org owner reads", ALLOW, { auth: as("owner"), method: "list", path: "audit_logs/l1", data: log });
t("audit_logs: other reads denied", DENY, { auth: as("other"), method: "list", path: "audit_logs/l1", data: log });
t("audit_logs: admin reads", ALLOW, { auth: as("admin"), method: "list", path: "audit_logs/l1", data: log });
t("audit_logs: updates denied even for admin", DENY, { auth: as("superadmin"), method: "update", path: "audit_logs/l1", data: log, newData: { ...log, action: "x" } });

// ---------------------------------------------------------------------------
// notifications
// ---------------------------------------------------------------------------
const notifAdmin = { targetRole: "Administrador", targetUserId: null, readBy: [], title: "x" };
const notifBasic = { targetRole: "Cliente Básico", targetUserId: null, readBy: [], title: "x" };
const notifUser = { targetRole: null, targetUserId: "owner", readBy: [], title: "x" };
t("notifications: user notifies admins", ALLOW, { auth: as("owner"), method: "create", path: "notifications/n1", newData: notifAdmin });
t("notifications: user notifies another user denied", DENY, { auth: as("owner"), method: "create", path: "notifications/n1", newData: notifUser });
t("notifications: anonymous create denied", DENY, { method: "create", path: "notifications/n1", newData: notifAdmin });
t("notifications: admin reads admin notifications", ALLOW, { auth: as("admin"), method: "list", path: "notifications/n1", data: notifAdmin });
t("notifications: basic user reads its role notifications", ALLOW, { auth: as("owner"), method: "list", path: "notifications/n2", data: notifBasic });
t("notifications: basic user reads admin notifications denied", DENY, { auth: as("owner"), method: "list", path: "notifications/n1", data: notifAdmin });
t("notifications: target user reads", ALLOW, { auth: as("owner"), method: "list", path: "notifications/n3", data: notifUser });
t("notifications: other user reads targeted denied", DENY, { auth: as("other"), method: "get", path: "notifications/n3", data: notifUser });
t("notifications: mark as read", ALLOW, {
    auth: as("owner"), method: "update", path: "notifications/n3", data: notifUser, newData: { ...notifUser, readBy: ["owner"] },
});
t("notifications: mark as read for someone else denied", DENY, {
    auth: as("owner"), method: "update", path: "notifications/n3", data: notifUser, newData: { ...notifUser, readBy: ["other"] },
});
t("notifications: edit title denied", DENY, {
    auth: as("owner"), method: "update", path: "notifications/n3", data: notifUser, newData: { ...notifUser, title: "hacked" },
});

// ---------------------------------------------------------------------------
// subscriptions / payments
// ---------------------------------------------------------------------------
const sub = { userId: "owner", status: "active", planTier: "basic" };
t("subscriptions: owner read", ALLOW, { auth: as("owner"), method: "list", path: "subscriptions/s1", data: sub });
t("subscriptions: other read denied", DENY, { auth: as("other"), method: "list", path: "subscriptions/s1", data: sub });
t("subscriptions: owner self-create denied", DENY, { auth: as("owner"), method: "create", path: "subscriptions/s2", newData: sub });
t("subscriptions: owner upgrades plan denied", DENY, {
    auth: as("owner"), method: "update", path: "subscriptions/s1", data: sub, newData: { ...sub, planTier: "enterprise" },
});
t("subscriptions: owner cancels", ALLOW, {
    auth: as("owner"), method: "update", path: "subscriptions/s1", data: sub, newData: { ...sub, status: "cancelled", cancelledAt: 1, updatedAt: 1 },
});
t("subscriptions: admin create", ALLOW, { auth: as("superadmin"), method: "create", path: "subscriptions/s3", newData: sub });
t("payments: owner read", ALLOW, { auth: as("owner"), method: "get", path: "payments/p1", data: { userId: "owner", status: "approved" } });
t("payments: owner create denied", DENY, { auth: as("owner"), method: "create", path: "payments/p2", newData: { userId: "owner", status: "approved" } });
t("payments: admin create", ALLOW, { auth: as("admin"), method: "create", path: "payments/p2", newData: { userId: "owner", status: "approved" } });

// ---------------------------------------------------------------------------
// sites
// ---------------------------------------------------------------------------
const site = { userId: "owner", slug: "mi-inmo", nombre: "Mi Inmo", published: true };
t("sites: anonymous read published", ALLOW, { method: "list", path: "sites/s1", data: site });
t("sites: anonymous read unpublished denied", DENY, { method: "get", path: "sites/s1", data: { ...site, published: false } });
t("sites: signed-in slug availability read", ALLOW, { auth: as("other"), method: "list", path: "sites/s1", data: { ...site, published: false } });
t("sites: owner create", ALLOW, { auth: as("owner"), method: "create", path: "sites/s2", newData: site });
t("sites: bad slug denied", DENY, { auth: as("owner"), method: "create", path: "sites/s2", newData: { ...site, slug: "Bad Slug" } });
t("sites: spoofed create denied", DENY, { auth: as("other"), method: "create", path: "sites/s2", newData: site });
t("sites: owner update", ALLOW, { auth: as("owner"), method: "update", path: "sites/s1", data: site, newData: { ...site, published: false } });
t("sites: other update denied", DENY, { auth: as("other"), method: "update", path: "sites/s1", data: site, newData: { ...site, published: false } });

// ---------------------------------------------------------------------------
// blog_posts (incl. /blog prerender: unauthenticated web SDK on the server)
// ---------------------------------------------------------------------------
const post = { title: "Post", slug: "post", published: true, content: "..." };
const draft = { ...post, published: false };
t("blog_posts: /blog prerender anonymous list of published", ALLOW, { method: "list", path: "blog_posts/b1", data: post });
t("blog_posts: anonymous get published by slug", ALLOW, { method: "get", path: "blog_posts/b1", data: post });
t("blog_posts: anonymous get draft denied", DENY, { method: "get", path: "blog_posts/b2", data: draft });
t("blog_posts: anonymous list drafts denied", DENY, { method: "list", path: "blog_posts/b2", data: draft });
t("blog_posts: basic user reads draft denied", DENY, { auth: as("owner"), method: "get", path: "blog_posts/b2", data: draft });
t("blog_posts: client role with blog permission reads drafts denied", DENY, { auth: as("pro"), method: "list", path: "blog_posts/b2", data: draft });
t("blog_posts: client role with blog permission create denied", DENY, { auth: as("pro"), method: "create", path: "blog_posts/b3", newData: draft });
t("blog_posts: client role with blog permission publish denied", DENY, { auth: as("pro"), method: "update", path: "blog_posts/b2", data: draft, newData: post });
t("blog_posts: agent with blog permission update denied", DENY, { auth: as("agent"), method: "update", path: "blog_posts/b1", data: post, newData: { ...post, title: "x" } });
t("blog_posts: admin reads drafts", ALLOW, { auth: as("admin"), method: "list", path: "blog_posts/b2", data: draft });
t("blog_posts: admin creates", ALLOW, { auth: as("admin"), method: "create", path: "blog_posts/b3", newData: draft });
t("blog_posts: platform owner publishes", ALLOW, { auth: rootOwner, method: "update", path: "blog_posts/b2", data: draft, newData: post });
t("blog_posts: basic user create denied", DENY, { auth: as("owner"), method: "create", path: "blog_posts/b3", newData: draft });
t("blog_posts: anonymous create denied", DENY, { method: "create", path: "blog_posts/b3", newData: draft });
t("blog_posts: admin deletes", ALLOW, { auth: as("superadmin"), method: "delete", path: "blog_posts/b1", data: post });

// ---------------------------------------------------------------------------
// developments / contact_messages / settings / configurations / emailLogs
// ---------------------------------------------------------------------------
t("developments: permitted role reads", ALLOW, { auth: as("pro"), method: "list", path: "developments/d1", data: { active: true } });
t("developments: basic user denied", DENY, { auth: as("owner"), method: "list", path: "developments/d1", data: { active: true } });
t("developments: anonymous denied", DENY, { method: "list", path: "developments/d1", data: { active: true } });
const contact = { name: "Juan", email: "j@x.com", phone: "123", company: "", message: "hola", read: false, createdAt: 1 };
t("contact_messages: anonymous create", ALLOW, { method: "create", path: "contact_messages/c1", newData: contact });
t("contact_messages: create with extra fields denied", DENY, { method: "create", path: "contact_messages/c1", newData: { ...contact, admin: true } });
t("contact_messages: create pre-read denied", DENY, { method: "create", path: "contact_messages/c1", newData: { ...contact, read: true } });
t("contact_messages: anonymous read denied", DENY, { method: "list", path: "contact_messages/c1", data: contact });
t("contact_messages: owner read denied", DENY, { auth: as("owner"), method: "list", path: "contact_messages/c1", data: contact });
t("contact_messages: admin read", ALLOW, { auth: as("admin"), method: "list", path: "contact_messages/c1", data: contact });
t("settings: owner read denied", DENY, { auth: as("owner"), method: "get", path: "settings/email_notifications", data: {} });
t("settings: admin write", ALLOW, { auth: as("superadmin"), method: "update", path: "settings/email_notifications", data: {}, newData: { a: 1 } });
t("configurations: anonymous read denied", DENY, { method: "get", path: "configurations/mercadopago", data: { accessToken: "enc" } });
t("configurations: owner read denied", DENY, { auth: as("owner"), method: "get", path: "configurations/mercadopago", data: { accessToken: "enc" } });
t("configurations: admin read", ALLOW, { auth: as("admin"), method: "get", path: "configurations/mercadopago", data: { accessToken: "enc" } });
t("emailLogs: admin read", ALLOW, { auth: as("admin"), method: "list", path: "emailLogs/e1", data: { to: "a@b.com" } });
t("emailLogs: owner read denied", DENY, { auth: as("owner"), method: "list", path: "emailLogs/e1", data: { to: "owner@agency.com" } });
t("emailLogs: client write denied", DENY, { auth: as("superadmin"), method: "create", path: "emailLogs/e2", newData: { to: "x" } });

// ---------------------------------------------------------------------------
// property_stats / server-only collections / default deny
// ---------------------------------------------------------------------------
t("property_stats: owner read", ALLOW, { auth: as("owner"), method: "list", path: "property_stats/p1", data: { ownerId: "owner", views: 3 } });
t("property_stats: other read denied", DENY, { auth: as("other"), method: "list", path: "property_stats/p1", data: { ownerId: "owner", views: 3 } });
t("property_stats: client write denied", DENY, { auth: as("owner"), method: "update", path: "property_stats/p1", data: { ownerId: "owner", views: 3 }, newData: { ownerId: "owner", views: 999 } });
for (const col of ["property_view_keys", "newsletter_subscribers", "newsletters", "announcements", "emailTemplates", "verification", "configuration", "chat_sessions", "social_carousels"]) {
    t(`${col}: admin read denied (server-only)`, DENY, { auth: as("superadmin"), method: "get", path: `${col}/x`, data: {} });
    t(`${col}: anonymous write denied (server-only)`, DENY, { method: "create", path: `${col}/x`, newData: {} });
}
t("chat_sessions/messages: anonymous read denied", DENY, { method: "list", path: "chat_sessions/5491111/messages/m1", data: { text: "hi" } });
t("chat_sessions/messages: anonymous create denied", DENY, { method: "create", path: "chat_sessions/5491111/messages/m1", newData: { text: "hi", sender: "user" } });
t("default deny: unknown collection admin read", DENY, { auth: as("superadmin"), method: "get", path: "unknown_col/x", data: {} });
t("default deny: unknown collection anonymous write", DENY, { method: "create", path: "unknown_col/x", newData: {} });
t("admin by role 'Administrador'", ALLOW, { auth: as("admin"), method: "get", path: "alquileres/z", data: { userId: "owner" } });
t("user without role is not admin", DENY, { auth: as("norole"), method: "get", path: "alquileres/z", data: { userId: "owner" } });
t("unverified owner email is not admin", DENY, {
    auth: { uid: "root2", token: { email: "facundoflores8@gmail.com", email_verified: false } }, method: "get", path: "alquileres/z", data: { userId: "owner" },
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
// The API rejects large suites (INVALID_ARGUMENT), so cases are sent in chunks.
const CHUNK = 50;

async function runChunk(token, chunk) {
    const body = {
        source: { files: [{ name: "firestore.rules", content: RULES }] },
        testSuite: { testCases: chunk.map((c) => c.tc) },
    };
    const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}:test`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "x-goog-user-project": PROJECT,
        },
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`Rules API error ${res.status}: ${JSON.stringify(json)}`);
    return json;
}

async function main() {
    const token = accessToken();
    let failed = 0;
    let total = 0;
    for (let start = 0; start < cases.length; start += CHUNK) {
        const chunk = cases.slice(start, start + CHUNK);
        const json = await runChunk(token, chunk);
        if (start === 0) {
            for (const i of json.issues || []) {
                const pos = i.sourcePosition ? `${i.sourcePosition.line}:${i.sourcePosition.column}` : "";
                console.log(`[${i.severity}] ${pos} ${i.description}`);
            }
            if ((json.issues || []).some((i) => i.severity === "ERROR")) {
                process.exitCode = 2;
                return;
            }
        }
        (json.testResults || []).forEach((r, i) => {
            total++;
            const ok = r.state === "SUCCESS";
            if (!ok) failed++;
            const { name, tc } = chunk[i];
            console.log(`${ok ? "PASS" : "FAIL"}  ${tc.expectation.padEnd(5)}  ${name}`);
            if (!ok) {
                for (const m of r.debugMessages || []) console.log(`        debug: ${m}`);
                if (r.errorPosition) console.log(`        at ${r.errorPosition.line}:${r.errorPosition.column}`);
                if (process.env.VERBOSE) console.log(JSON.stringify(r, null, 2));
            }
        });
    }
    console.log(`\n${total - failed}/${total} passed, ${failed} failed`);
    if (total !== cases.length) {
        console.log(`Expected ${cases.length} results, got ${total}`);
        failed++;
    }
    process.exitCode = failed ? 1 : 0;
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 2;
});
