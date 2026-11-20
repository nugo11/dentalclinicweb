import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const LOCAL_API_ROUTES = {
  '/api/delete-clinic-auth': './api/delete-clinic-auth.js',
  '/api/cloudinary-delete': './api/cloudinary-delete.js',
  '/api/sms-otp': './api/sms-otp.js',
  '/api/send-appointment-sms': './api/send-appointment-sms.js',
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function localApiPlugin() {
  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        const routeModule = LOCAL_API_ROUTES[pathname];
        if (!routeModule) {
          next();
          return;
        }

        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (payload) => {
          if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify(payload));
          return res;
        };

        try {
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            req.body = await readJsonBody(req);
          } else {
            req.body = {};
          }
          const mod = await import(routeModule);
          await mod.default(req, res);
        } catch (err) {
          console.error(`Local API error (${pathname}):`, err);
          if (!res.writableEnded) {
            res.status(err.message === 'Invalid JSON body' ? 400 : 500).json({
              error: err.message || 'Internal Server Error',
            });
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), localApiPlugin()],
    server: {
      proxy: {
        '/api/ehr': {
          target: 'https://ehrsvc.moh.gov.ge',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ehr/, ''),
        },
      },
    },
  };
});
