const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");

function createIoStub() {
  return {
    to() {
      return {
        emit() {},
      };
    },
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
  };
}

test("GET /api/healthz returns service health", async () => {
  const app = createApp(createIoStub());
  const response = await request(app).get("/api/healthz");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "ok");
});

test("POST /api/alerts validates payload", async () => {
  const app = createApp(createIoStub());
  const response = await request(app).post("/api/alerts").send({ title: "Hi" });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Validation failed");
});
