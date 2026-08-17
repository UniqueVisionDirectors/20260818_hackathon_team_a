/**
 * Knip configuration for the Vue application.
 *
 * This configuration is optimized for:
 * - Vue 3 with Vue Router
 * - Vite build system
 */

export default {
  "$schema": "https://unpkg.com/knip@6/schema.json",

  // Entry files - where the application starts
  entry: [
    "src/router/index.ts",
    "src/views/**/*.vue",
    "index.html"
  ],

  // Project files to analyze
  project: [
    "src/**/*.{js,ts,vue}",
    "!src/**/*.test.{js,ts}",
    "!src/**/__tests__/**",
    "!src/test/**"
  ],

  // Ignore exports that are only used in the same file
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
    enum: true
  },

  // Vue plugin configuration
  vue: {
    config: ["vite.config.{js,ts,mjs}"]
  },

  // Vite plugin configuration
  vite: {
    config: ["vite.config.{js,ts,mjs}"]
  },

  // Path alias configuration matching tsconfig and vite
  paths: {
    "@/*": ["./src/*"]
  },

  // Rules for different issue types
  rules: {
    files: "error",  // Unused files
    dependencies: "warn",  // Changed to warn due to complex shadcn-vue deps
    unlisted: "error",  // Dependencies used but not in package.json
    exports: "warn",  // Unused exports
    nsExports: "warn",  // Namespace exports
    types: "warn",  // Unused types
    nsTypes: "warn",  // Namespace types
    enumMembers: "off",  // Enum members (often used implicitly)
    duplicates: "error"  // Duplicate exports
  }
};
