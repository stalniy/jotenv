# jotenv

jotenv is fast [json-schema] validated dotenv config parser.

## Installation

```sh
npm i jotenv
# or yarn add jotenv
# or pnpm add jotenv
```

## Features

* parses .env files
* overrides variables in .env files by variables with the same name from `process.env` (also supports custom prefix for env provided vars)
* variables interpolation (requires specifying `interpolateVariables`)
* custom value transformations (provides one built-in - `splitBySemicolon`)
* casts values to specified in schema types

## Usage

Define json-schema for your configuration and let jotenv load it for you. Having config like this:

```.env
DB_HOST=localhost
DB_PORT=27017
DB_PASSWORD=secret
ALLOWED_HOSTS=http://localhost:3000; http://localhost:5000
```

jotenv allows us to parse it into JavaScript object with coerced types:

```ts
import { loadConfig } from "jotenv";

const schema = {
  type: "object",
  required: ["DB_PORT", "DB_HOST", "ALLOWED_HOSTS"],
  properties: {
    DB_PORT: {
      type: "number"
    },
    DB_HOST: {
      type: "string"
    },
    DB_PASSWORD: {
      type: "string",
    },
    ALLOWED_HOSTS: {
      type: "string",
      transform: "splitBySemicolon",
    },
  }
};

const config = loadConfig({
  path: `${process.cwd()}/.env`,
  schema,
});

// {
//   DB_PORT: 27017,
//   DB_HOST: "localhost",
//   DB_PASSWORD: "secret",
//   ALLOWED_HOSTS: ["http://locahost:3000", "http://locahost:5000"]
// }
```

## Encryption through custom transformation

Sometimes, it may be useful to keep configuration files together with application code, so they don't go out of sync and other contributors may change them. But it's unsafe to keep all configs in plain text, especially passwords, tokens, etc.

To solve this, we need to encrypt sensitive values and decrypt them when application starts. To do this with jotenv, we just need to provide a custom transformation:

```ts
import { loadConfig } from "jotenv";

const schema = {
  type: "object",
  required: ["DB_PASSWORD", "DB_HOST"],
  properties: {
    DB_HOST: {
      type: "string"
    },
    DB_PASSWORD: {
      type: "string",
      transform: "decrypt"
    },
  }
};

const config = loadConfig({
  path: `${process.cwd()}/.env`,
  schema,
  transformations: {
    decrypt(value: string) {
      // custom decryption algorithm
    }
  }
});
```

## Licence

[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0), 2021-present Sergii Stotskyi

[json-schema]: https://json-schema.org/
