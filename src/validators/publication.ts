import { z } from "zod";
import {
  PublicationType,
  ScopusQuartile,
  StudentInvolvement,
} from "@prisma/client";


export const createPublicationSchema = z.object({
  // Basic Information
  title: z.string().min(5, "Title must be at least 5 characters long"),
  publicationType: z.nativeEnum(PublicationType).default(PublicationType.JOURNAL_ARTICLE),
  rawAuthors: z.string().min(2, "Author names are required (e.g., Dr. A. Smith, Prof. B. Roy)"),
  correspondingAuthorName: z.string().optional().nullable(),
  departmentId: z.string().min(1, "Please select a department"),
  researchAreaId: z.string().optional().nullable(),

  // Journal/Conference Information
  journalId: z.string().optional().nullable(),
  venueName: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  issn: z.string().optional().nullable(),
  volume: z.string().optional().nullable(),
  issue: z.string().optional().nullable(),
  pages: z.string().optional().nullable(),

  // Indexing
  isScopus: z.boolean().default(false),
  isWebOfScience: z.boolean().default(false),
  quartile: z.nativeEnum(ScopusQuartile).default(ScopusQuartile.UNSPECIFIED),
  impactFactor: z
    .union([z.number(), z.string().transform((val) => (val === "" ? null : Number(val)))])
    .pipe(z.number().min(0, "Impact factor must be non-negative").max(99.999, "Invalid impact factor").nullable())
    .optional(),

  // Dates
  submissionDate: z.string().optional().nullable(),
  acceptanceDate: z.string().optional().nullable(),
  publicationDate: z.string().optional().nullable(),

  // Links
  doi: z.string().optional().nullable(),
  publicationUrl: z
    .string()
    .url("Please enter a valid URL (e.g. https://doi.org/...)")
    .optional()
    .nullable()
    .or(z.literal("")),

  // Additional Information
  fundingAgency: z.string().optional().nullable(),
  grantTitle: z.string().optional().nullable(),
  grantAmountLakhs: z
    .union([z.number(), z.string().transform((val) => (val === "" ? null : Number(val)))])
    .pipe(z.number().min(0, "Amount must be zero or positive").nullable())
    .optional(),
  studentInvolvement: z.nativeEnum(StudentInvolvement).default(StudentInvolvement.NONE),
  hasCollaboration: z.boolean().default(false),
  externalCollaborators: z.string().optional().nullable(),

  // Action / Status target
  actionType: z.enum(["draft", "submit"]).default("draft"),
});

export type CreatePublicationInput = z.infer<typeof createPublicationSchema>;

