// Root barrel. Re-exports the full ParticleImage public surface so that
//   import { X } from "@patchpoint/ui"
// and
//   import { X } from "@patchpoint/ui/ParticleImage"
// expose exactly the same members. Keep these in parity — the subpath entry
// (./ParticleImage) is the single source of truth for what is public.
export * from "./ParticleImage";
