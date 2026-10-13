// The argument checker: what it accepts, what it coerces and the messages it gives.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateArgs } from '../lib/schema.js';
import { ToolError } from '../lib/errors.js';
import { buildTools } from '../tools/index.js';

const S = {
  type: 'object',
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 5 },
    n: { type: 'integer', minimum: 1, maximum: 10 },
    x: { type: 'number', minimum: 0 },
    flag: { type: 'boolean' },
    mode: { type: 'string', enum: ['a', 'b'] },
    list: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 2 },
    either: { anyOf: [{ type: 'string', enum: ['a'] }, { type: 'array', items: { type: 'string', enum: ['a'] } }] },
    deep: { type: 'object', properties: { k: { type: 'number' } }, required: ['k'], additionalProperties: false },
    free: { type: 'object' },
  },
  required: ['id'],
  additionalProperties: false,
};

const bad = (args, re) => assert.throws(() => validateArgs('t', S, args), (e) => e instanceof ToolError && e.code === 'invalid_arguments' && re.test(e.message), String(re));

test('valid arguments pass through unchanged', () => {
  const a = { id: 'abc', n: 3, x: 0.5, flag: true, mode: 'a', list: ['p'], either: ['a'], deep: { k: 1 }, free: { anything: [1, 2] } };
  assert.deepEqual(validateArgs('t', S, a), a);
});

test('numbers and booleans sent as strings are coerced', () => {
  const out = validateArgs('t', S, { id: 'a', n: '4', x: '0.25', flag: 'true' });
  assert.deepEqual(out, { id: 'a', n: 4, x: 0.25, flag: true });
});

test('missing required and unknown arguments are named', () => {
  bad({}, /id is required/);
  bad({ id: 'a', nope: 1 }, /unknown argument "nope"; allowed: id, n, x/);
  bad({ id: 'a', deep: { k: 1, z: 2 } }, /unknown argument "z" in deep/);
  bad({ id: 'a', deep: {} }, /deep\.k is required/);
});

test('types, ranges, enums and lengths are checked with the value in the message', () => {
  bad({ id: 5 }, /id must be a string \(got 5\)/);
  bad({ id: '' }, /id must have at least 1 character/);
  bad({ id: 'toolong' }, /id must have at most 5 characters/);
  bad({ id: 'a', n: 1.5 }, /n must be an integer/);
  bad({ id: 'a', n: 0 }, /n must be at least 1 \(got 0\)/);
  bad({ id: 'a', n: 11 }, /n must be at most 10/);
  bad({ id: 'a', x: 'fast' }, /x must be a number \(got "fast"\)/);
  bad({ id: 'a', flag: 'yes' }, /flag must be a boolean/);
  bad({ id: 'a', mode: 'c' }, /mode must be one of "a", "b" \(got "c"\)/);
  bad({ id: 'a', list: [] }, /list needs at least 1 item/);
  bad({ id: 'a', list: ['a', 'b', 'c'] }, /list allows at most 2 items/);
  bad({ id: 'a', list: [1] }, /list\[0\] must be a string/);
  bad({ id: 'a', free: [] }, /free must be an object/);
});

test('anyOf accepts either form and reports when neither fits', () => {
  assert.deepEqual(validateArgs('t', S, { id: 'a', either: 'a' }).either, 'a');
  assert.deepEqual(validateArgs('t', S, { id: 'a', either: ['a'] }).either, ['a']);
  bad({ id: 'a', either: 'z' }, /either does not match any allowed form/);
});

test('arguments that are not an object are refused; none at all means an empty object', () => {
  assert.throws(() => validateArgs('t', S, [1]), (e) => e.code === 'invalid_arguments');
  assert.throws(() => validateArgs('t', S, 'x'), (e) => e.code === 'invalid_arguments');
  assert.deepEqual(validateArgs('t', { type: 'object', properties: {}, additionalProperties: false }, undefined), {});
  assert.deepEqual(validateArgs('t', { type: 'object', properties: {}, additionalProperties: false }, null), {});
});

test('every tool schema is itself well formed', () => {
  for (const t of buildTools()) {
    const s = t.inputSchema;
    assert.equal(s.type, 'object', t.name);
    assert.equal(s.additionalProperties, false, `${t.name} rejects unknown arguments`);
    for (const req of s.required || []) assert.ok(s.properties[req], `${t.name}: required ${req} is a property`);
    const walk = (node, where) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'array') assert.ok(node.items, `${where} has items`);
      if (node.enum) assert.ok(node.enum.length, where);
      for (const [k, v] of Object.entries(node.properties || {})) walk(v, `${where}.${k}`);
      if (node.items) walk(node.items, `${where}[]`);
      for (const sub of node.anyOf || []) walk(sub, `${where}|`);
    };
    walk(s, t.name);
  }
});
