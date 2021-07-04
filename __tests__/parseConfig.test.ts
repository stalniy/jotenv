import { describe, expect, it } from "@jest/globals";
import { parseConfig } from "../src";

describe("parseConfig", () => {
  it('parses config and ignores invalid variables', () => {
    const config = parseConfig(`
      PORT=1020
      HOST=localhost
      API_URL="http://localhost:3000/api"
      UPLOADS_URL='http://localhost:3002/uploads'
      =invalid variable value

      # comment
          # comment that doesn't start from the beginning

      VARIABLE_WITHOUT_VALUE
      EMPTY_VARIABLE=

    `);

    expect(config).toMatchInlineSnapshot(`
Object {
  "API_URL": "http://localhost:3000/api",
  "EMPTY_VARIABLE": "",
  "HOST": "localhost",
  "PORT": "1020",
  "UPLOADS_URL": "http://localhost:3002/uploads",
}
`);
  });

  it('allows to interpolate variables', () => {
    const config = parseConfig(`
      UPLOADS_DIR=\${ENV_HOME}/uploads
      DB_HOST=localhost
      DB_USER=user
      DB_PASSWORD=secret
      DB_URL=mongodb://\${DB_USER}:\${DB_PASSWORD}@\${DB_HOST}
    `, { interpolateVariables: true });

    expect(config).toMatchInlineSnapshot(`
Object {
  "DB_HOST": "localhost",
  "DB_PASSWORD": "secret",
  "DB_URL": "mongodb://user:secret@localhost",
  "DB_USER": "user",
  "UPLOADS_DIR": "/home/serhii/uploads",
}
`);
  });

  it('throws if variable starts with a quote but not closed with one', () => {
    expect(() => parseConfig('HOST="localhost')).toThrow(/not closed with the same symbol/);
    expect(() => parseConfig('HOST=\'localhost')).toThrow(/not closed with the same symbol/);
  });

  it('prefers variable from `process.env` to variable in config if "overrideByEnv" is true', () => {
    process.env.BLA = 'env';
    const config = parseConfig<{ BLA: string }>(`BLA=config`, { overrideByEnv: true });

    expect(config.BLA).toEqual(process.env.BLA);
  });

  it('uses variable from `process.env` with custom prefix', () => {
    process.env.JENV_BLA = 'env';
    const config = parseConfig<{ BLA: string }>(`BLA=config`, { envVarPrefix: "JENV_", overrideByEnv: true });

    expect(config.BLA).toEqual(process.env.JENV_BLA);
  });

  it('detects cycles during variable interpolation', () => {
    expect(() => parseConfig(`
      UPLOADS_DIR=\${USER_HOME}/uploads
      USER_HOME=\${BASE_DIR}/user
      BASE_DIR=\${UPLOADS_DIR}
    `, { interpolateVariables: true })).toThrow(/Circular dependency detected/);
  });

  it('throws when trying to interpolate unknown variable', () => {
    expect(() => parseConfig('UPLOADS_DIR=\${USER_HOME}/uploads', { interpolateVariables: true }))
      .toThrow(/Unable to resolve USER_HOME/);
  })
})
