/**
 * Input Validation Schemas
 *
 * Zod schemas for validating all agent inputs
 */

import { z } from "zod";

// ============================================================================
// Personal Lead Research
// ============================================================================

export const PersonalLeadInputSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters")
    .trim(),
  company: z
    .string()
    .max(200, "Company name must be less than 200 characters")
    .trim()
    .optional(),
  context: z
    .string()
    .max(1000, "Context must be less than 1000 characters")
    .trim()
    .optional(),
});

export type PersonalLeadInputValidated = z.infer<typeof PersonalLeadInputSchema>;

// ============================================================================
// PDC Lead Research
// ============================================================================

export const PDCLeadInputSchema = z.object({
  researchType: z.enum(["market", "lead", "collaboration"], {
    errorMap: () => ({ message: "Research type must be: market, lead, or collaboration" }),
  }),
  // Market research
  targetArea: z
    .string()
    .max(200, "Target area must be less than 200 characters")
    .trim()
    .optional(),
  targetSegment: z
    .string()
    .max(200, "Target segment must be less than 200 characters")
    .trim()
    .optional(),
  // Lead research
  athleteName: z
    .string()
    .max(200, "Athlete name must be less than 200 characters")
    .trim()
    .optional(),
  sport: z
    .string()
    .max(100, "Sport must be less than 100 characters")
    .trim()
    .optional(),
  level: z
    .string()
    .max(100, "Level must be less than 100 characters")
    .trim()
    .optional(),
  // Collaboration research
  organizationName: z
    .string()
    .max(200, "Organization name must be less than 200 characters")
    .trim()
    .optional(),
  collaborationType: z
    .string()
    .max(100, "Collaboration type must be less than 100 characters")
    .trim()
    .optional(),
});

export type PDCLeadInputValidated = z.infer<typeof PDCLeadInputSchema>;

// ============================================================================
// STS Lead Research
// ============================================================================

export const STSLeadInputSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name must be less than 200 characters")
    .trim(),
  website: z
    .string()
    .max(500, "Website URL must be less than 500 characters")
    .url("Website must be a valid URL")
    .trim()
    .optional()
    .or(z.literal("")),
  contactName: z
    .string()
    .max(200, "Contact name must be less than 200 characters")
    .trim()
    .optional(),
  contactTitle: z
    .string()
    .max(200, "Contact title must be less than 200 characters")
    .trim()
    .optional(),
  source: z
    .string()
    .max(200, "Source must be less than 200 characters")
    .trim()
    .optional(),
  knownNeeds: z
    .string()
    .max(1000, "Known needs must be less than 1000 characters")
    .trim()
    .optional(),
});

export type STSLeadInputValidated = z.infer<typeof STSLeadInputSchema>;

// ============================================================================
// PDC Social Content
// ============================================================================

export const PDCContentInputSchema = z.object({
  action: z.enum(["repurpose", "generate"], {
    errorMap: () => ({ message: "Action must be: repurpose or generate" }),
  }),
  sourceContent: z
    .string()
    .max(10000, "Source content must be less than 10000 characters")
    .trim()
    .optional(),
  topic: z
    .string()
    .max(500, "Topic must be less than 500 characters")
    .trim()
    .optional(),
  pillar: z
    .enum(["hidden_game", "character", "transition", "eric_journey", "parent_education"])
    .optional(),
  targetAudience: z
    .enum(["athletes", "parents", "coaches", "general"])
    .optional(),
});

export type PDCContentInputValidated = z.infer<typeof PDCContentInputSchema>;

// ============================================================================
// STS Social Content
// ============================================================================

export const STSContentInputSchema = z.object({
  action: z.enum(["repurpose", "generate"], {
    errorMap: () => ({ message: "Action must be: repurpose or generate" }),
  }),
  sourceContent: z
    .string()
    .max(10000, "Source content must be less than 10000 characters")
    .trim()
    .optional(),
  topic: z
    .string()
    .max(500, "Topic must be less than 500 characters")
    .trim()
    .optional(),
  pillar: z
    .enum(["tech_trends", "partner_spotlight", "case_studies", "eric_expertise", "company_culture"])
    .optional(),
  partnerFocus: z
    .enum(["cisco", "dell", "oracle", "lenovo", "hp"])
    .optional(),
});

export type STSContentInputValidated = z.infer<typeof STSContentInputSchema>;

// ============================================================================
// Helper: Validate and return errors in user-friendly format
// ============================================================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into user-friendly message
  const errors = result.error.errors.map((err) => {
    const field = err.path.join(".");
    return field ? `${field}: ${err.message}` : err.message;
  });

  return {
    success: false,
    error: errors.join("; "),
  };
}
