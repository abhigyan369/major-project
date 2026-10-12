import {
  Publication,
  Department,
  Journal,
  PublicationAuthor,
  User,
} from "@prisma/client";

export type PublicationWithDetails = Publication & {
  department: Department;
  journal?: Journal | null;
  authors: (PublicationAuthor & {
    user: User;
  })[];
};

export interface PublicationFilterOptions {
  departmentId?: string;
  status?: string;
  publicationType?: string;
  quartile?: string;
  isWebOfScience?: boolean;
  searchQuery?: string;
  page?: number;
  limit?: number;
}
