/**
 * The sim spec — the only thing a model is ever allowed to produce.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  FIELD ORDER IS SEMANTIC. DO NOT ALPHABETISE. DO NOT REORDER.
 *
 *  Gemini emits `responseJsonSchema` properties in declaration order, and an
 *  autoregressive model conditions each field on the ones before it. Every
 *  measured result says the reasoning must come first: models that answer
 *  first and justify afterwards produce post-hoc rationalisation, not
 *  reasoning (Tam et al.; Claude-3-Haiku GSM8K 86.5 -> 23.4 when forced to
 *  answer first).
 *
 *  So: `reasoning`, then the decision, then the parameters it implies.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The spec is DATA. It is never evaluated, never compiled, never executed.
 * `sim_id` selects a hand-written simulator from a closed registry — the
 * Action-Selector pattern (arXiv 2506.08837), which is why prompt injection
 * has nothing to reach here.
 */

import { z } from "zod";

/** Bounds are physical sanity limits, not taste. Anything outside is refused. */
export const ProjectileParamsSchema = z.object({
  speed_m_s: z.number().min(0.1).max(300),
  angle_deg: z.number().min(-89).max(89),
  launch_height_m: z.number().min(0).max(1000),
  mass_kg: z.number().min(0.001).max(1000),
  area_m2: z.number().min(1e-6).max(10),
  drag_coefficient: z.number().min(0.01).max(2),
  gravity_m_s2: z.number().min(0.1).max(30),
});

export const ProjectileIdealizationsSchema = z.object({
  air_resistance: z.boolean(),
});

export const ProjectileSpecSchema = z.object({
  sim_id: z.literal("projectile"),
  params: ProjectileParamsSchema,
  idealizations: ProjectileIdealizationsSchema.optional(),
});

export const FreeFallParamsSchema = z.object({
  drop_height_m: z.number().min(0.1).max(2000),
  mass_a_kg: z.number().min(0.001).max(1000),
  area_a_m2: z.number().min(1e-6).max(10),
  mass_b_kg: z.number().min(0.001).max(1000),
  area_b_m2: z.number().min(1e-6).max(10),
  drag_coefficient: z.number().min(0.01).max(2),
  gravity_m_s2: z.number().min(0.1).max(30),
});

export const FreeFallSpecSchema = z.object({
  sim_id: z.literal("freefall"),
  params: FreeFallParamsSchema,
  idealizations: z.object({ air_resistance: z.boolean() }).optional(),
});

export const PendulumParamsSchema = z.object({
  length_m: z.number().min(0.01).max(100),
  // 180 is excluded, not clamped: balanced exactly upright the period is
  // infinite, and there is no honest simulation of that to show.
  release_angle_deg: z.number().min(0.1).max(175),
  mass_kg: z.number().min(0.001).max(1000),
  gravity_m_s2: z.number().min(0.1).max(30),
});

export const PendulumSpecSchema = z.object({
  sim_id: z.literal("pendulum"),
  params: PendulumParamsSchema,
  idealizations: z.object({ small_angle: z.boolean() }).optional(),
});

export const CollisionParamsSchema = z.object({
  mass_1_kg: z.number().min(0.001).max(100000),
  velocity_1_m_s: z.number().min(-300).max(300),
  mass_2_kg: z.number().min(0.001).max(100000),
  velocity_2_m_s: z.number().min(-300).max(300),
  // Zero is excluded: a perfectly inelastic contact is a singular limit of
  // this spring-dashpot model, not a value it can take. 0.01 looks like
  // sticking and stays inside the model.
  restitution: z.number().min(0.01).max(1),
  contact_stiffness_n_m: z.number().min(1e3).max(1e9),
  radius_m: z.number().min(0.01).max(50),
});

export const CollisionSpecSchema = z.object({
  sim_id: z.literal("collision"),
  params: CollisionParamsSchema,
  idealizations: z.object({ perfectly_elastic: z.boolean() }).optional(),
});

export const InclineParamsSchema = z.object({
  incline_angle_deg: z.number().min(0.1).max(89),
  length_m: z.number().min(0.05).max(1000),
  mass_kg: z.number().min(0.001).max(10000),
  mu_static: z.number().min(0).max(3),
  mu_kinetic: z.number().min(0).max(3),
  gravity_m_s2: z.number().min(0.1).max(30),
});

export const InclineSpecSchema = z.object({
  sim_id: z.literal("incline"),
  params: InclineParamsSchema,
  idealizations: z.object({ friction: z.boolean() }).optional(),
});

/**
 * Add each new simulator here as a member. The union is closed by
 * construction: a model cannot name a simulator that does not exist.
 *
 * Adding a member here without adding a case to runSpec's switch is a compile
 * error, by design — see registry.ts.
 */
export const SimSpecSchema = z.discriminatedUnion("sim_id", [
  ProjectileSpecSchema,
  FreeFallSpecSchema,
  PendulumSpecSchema,
  CollisionSpecSchema,
  InclineSpecSchema,
]);

export type SimSpec = z.infer<typeof SimSpecSchema>;
export type SimId = SimSpec["sim_id"];

/**
 * The routing envelope (wired up on day 8). Declared now so the field order
 * above is settled before anything depends on it.
 *
 * PLAN §3 rule 9: abstention is a first-class output, not an error path. A
 * graceful "I can't build a simulation I'm confident in for that" is a
 * credibility win; a confident wrong physics demo is unrecoverable.
 */
export const RouteEnvelopeSchema = z.discriminatedUnion("decision", [
  z.object({
    reasoning: z.string().min(1),
    decision: z.literal("simulate"),
    student_question_restated: z.string().min(1),
    spec: SimSpecSchema,
  }),
  z.object({
    reasoning: z.string().min(1),
    decision: z.literal("abstain"),
    why_not: z.string().min(1),
    suggested_instead: z.array(z.string()).max(3),
  }),
]);

export type RouteEnvelope = z.infer<typeof RouteEnvelopeSchema>;
