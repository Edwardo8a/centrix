// Loopback fixture: real HTTP routes, auth, use cases and repositories; in-memory DB/Storage.
process.env.JWT_SECRET = 'local-contract-only';
process.env.SUPABASE_ATTACHMENTS_BUCKET = 'evidencias';
process.env.NODE_ENV = 'test';
const { createMemorySupabase, ids } = require('../helpers/memorySupabase');
const { client } = createMemorySupabase();
const configPath = require.resolve('../../src/config/supabaseClient');
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true,
  exports: { dataClient: client, authClient: client, adminClient: client } };
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
// Keep protocol output separate from access logs.
const server = app.listen(0, '127.0.0.1', () => {
  const tokens = Object.fromEntries(['creator', 'manager', 'solver'].map(name =>
    [name, jwt.sign({ id: ids[name] }, process.env.JWT_SECRET)]));
  process.stdout.write('CONTRACT_READY ' + JSON.stringify({ port: server.address().port, tokens, ids }) + '\n');
});
