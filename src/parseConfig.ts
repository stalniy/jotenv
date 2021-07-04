export interface ParserOptions {
  envVarPrefix?: string;
  interpolateVariables?: boolean;
  overrideByEnv?: boolean;
  debug?(message: string): void;
}

export function parseConfig<T>(content: string, options: ParserOptions = {}): T {
  const lines = content.split(/[\r\n]+/);
  const config = Object.create(null);
  const fullOptions = {
    envVarPrefix: "",
    ...options,
  };

  for (let i = 0; i < lines.length; i++) {
    const variable = parseVariable(lines[i], fullOptions);

    if (variable) {
      config[variable.name] = getValue(variable.name, variable.value, fullOptions);
    }
  }

  if (options.interpolateVariables) {
    return interpolateVariables(config, fullOptions) as unknown as T;
  }

  return config as T;
}

function parseVariable(rawLine: string, options: ParserOptions) {
  const line = rawLine.trim();

  if (!line || line.startsWith('#')) {
    options.debug?.(`Skip empty line or comment: ${line}`);
    return;
  }

  const equalsIndex = line.indexOf('=');

  if (equalsIndex === -1) {
    options.debug?.(`Skip line without variable assignment: ${line}`);
    return;
  }

  const name = line.slice(0, equalsIndex).trim();

  if (!name) {
    options.debug?.(`Skip line without variable name: ${line}`);
    return;
  }

  let trailingCommentIndex = line.indexOf('#');
  let endIndex = line.length;

  if (trailingCommentIndex !== -1 && line[trailingCommentIndex - 1] === " ") {
    endIndex = trailingCommentIndex;
  }

  let value = line.slice(equalsIndex + 1, endIndex).trim();

  if (!value) {
    return { name, value: '' };
  }

  if (value[0] === `"` || value[0] === `'`) {
    if (!value.endsWith(`'`) && !value.endsWith(`"`)) {
      throw new Error(`Variable "${name}" starts with \`${value[0]}\` but was not closed with the same symbol`);
    }

    value = value.slice(1, -1);
  }

  return { name, value };
}

function interpolateVariables(config: Record<string, string>, options: ParserOptions): Record<string, string> {
  const keys = Object.keys(config);
  const result = Object.create(null);
  const context: InterpolationContext = { result, currentPath: [], options };

  for (let i = 0; i < keys.length; i++) {
    context.currentPath = [];
    result[keys[i]] = interpolateVariable(config, keys[i], context);
  }

  return result;
}

interface InterpolationContext {
  currentPath: string[];
  result: Record<string, string>;
  options: ParserOptions;
}

const VARIABLE_REGEX = /\$\{([\w_]+)\}/g;
function interpolateVariable(config: Record<string, string>, name: string, context: InterpolationContext): string | undefined {
  const value = getValue(name, config[name], context.options);

  if (typeof value !== "string" || !value.includes('$')) {
    return value;
  }

  if (name in context.result) {
    return context.result[name];
  }

  if (context.currentPath.includes(name)) {
    throw new Error(`Circular dependency detected during variable interpolation: ${context.currentPath.concat(name).join(' -> ')}`);
  }

  context.currentPath.push(name);
  return value.replace(VARIABLE_REGEX, (_, varName) => {
    const varValue = interpolateVariable(config, varName, context);

    if (varValue === undefined) {
      throw new Error(`Unable to resolve ${varName} during interpolation (its value is undefined)`);
    }

    return varValue;
  });
}

function getValue(name: string, value: string, options: ParserOptions) {
  if (name.startsWith("ENV_")) {
    return process.env[name.slice(4)];
  }

  if (!options.overrideByEnv) {
    return value;
  }

  return process.env[options.envVarPrefix + name] ?? value;
}
