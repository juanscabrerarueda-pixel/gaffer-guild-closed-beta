const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const landingDir = path.join(repoRoot, 'landing');
const distDir = path.join(repoRoot, 'dist');

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  raw.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) return;
    out[key] = value;
  });
  return out;
};

const injectEnv = (content, envMap) => {
  const supabaseUrl =
    envMap.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    '';
  const supabaseKey =
    envMap.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return content
    .replace(/__SUPABASE_URL__/g, supabaseUrl)
    .replace(/__SUPABASE_ANON_KEY__/g, supabaseKey);
};

const copyDir = (src, dest) => {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.html')) {
        const raw = fs.readFileSync(srcPath, 'utf8');
        const envMap = loadEnvFile(path.join(repoRoot, '.env'));
        const next = injectEnv(raw, envMap);
        fs.writeFileSync(destPath, next, 'utf8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
};

const main = () => {
  if (!fs.existsSync(landingDir)) {
    throw new Error('landing directory not found');
  }
  fs.rmSync(distDir, { recursive: true, force: true });
  copyDir(landingDir, distDir);
};

main();
