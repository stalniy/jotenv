import fs from "fs";
import Ajv from "ajv";
import { buildTransformKeyword, Transformations } from "./ajv/buildTransformKeyword";
import { parseConfig, ParserOptions } from "./parseConfig";

const splitBySemicolon = (value: string) => value.split(/;\s*/);

export function loadConfig<T = Record<string, any>>(options: LoadConfigOptions): T {
  const content = fs.readFileSync(options.path, options.encoding || "utf-8");
  const config = parseConfig<T>(content, options);
  const ajv = new Ajv({
    allErrors: true,
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true,
    allowUnionTypes: true,
    keywords: [
      buildTransformKeyword({
        splitBySemicolon,
        ...options.transformations,
      }),
    ]
  });

  if (options.schema.type !== "object") {
    throw new Error(`Supports only "object" schema to validate config. ${options.schema.type} is given`);
  }

  const isValid = ajv.validate(options.schema, config);

  if (!isValid) {
    const error = new Error(ajv.errors!.map(e => e.message).join('\n'));
    Object.defineProperty(error, 'errors', { value: ajv.errors });
    throw error;
  }

  return config;
}

export interface LoadConfigOptions extends ParserOptions {
  path: string;
  encoding?: BufferEncoding;
  transformations?: Transformations;
  schema: Record<string, unknown>;
}
