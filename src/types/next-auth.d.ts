import { UserRole, FacultyDesignation } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      departmentId?: string | null;
      designation?: FacultyDesignation | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    departmentId?: string | null;
    designation?: FacultyDesignation | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    departmentId?: string | null;
    designation?: FacultyDesignation | null;
  }
}
