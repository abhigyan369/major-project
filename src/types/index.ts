import {
  Department,
  User,
  Publication,
  Journal,
  PublicationAuthor,
  Approval,
  PublicationDocument,
} from "@prisma/client";

export type {
  Department,
  User,
  Publication,
  Journal,
  PublicationAuthor,
  Approval,
  PublicationDocument,
};

export interface NavigationItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  active?: boolean;
}

export interface UserSessionProfile {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  designation: string;
  departmentCode: string;
  departmentName: string;
  avatarUrl?: string;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  description: string;
  iconName: string;
}
