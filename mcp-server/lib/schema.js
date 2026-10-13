// A small JSON-Schema checker for tool arguments, so a typo or a wrong type gets a message the agent
// can act on instead of a silently ignored field. It understands what the tool schemas use: type
// (string, number, integer, boolean, array, object, or a list of them), enum, minimum, maximum,
// minLength, maxLength, minItems, maxItems, items, properties, required, additionalProperties: false
// and anyOf. Numbers and booleans sent as strings ("0.5", "true") are coerced, because model clients
// do that.
import { ToolError } from './errors.js';

const typeOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

function matchesType(v, t) {
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v);
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
  return typeOf(v) === t;
}

/** Coerce a string to the type the schema wants when that is unambiguous. */
function coerce(v, types) {
  if (typeof v !== 'string') return v;
  if ((types.includes('number') || types.includes('integer')) && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  if (types.includes('boolean') && (v === 'true' || v === 'false')) return v === 'true';
  return v;
}

function check(schema, value, path, errors) {
  if (schema.anyOf) {
    const attempts = [];
    for (const sub of schema.anyOf) {
      const e = [];
      const out = check(sub, value, path, e);
      if (!e.length) return out;
      attempts.push(e[0]);
    }
    errors.push(`${path} ${attempts.length ? 'does not match any allowed form: ' + attempts.join(' or ') : 'is invalid'}`);
    return value;
  }
  const types = schema.type == null ? null : Array.isArray(schema.type) ? schema.type : [schema.type];
  let v = value;
  if (types) {
    v = coerce(v, types);
    if (!types.some((t) => matchesType(v, t))) {
      errors.push(`${path} must be ${types.length > 1 ? 'one of ' + types.join(', ') : /^[aeiou]/.test(types[0]) ? 'an ' + types[0] : 'a ' + types[0]} (got ${JSON.stringify(value)})`);
      return value;
    }
  }
  if (schema.enum && !schema.enum.includes(v)) errors.push(`${path} must be one of ${schema.enum.map((x) => JSON.stringify(x)).join(', ')} (got ${JSON.stringify(v)})`);
  if (typeof v === 'number') {
    if (schema.minimum != null && v < schema.minimum) errors.push(`${path} must be at least ${schema.minimum} (got ${v})`);
    if (schema.maximum != null && v > schema.maximum) errors.push(`${path} must be at most ${schema.maximum} (got ${v})`);
  }
  if (typeof v === 'string') {
    if (schema.minLength != null && v.length < schema.minLength) errors.push(`${path} must have at least ${schema.minLength} character(s)`);
    if (schema.maxLength != null && v.length > schema.maxLength) errors.push(`${path} must have at most ${schema.maxLength} characters`);
  }
  if (Array.isArray(v)) {
    if (schema.minItems != null && v.length < schema.minItems) errors.push(`${path} needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems != null && v.length > schema.maxItems) errors.push(`${path} allows at most ${schema.maxItems} items`);
    if (schema.items) v = v.map((x, i) => check(schema.items, x, `${path}[${i}]`, errors));
  }
  if (types && types.includes('object') && v && typeof v === 'object' && !Array.isArray(v) && schema.properties) {
    const out = {};
    for (const req of schema.required || []) if (v[req] === undefined) errors.push(`${path ? path + '.' : ''}${req} is required`);
    for (const [k, val] of Object.entries(v)) {
      if (Object.hasOwn(schema.properties, k)) out[k] = check(schema.properties[k], val, path ? `${path}.${k}` : k, errors);
      else if (schema.additionalProperties === false) {
        errors.push(`unknown argument "${k}"${path ? ' in ' + path : ''}; allowed: ${Object.keys(schema.properties).join(', ')}`);
      } else out[k] = val;
    }
    return out;
  }
  return v;
}

/** Validate tool arguments against an inputSchema. Returns the (coerced) arguments or throws a ToolError. */
export function validateArgs(toolName, schema, args) {
  const errors = [];
  const input = args == null ? {} : args;
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new ToolError(`${toolName}: arguments must be an object.`, { code: 'invalid_arguments' });
  }
  const out = check(schema, input, '', errors);
  if (errors.length) {
    throw new ToolError(`${toolName}: ${errors.join('; ')}.`, { code: 'invalid_arguments', data: { errors } });
  }
  return out;
}
