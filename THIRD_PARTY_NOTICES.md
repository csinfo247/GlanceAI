# Third-Party Notices

GlanceAI is licensed under the MIT License (see [LICENSE](LICENSE)). It includes or depends on the third-party software listed below, each under its own license.

## Bundled in this repository

These files are copied into `vendor/` and shipped with GlanceAI. Their original license headers are kept at the top of each file.

| Component | Version | File | License | Copyright |
| :--- | :--- | :--- | :--- | :--- |
| [marked](https://github.com/markedjs/marked) | 15.0.12 | `vendor/marked.min.js` | MIT | Copyright (c) 2011-2025, Christopher Jeffrey |
| [DOMPurify](https://github.com/cure53/DOMPurify) | 3.4.16 | `vendor/purify.min.js` | Apache-2.0 or MPL-2.0 (dual-licensed) | Copyright (c) Cure53 and other contributors |

## Installed through npm

These are downloaded by `npm install` and are not stored in this repository. Each package's license file is in its folder under `node_modules/`.

| Package | License |
| :--- | :--- |
| [electron](https://github.com/electron/electron) | MIT |
| [groq-sdk](https://github.com/groq/groq-typescript) | Apache-2.0 |
| [mammoth](https://github.com/mwilliamson/mammoth.js) | BSD-2-Clause |
| [pdf-parse](https://gitlab.com/autokent/pdf-parse) | Apache-2.0 |
| [https-proxy-agent](https://github.com/TooTallNate/proxy-agents) | MIT |
| [socks-proxy-agent](https://github.com/TooTallNate/proxy-agents) | MIT |

Development-only tools (`eslint`, `globals`, `acorn`, `cross-env`) are not shipped with the app.
