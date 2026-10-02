import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // NOTE: SUPABASE_SERVICE_ROLE_KEY must never appear here or in any
  // NEXT_PUBLIC_* variable — this config is bundled into client code.
  // Next.js automatically loads .env.local and exposes only NEXT_PUBLIC_*
  // variables to the browser, so no env block is needed.
};

export default nextConfig;
