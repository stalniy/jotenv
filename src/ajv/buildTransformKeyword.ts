import { KeywordDefinition } from 'ajv';

export type Transformations = Record<string, (value: any) => any>;

export function buildTransformKeyword(transforms: Transformations): KeywordDefinition {
  return {
    type: "string",
    keyword: "transform",
    schemaType: "string",
    modifying: true,
    errors: false,
    valid: true,
    compile(schema) {
      const transform = transforms[schema];

      if (typeof transform !== "function") {
        throw new Error(`Unknown value transform "${schema}". Did you provide its implementation into "loadConfig"?`);
      }

      return (_, dataCxt) => {
        if (!dataCxt) {
          throw new Error('Transformation is only supported on objects');
        }
        dataCxt.parentData[dataCxt.parentDataProperty] = transform(dataCxt.parentData[dataCxt.parentDataProperty]);
        return true;
      };
    },
  }
}
