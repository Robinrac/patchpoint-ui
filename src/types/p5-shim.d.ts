// Minimal ambient declaration for p5. We intentionally do not depend on
// `@types/p5` because its published types track p5 v1 and can drift from the v2
// runtime. The engine treats the p5 instance loosely (as the original per-app
// implementations did) and contains its usage to a single file.
declare module "p5" {
  const p5: any;
  export default p5;
}
