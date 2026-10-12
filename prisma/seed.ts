import {
  PrismaClient,
  UserRole,
  UserStatus,
  FacultyDesignation,
  PublicationStatus,
  PublicationType,
  ScopusQuartile,
  StudentInvolvement,
  AuthorType,
  ApprovalAction,
  DocumentType,
  NotificationType,
  AuditAction,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting NIE Research Database Seeding...");

  // ----------------------------------------------------------------------
  // 1. CAMPUSES
  // ----------------------------------------------------------------------
  console.log("🏫 Seeding Campuses...");
  const southCampus = await prisma.campus.upsert({
    where: { code: "SOUTH" },
    update: {},
    create: {
      code: "SOUTH",
      name: "South Campus",
      location: "Manandavadi Road, Mysuru, Karnataka 570008",
    },
  });

  const northCampus = await prisma.campus.upsert({
    where: { code: "NORTH" },
    update: {},
    create: {
      code: "NORTH",
      name: "North Campus",
      location: "Hootagalli Industrial Area, Mysuru, Karnataka 570018",
    },
  });

  console.log("✅ Campuses created/updated.");

  // ----------------------------------------------------------------------
  // 2. DEPARTMENTS
  // ----------------------------------------------------------------------
  console.log("🏢 Seeding 10 Canonical NIE Departments...");
  const departmentsData = [
    { code: "CSE", name: "Department of Computer Science & Engineering", campusId: southCampus.id, facultyCount: 71, targetPerFaculty: 3.0 },
    { code: "ISE", name: "Department of Information Science & Engineering", campusId: southCampus.id, facultyCount: 88, targetPerFaculty: 3.0 },
    { code: "ECE", name: "Department of Electronics & Communication Engineering", campusId: southCampus.id, facultyCount: 88, targetPerFaculty: 3.0 },
    { code: "MECH", name: "Department of Mechanical Engineering", campusId: southCampus.id, facultyCount: 61, targetPerFaculty: 3.0 },
    { code: "CIVIL", name: "Department of Civil Engineering", campusId: southCampus.id, facultyCount: 47, targetPerFaculty: 3.0 },
    { code: "EEE", name: "Department of Electrical & Electronics Engineering", campusId: southCampus.id, facultyCount: 29, targetPerFaculty: 3.0 },
    { code: "MCA", name: "Department of Master of Computer Applications", campusId: southCampus.id, facultyCount: 23, targetPerFaculty: 3.0 },
    { code: "MATHS", name: "Department of Mathematics", campusId: southCampus.id, facultyCount: 28, targetPerFaculty: 3.0 },
    { code: "PHY", name: "Department of Physics", campusId: northCampus.id, facultyCount: 39, targetPerFaculty: 3.0 },
    { code: "CHEM", name: "Department of Chemistry", campusId: northCampus.id, facultyCount: 23, targetPerFaculty: 3.0 },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of departmentsData) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
    deptMap[dept.code] = created.id;
  }
  console.log("✅ 10 Departments seeded.");

  // ----------------------------------------------------------------------
  // 3. RESEARCH AREAS
  // ----------------------------------------------------------------------
  console.log("🔬 Seeding Research Areas...");
  const researchAreasData = [
    { name: "Artificial Intelligence & Machine Learning", description: "Deep learning, Computer vision, NLP, and Intelligent systems." },
    { name: "Data Science & Cloud Computing", description: "Big data analytics, Distributed systems, and Edge computing." },
    { name: "VLSI & Embedded Systems", description: "Semiconductors, Microelectronics, and Internet of Things (IoT)." },
    { name: "Thermal & Manufacturing Engineering", description: "Heat transfer, Renewable energy systems, CAD/CAM, and Robotics." },
    { name: "Structural Engineering & Smart Materials", description: "Concrete technology, Geotechnical engineering, and Nanomaterials." },
    { name: "Applied Mathematics & Signal Processing", description: "Numerical analysis, Cryptography, and Digital communications." },
  ];

  const raMap: Record<string, string> = {};
  for (const ra of researchAreasData) {
    const created = await prisma.researchArea.upsert({
      where: { name: ra.name },
      update: ra,
      create: ra,
    });
    raMap[ra.name] = created.id;
  }
  console.log("✅ Research Areas seeded.");

  // ----------------------------------------------------------------------
  // 4. JOURNALS (MASTER REPOSITORY)
  // ----------------------------------------------------------------------
  console.log("📚 Seeding Master Journals...");
  const journalsData = [
    { name: "IEEE Transactions on Pattern Analysis and Machine Intelligence", publisher: "IEEE", issn: "0162-8828", impactFactor: 23.6, scopusQuartile: ScopusQuartile.Q1, isScopus: true, isWebOfScience: true },
    { name: "Elsevier Journal of Systems Architecture", publisher: "Elsevier", issn: "1383-7621", impactFactor: 4.5, scopusQuartile: ScopusQuartile.Q1, isScopus: true, isWebOfScience: true },
    { name: "Springer Soft Computing", publisher: "Springer Nature", issn: "1432-7643", impactFactor: 3.8, scopusQuartile: ScopusQuartile.Q2, isScopus: true, isWebOfScience: true },
    { name: "Nature Scientific Reports", publisher: "Nature Publishing Group", issn: "2045-2322", impactFactor: 4.6, scopusQuartile: ScopusQuartile.Q1, isScopus: true, isWebOfScience: true },
    { name: "ACM Computing Surveys", publisher: "ACM", issn: "0360-0300", impactFactor: 16.6, scopusQuartile: ScopusQuartile.Q1, isScopus: true, isWebOfScience: true },
    { name: "IEEE Sensors Journal", publisher: "IEEE", issn: "1530-437X", impactFactor: 4.3, scopusQuartile: ScopusQuartile.Q2, isScopus: true, isWebOfScience: true },
  ];

  const journalMap: Record<string, string> = {};
  for (const j of journalsData) {
    const created = await prisma.journal.upsert({
      where: { name: j.name },
      update: j,
      create: j,
    });
    journalMap[j.name] = created.id;
  }
  console.log("✅ Master Journals seeded.");

  // ----------------------------------------------------------------------
  // 5. USERS (ADMIN & TEST FACULTY)
  // ----------------------------------------------------------------------
  console.log("👤 Seeding System Admin and Faculty Users...");
  
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nie.ac.in" },
    update: { role: UserRole.ADMIN, status: UserStatus.ACTIVE, passwordHash: defaultPasswordHash },
    create: {
      name: "System Administrator",
      email: "admin@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["CSE"],
      designation: FacultyDesignation.PROFESSOR,
    },
  });

  // Faculty User 1: Dr. S. R. Sharma (CSE - HOD / Professor)
  const userSharma = await prisma.user.upsert({
    where: { email: "srsharma@nie.ac.in" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Dr. S. R. Sharma",
      email: "srsharma@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      designation: FacultyDesignation.PROFESSOR,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["CSE"],
    },
  });

  // Faculty User 2: Dr. Ananya Rao (ECE - Associate Professor)
  const userRao = await prisma.user.upsert({
    where: { email: "ananya.rao@nie.ac.in" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Dr. Ananya Rao",
      email: "ananya.rao@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      designation: FacultyDesignation.ASSOCIATE_PROFESSOR,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["ECE"],
    },
  });

  // Faculty User 3: Dr. Rajesh Kumar (MECH - Assistant Professor)
  const userKumar = await prisma.user.upsert({
    where: { email: "rajesh.kumar@nie.ac.in" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      designation: FacultyDesignation.ASSISTANT_PROFESSOR,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["MECH"],
    },
  });

  // Faculty User 4: Dr. Suresh V. (PHY - Professor)
  const userSuresh = await prisma.user.upsert({
    where: { email: "suresh.v@nie.ac.in" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Dr. Suresh V.",
      email: "suresh.v@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      designation: FacultyDesignation.PROFESSOR,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["PHY"],
    },
  });

  // Scholar User 5: Kavya M. (CSE - Research Scholar)
  const userKavya = await prisma.user.upsert({
    where: { email: "kavya.m@nie.ac.in" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      name: "Kavya M.",
      email: "kavya.m@nie.ac.in",
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      designation: FacultyDesignation.RESEARCH_SCHOLAR,
      status: UserStatus.ACTIVE,
      departmentId: deptMap["CSE"],
    },
  });

  console.log("✅ Users seeded (1 Admin, 5 Faculty/Scholars) with hashed passwords.");

  // ----------------------------------------------------------------------
  // 6. PUBLICATIONS & WORKFLOW ENTITIES
  // ----------------------------------------------------------------------
  console.log("📄 Seeding Comprehensive Test Publications with Full Workflows...");
  
  // Clean up existing publications to ensure fresh seed
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.publicationDocument.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.publicationAuthor.deleteMany({});
  await prisma.publication.deleteMany({});

  // Pub 1: PUBLISHED
  const pub1 = await prisma.publication.create({
    data: {
      title: "Deep Learning Architectures for Autonomous Edge Computing in IoT Networks",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      journalId: journalMap["IEEE Transactions on Pattern Analysis and Machine Intelligence"],
      publisher: "IEEE",
      issn: "0162-8828",
      volume: "47",
      issue: "3",
      pages: "1420-1435",
      doi: "10.1109/TPAMI.2025.10928374",
      publicationUrl: "https://ieeexplore.ieee.org/document/10928374",
      researchAreaId: raMap["Artificial Intelligence & Machine Learning"],
      departmentId: deptMap["CSE"],
      correspondingAuthorId: userSharma.id,
      correspondingAuthorName: "Dr. S. R. Sharma",
      startDate: new Date("2024-06-10"),
      submissionDate: new Date("2024-09-15"),
      acceptanceDate: new Date("2025-01-20"),
      publicationDate: new Date("2025-03-01"),
      status: PublicationStatus.PUBLISHED,
      isScopus: true,
      isWebOfScience: true,
      quartile: ScopusQuartile.Q1,
      impactFactor: 23.6,
      citationCount: 12,
      citationLastUpdated: new Date(),
      fundingAgency: "SERB (Science and Engineering Research Board)",
      grantTitle: "Edge AI Infrastructure for Smart Cities",
      grantAmountLakhs: 25.5,
      studentInvolvement: StudentInvolvement.PHD_ONLY,
      isPhdThesisRelated: true,
      hasCollaboration: true,
      externalCollaborators: "Prof. John Doe (MIT, USA)",
      createdById: userSharma.id,

      authors: {
        create: [
          { userId: userSharma.id, authorName: "Dr. S. R. Sharma", authorEmail: "srsharma@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
          { userId: userRao.id, authorName: "Dr. Ananya Rao", authorEmail: "ananya.rao@nie.ac.in", authorOrder: 2, isInternal: true, isCorresponding: false, authorType: AuthorType.FACULTY },
          { authorName: "Prof. John Doe", authorEmail: "jdoe@mit.edu", affiliation: "MIT, Cambridge, MA", authorOrder: 3, isInternal: false, isCorresponding: false, authorType: AuthorType.EXTERNAL },
        ],
      },
      approvals: {
        create: [
          { adminId: adminUser.id, action: ApprovalAction.APPROVED, comment: "Excellent Q1 IEEE paper. Meets all publication criteria.", createdAt: new Date("2025-01-22") },
        ],
      },
      documents: {
        create: [
          { fileName: "TPAMI_2025_Final_Published.pdf", fileType: "application/pdf", filePath: "/uploads/pubs/tpami_2025.pdf", documentType: DocumentType.PUBLISHED_PDF, uploadedById: userSharma.id },
        ],
      },
      notifications: {
        create: [
          { userId: userSharma.id, type: NotificationType.PUBLICATION_APPROVED, title: "Publication Approved", message: "Your paper 'Deep Learning Architectures...' has been approved by Admin." },
        ],
      },
    },
  });

  // Pub 2: APPROVED
  const pub2 = await prisma.publication.create({
    data: {
      title: "Thermal Performance Analysis of Phase Change Materials in Solar Energy Storage",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      journalId: journalMap["Nature Scientific Reports"],
      publisher: "Nature Publishing Group",
      issn: "2045-2322",
      volume: "15",
      issue: "1",
      pages: "8839",
      doi: "10.1038/s41598-025-88392-1",
      publicationUrl: "https://www.nature.com/articles/s41598-025-88392-1",
      researchAreaId: raMap["Thermal & Manufacturing Engineering"],
      departmentId: deptMap["MECH"],
      correspondingAuthorId: userKumar.id,
      correspondingAuthorName: "Dr. Rajesh Kumar",
      startDate: new Date("2024-08-01"),
      submissionDate: new Date("2024-11-10"),
      acceptanceDate: new Date("2025-02-14"),
      status: PublicationStatus.APPROVED,
      isScopus: true,
      isWebOfScience: true,
      quartile: ScopusQuartile.Q1,
      impactFactor: 4.6,
      citationCount: 0,
      fundingAgency: "DST (Department of Science and Technology)",
      grantTitle: "Solar Thermal Storage Innovations",
      grantAmountLakhs: 18.0,
      studentInvolvement: StudentInvolvement.UG_ONLY,
      createdById: userKumar.id,

      authors: {
        create: [
          { userId: userKumar.id, authorName: "Dr. Rajesh Kumar", authorEmail: "rajesh.kumar@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
          { userId: userSuresh.id, authorName: "Dr. Suresh V.", authorEmail: "suresh.v@nie.ac.in", authorOrder: 2, isInternal: true, isCorresponding: false, authorType: AuthorType.FACULTY },
        ],
      },
      approvals: {
        create: [
          { adminId: adminUser.id, action: ApprovalAction.APPROVED, comment: "Approved for publication record.", createdAt: new Date("2025-02-16") },
        ],
      },
      documents: {
        create: [
          { fileName: "Acceptance_Letter_Nature_SR.pdf", fileType: "application/pdf", filePath: "/uploads/pubs/acceptance_nature.pdf", documentType: DocumentType.ACCEPTANCE_LETTER, uploadedById: userKumar.id },
        ],
      },
    },
  });

  // Pub 3: REVISION_REQUIRED
  const pub3 = await prisma.publication.create({
    data: {
      title: "Smart Concrete Mix Design Using Industrial Fly Ash and Machine Learning Optimization",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      journalId: journalMap["Springer Soft Computing"],
      publisher: "Springer Nature",
      issn: "1432-7643",
      researchAreaId: raMap["Structural Engineering & Smart Materials"],
      departmentId: deptMap["CIVIL"],
      correspondingAuthorId: userRao.id,
      correspondingAuthorName: "Dr. Ananya Rao",
      startDate: new Date("2024-10-01"),
      submissionDate: new Date("2024-12-05"),
      status: PublicationStatus.REVISION_REQUIRED,
      isScopus: true,
      isWebOfScience: true,
      quartile: ScopusQuartile.Q2,
      impactFactor: 3.8,
      studentInvolvement: StudentInvolvement.PG_ONLY,
      createdById: userRao.id,

      authors: {
        create: [
          { userId: userRao.id, authorName: "Dr. Ananya Rao", authorEmail: "ananya.rao@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
          { authorName: "Mahesh B. S.", authorEmail: "mahesh.civil@nie.ac.in", affiliation: "NIE Mysuru (PG Student)", authorOrder: 2, isInternal: true, isCorresponding: false, isStudent: true, authorType: AuthorType.STUDENT },
        ],
      },
      approvals: {
        create: [
          { adminId: adminUser.id, action: ApprovalAction.REQUEST_CHANGES, comment: "Please attach reviewer comments and proof of WoS indexing.", createdAt: new Date("2025-01-10") },
        ],
      },
      documents: {
        create: [
          { fileName: "Manuscript_v1_Draft.pdf", fileType: "application/pdf", filePath: "/uploads/pubs/manuscript_v1.pdf", documentType: DocumentType.MANUSCRIPT, uploadedById: userRao.id },
        ],
      },
      notifications: {
        create: [
          { userId: userRao.id, type: NotificationType.CHANGES_REQUESTED, title: "Revision Requested", message: "Admin has requested changes for 'Smart Concrete Mix Design'." },
        ],
      },
    },
  });

  // Pub 4: UNDER_REVIEW
  const pub4 = await prisma.publication.create({
    data: {
      title: "Optimized Graph Neural Networks for Chemical Compound Property Prediction",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      journalId: journalMap["Elsevier Journal of Systems Architecture"],
      publisher: "Elsevier",
      issn: "1383-7621",
      researchAreaId: raMap["Data Science & Cloud Computing"],
      departmentId: deptMap["CSE"],
      correspondingAuthorId: userSharma.id,
      correspondingAuthorName: "Dr. S. R. Sharma",
      startDate: new Date("2024-11-01"),
      submissionDate: new Date("2025-01-15"),
      status: PublicationStatus.UNDER_REVIEW,
      isScopus: true,
      isWebOfScience: true,
      quartile: ScopusQuartile.Q1,
      impactFactor: 4.5,
      studentInvolvement: StudentInvolvement.PHD_ONLY,
      isPhdThesisRelated: true,
      createdById: userKavya.id,

      authors: {
        create: [
          { userId: userKavya.id, authorName: "Kavya M.", authorEmail: "kavya.m@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: false, isStudent: true, authorType: AuthorType.STUDENT },
          { userId: userSharma.id, authorName: "Dr. S. R. Sharma", authorEmail: "srsharma@nie.ac.in", authorOrder: 2, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
        ],
      },
    },
  });

  // Pub 5: SUBMITTED
  const pub5 = await prisma.publication.create({
    data: {
      title: "Quantum Dot Sensitized Solar Cells: Efficiency Optimization in Nanomaterials",
      publicationType: PublicationType.JOURNAL_ARTICLE,
      journalId: journalMap["Nature Scientific Reports"],
      publisher: "Nature Publishing Group",
      researchAreaId: raMap["Applied Mathematics & Signal Processing"],
      departmentId: deptMap["PHY"],
      correspondingAuthorId: userSuresh.id,
      correspondingAuthorName: "Dr. Suresh V.",
      startDate: new Date("2025-01-05"),
      submissionDate: new Date("2025-02-20"),
      status: PublicationStatus.SUBMITTED,
      isScopus: true,
      quartile: ScopusQuartile.Q1,
      impactFactor: 4.6,
      createdById: userSuresh.id,

      authors: {
        create: [
          { userId: userSuresh.id, authorName: "Dr. Suresh V.", authorEmail: "suresh.v@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
        ],
      },
    },
  });

  // Pub 6: DRAFT
  const pub6 = await prisma.publication.create({
    data: {
      title: "Blockchain-based Secure Data Sharing for Healthcare Systems",
      publicationType: PublicationType.CONFERENCE_PAPER,
      venueName: "IEEE International Conference on Distributed Computing 2025",
      researchAreaId: raMap["Data Science & Cloud Computing"],
      departmentId: deptMap["CSE"],
      status: PublicationStatus.DRAFT,
      createdById: userSharma.id,

      authors: {
        create: [
          { userId: userSharma.id, authorName: "Dr. S. R. Sharma", authorEmail: "srsharma@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
        ],
      },
    },
  });

  // Pub 7: REJECTED
  const pub7 = await prisma.publication.create({
    data: {
      title: "A Preliminary Survey on Legacy Excel Data Processing Methods",
      publicationType: PublicationType.OTHER,
      venueName: "Internal NIE Workshop",
      departmentId: deptMap["MECH"],
      status: PublicationStatus.REJECTED,
      createdById: userKumar.id,

      authors: {
        create: [
          { userId: userKumar.id, authorName: "Dr. Rajesh Kumar", authorEmail: "rajesh.kumar@nie.ac.in", authorOrder: 1, isInternal: true, isCorresponding: true, authorType: AuthorType.FACULTY },
        ],
      },
      approvals: {
        create: [
          { adminId: adminUser.id, action: ApprovalAction.REJECTED, comment: "Does not meet research publication standard for official tracking.", createdAt: new Date("2025-01-05") },
        ],
      },
    },
  });

  console.log("✅ 7 Test Publications across workflow stages created.");

  // ----------------------------------------------------------------------
  // 7. AUDIT LOGS
  // ----------------------------------------------------------------------
  console.log("📜 Seeding Initial System Audit Logs...");
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: AuditAction.LOGIN, entityType: "User", entityId: adminUser.id, details: { message: "Admin initial system setup login" }, ipAddress: "127.0.0.1" },
      { userId: userSharma.id, action: AuditAction.PUBLICATION_CREATE, entityType: "Publication", entityId: pub1.id, details: { title: pub1.title }, ipAddress: "10.0.1.45" },
      { userId: adminUser.id, action: AuditAction.PUBLICATION_APPROVE, entityType: "Publication", entityId: pub1.id, details: { action: "APPROVED", comment: "Q1 IEEE" }, ipAddress: "127.0.0.1" },
      { userId: userKumar.id, action: AuditAction.PUBLICATION_CREATE, entityType: "Publication", entityId: pub2.id, details: { title: pub2.title }, ipAddress: "10.0.2.12" },
      { userId: adminUser.id, action: AuditAction.PUBLICATION_APPROVE, entityType: "Publication", entityId: pub2.id, details: { action: "APPROVED" }, ipAddress: "127.0.0.1" },
    ],
  });

  console.log("✅ Audit Logs seeded.");

  console.log("🎉 SUCCESS: NIE Research Database fully seeded with production-grade data!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
