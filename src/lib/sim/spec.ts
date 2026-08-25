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

/**
 * Add each new simulator here as a member. The union is closed by
 * construction: a model cannot name a simulator that does not exist.
 */
export const SimSpecSchema = z.discriminatedUnion("sim_id", [ProjectileSpecSchema]);

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
