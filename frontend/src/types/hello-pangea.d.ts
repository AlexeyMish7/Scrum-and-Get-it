// Provide a minimal module declaration so TypeScript stops erroring when the
// package's type declarations aren't available in the environment. This keeps
// the runtime dependency intact while avoiding a build-time TS error.
declare module "@hello-pangea/dnd";
