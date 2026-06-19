/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

interface Navigator {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
}
