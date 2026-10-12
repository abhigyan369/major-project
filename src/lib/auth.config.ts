import type { NextAuthConfig } from "next-auth";
import { UserRole, FacultyDesignation } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.departmentId = user.departmentId;
        token.designation = user.designation;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.departmentId = token.departmentId as string | null;
        session.user.designation = token.designation as FacultyDesignation | null;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || "nie-research-publications-super-secret-auth-key-32chars",
  providers: [],
};
