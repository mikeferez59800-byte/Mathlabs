// Cloudflare Pages Function: every /api/championship/* request goes to the championship API.
// The D1 database is bound as DB in Cloudflare Pages > mathlabs > Settings > Bindings (see docs/CHAMPIONNAT.md).
import { handle } from '../../../src/championship/api.mjs';

export const onRequest = (context) => handle(context.request, context.env, context);
