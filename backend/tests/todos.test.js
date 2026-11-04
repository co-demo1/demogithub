const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, cpSync, mkdirSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

// Point this at a disposable PostgreSQL database, never a production database.
test("migration and authenticated due-date API", async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, "Set TEST_DATABASE_URL to a disposable PostgreSQL database");
  const schema = `due_date_test_${process.pid}_${Date.now()}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set("schema", schema);
  process.env.DATABASE_URL = url.toString();
  process.env.JWT_SECRET = "local-due-date-test-only";
  const directory = mkdtempSync(path.join(tmpdir(), "todo-migrations-"));
  const source = path.join(__dirname, "../prisma");
  const migration = "20261104191000_add_todo_due_date";
  cpSync(path.join(source, "schema.prisma"), path.join(directory, "schema.prisma"));
  mkdirSync(path.join(directory, "migrations"));
  for (const name of ["migration_lock.toml", "20250728055521_init", "20250728083956_init"]) {
    cpSync(path.join(source, "migrations", name), path.join(directory, "migrations", name), { recursive: true });
  }
  const deploy = () => execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), "migrate", "deploy", "--schema", path.join(directory, "schema.prisma")], { env: process.env, stdio: "pipe" });
  const prisma = require("../prismaClient");
  let server;
  try {
    deploy();
    // Seed using SQL before the dueDate column exists.
    await prisma.$executeRaw`INSERT INTO "User" ("username", "password", "updatedAt") VALUES ('owner', 'unused', NOW()), ('other', 'unused', NOW())`;
    await prisma.$executeRaw`INSERT INTO "Todo" ("title", "userId", "updatedAt") VALUES ('Legacy todo', 1, NOW())`;
    cpSync(path.join(source, "migrations", migration), path.join(directory, "migrations", migration), { recursive: true });
    deploy();
    const express = require("express");
    const app = express();
    app.use(express.json());
    app.use("/api/todos", require("../routes/todos"));
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const jwt = require("jsonwebtoken");
    const tokens = { owner: jwt.sign({ id: 1 }, process.env.JWT_SECRET), other: jwt.sign({ id: 2 }, process.env.JWT_SECRET) };
    const request = async (method, suffix = "", data, role = "owner") => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/todos${suffix}`, {
        method,
        headers: { "Content-Type": "application/json", ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}) },
        body: data === undefined ? undefined : JSON.stringify(data),
      });
      return { status: response.status, body: await response.json() };
    };
    await t.test("legacy todo survives additive migration with no due date", async () => {
      const result = await request("GET");
      assert.equal(result.status, 200);
      assert.equal(result.body[0].title, "Legacy todo");
      assert.equal(result.body[0].dueDate, null);
    });
    await t.test("create, list, set, omit, change, and clear date", async () => {
      for (const payload of [{ title: "Old client" }, { title: "Explicit null", dueDate: null }]) {
        const created = await request("POST", "", payload);
        assert.equal(created.status, 201);
        assert.equal(created.body.dueDate, null);
      }
      const created = await request("POST", "", { title: "Dated todo", dueDate: "2024-02-29" });
      assert.equal(created.status, 201);
      assert.equal(created.body.dueDate, "2024-02-29");
      const id = created.body.id;
      const renamed = await request("PUT", `/${id}`, { title: "Renamed", completed: true });
      assert.equal(renamed.status, 200);
      assert.equal(renamed.body.dueDate, "2024-02-29");
      assert.equal(renamed.body.completed, true);
      const changed = await request("PUT", `/${id}`, { dueDate: "2026-12-31" });
      assert.equal(changed.status, 200);
      assert.equal(changed.body.title, "Renamed");
      assert.equal(changed.body.completed, true);
      assert.equal(changed.body.dueDate, "2026-12-31");
      const listed = await request("GET");
      assert.equal(listed.body.find((todo) => todo.id === id).dueDate, "2026-12-31");
      const cleared = await request("PUT", `/${id}`, { dueDate: null });
      assert.equal(cleared.status, 200);
      assert.equal(cleared.body.dueDate, null);
      assert.equal((await request("GET")).body.find((todo) => todo.id === id).dueDate, null);
      const legacy = await request("PUT", "/1", { dueDate: "2026-11-30" });
      assert.equal(legacy.body.dueDate, "2026-11-30");
    });
    await t.test("invalid dates fail on create and update without changing stored data", async () => {
      const before = await request("GET");
      for (const dueDate of ["2025-02-29", "2026-02-30", "2026-13-01", "2026-01-01T00:00:00Z", "", 123, true, {}, []]) {
        for (const [method, suffix, payload] of [["POST", "", { title: "Invalid", dueDate }], ["PUT", "/1", { title: "Must not change", dueDate }]]) {
          const result = await request(method, suffix, payload);
          assert.equal(result.status, 400);
          assert.match(result.body.error, /dueDate/);
        }
      }
      assert.deepEqual((await request("GET")).body, before.body);
    });
    await t.test("anonymous access fails and another user cannot read or change dates", async () => {
      assert.equal((await request("GET", "", undefined, "anonymous")).status, 401);
      assert.equal((await request("PUT", "/1", { dueDate: null }, "anonymous")).status, 401);
      assert.deepEqual((await request("GET", "", undefined, "other")).body, []);
      assert.equal((await request("PUT", "/1", { dueDate: null }, "other")).status, 404);
      assert.equal((await request("GET")).body.find((todo) => todo.id === 1).dueDate, "2026-11-30");
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await prisma.$disconnect();
    rmSync(directory, { recursive: true, force: true });
  }
});
