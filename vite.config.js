import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function authDeletePlugin() {
  return {
    name: 'delete-clinic-auth-middleware',
    configureServer(server) {
      server.middlewares.use('/api/delete-clinic-auth', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { ownerId, ownerEmail, superAdminEmail } = JSON.parse(body || '{}');

              if (!superAdminEmail || superAdminEmail.toLowerCase().trim() !== "nugoxucishvili@gmail.com") {
                res.statusCode = 403;
                return res.end(JSON.stringify({ error: "Forbidden: SuperAdmin only" }));
              }

              // Check for serviceAccountKey.json
              const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
              if (!fs.existsSync(keyPath) && !process.env.FIREBASE_SERVICE_ACCOUNT) {
                return res.end(JSON.stringify({
                  authDeleted: false,
                  requiresServiceAccount: true,
                  message: "Firebase Admin SDK-ს გასაღები (serviceAccountKey.json) არ არის ატვირთული."
                }));
              }

              const adminModule = await import('firebase-admin');
              const admin = adminModule.default || adminModule;
              if (!admin.apps.length) {
                let serviceAccount;
                if (fs.existsSync(keyPath)) {
                  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                } else {
                  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                }
                admin.initializeApp({
                  credential: admin.credential.cert(serviceAccount)
                });
              }

              let targetUid = ownerId;
              if (!targetUid && ownerEmail) {
                try {
                  const userRec = await admin.auth().getUserByEmail(ownerEmail.toLowerCase().trim());
                  targetUid = userRec.uid;
                } catch (notFound) {
                  return res.end(JSON.stringify({
                    authDeleted: true,
                    message: "მომხმარებელი ვერ მოიძებნა Firebase Auth-ში."
                  }));
                }
              }

              if (targetUid) {
                try {
                  await admin.auth().deleteUser(targetUid);
                  return res.end(JSON.stringify({
                    authDeleted: true,
                    message: `მომხმარებელი ${ownerEmail || targetUid} წარმატებით წაიშალა Firebase Authentication-იდან.`
                  }));
                } catch (delErr) {
                  if (delErr.code === 'auth/user-not-found') {
                    return res.end(JSON.stringify({
                      authDeleted: true,
                      message: "მომხმარებელი უკვე აღარ არსებობს Firebase Authentication-ში."
                    }));
                  }
                  throw delErr;
                }
              }

              res.statusCode = 404;
              return res.end(JSON.stringify({ error: "UID ვერ მოიძებნა" }));
            } catch (err) {
              console.error("Auth delete middleware error:", err);
              res.statusCode = 500;
              return res.end(JSON.stringify({ authDeleted: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), authDeletePlugin()],
  server: {
    proxy: {
      '/api/ubill': {
        target: 'https://api.ubill.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ubill/, '')
      },
      '/api/ehr': {
        target: 'https://ehrsvc.moh.gov.ge',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ehr/, '')
      }
    }
  }
})
