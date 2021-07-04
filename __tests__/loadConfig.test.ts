import { describe, expect, it } from "@jest/globals";
import { loadConfig } from "../src";

describe("loadConfig", () => {
  it("loads file into config object and coerces types", () => {
    const config = loadConfig({
      path: `${__dirname}/.env`,
      schema: {
        type: "object",
        properties: {
          ALLOWED_HOSTS: {
            type: "string",
            transform: "splitBySemicolon"
          },
          PORT: {
            type: "number",
          },
          ENABLE_FEATURE: {
            type: "boolean"
          },
          SECRET: {
            type: "string",
            transform: "decrypt"
          }
        }
      },
      transformations: {
        decrypt(value: string) {
          return value.split('').reverse().join('');
        }
      }
    });

    expect(config).toMatchInlineSnapshot(`
Object {
  "ALLOWED_HOSTS": Array [
    "http://localhost:3000",
    "http://localhost:5000",
  ],
  "ENABLE_FEATURE": true,
  "PORT": 8000,
  "SECRET": "secret",
}
`);
  })
})
