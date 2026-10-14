/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Drivers de banco carregados do node_modules em tempo de execução, sem empacotar.
  serverExternalPackages: ["postgres", "@electric-sql/pglite"],
};

export default nextConfig;
