/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@localhub/shared-types"],
};

module.exports = nextConfig;
