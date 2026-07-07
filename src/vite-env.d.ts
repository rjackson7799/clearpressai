/// <reference types="vite/client" />

// Raw markdown imports (e.g. the user guide rendered by the Help page).
declare module "*.md?raw" {
  const content: string;
  export default content;
}
