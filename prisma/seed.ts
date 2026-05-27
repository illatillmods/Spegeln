import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  AlertSeverity,
  AppealAutomationStatus,
  AppealArtifactKind,
  AuthorityCategory,
  ComplaintStatus,
  IntakeLifecycleStatus,
  ModerationDecision,
  PrismaClient,
  ReportStatus,
  Role,
  SeverityLevel,
  SourceKind,
  TrustVoteDirection,
  WikiPageStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("SpegelnDemo2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@spegeln.se" },
    update: {},
    create: {
      email: "admin@spegeln.se",
      passwordHash: adminPassword,
      name: "Spegeln Admin",
      publicAlias: "spegeln_ops",
      role: Role.ADMIN,
      preferredLanguage: "sv",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@spegeln.se" },
    update: {},
    create: {
      email: "analyst@spegeln.se",
      passwordHash: adminPassword,
      name: "Demo Analytiker",
      publicAlias: "signal_jakten",
      role: Role.ANALYST,
      preferredLanguage: "sv",
    },
  });

  const sources = await Promise.all([
    prisma.monitoringSource.upsert({
      where: { id: "seed-source-foi" },
      update: {},
      create: {
        id: "seed-source-foi",
        name: "Allmänna handlingar",
        sourceKind: SourceKind.FOI_RESPONSE,
        baseUrl: "https://www.imy.se/",
        description: "Diarier och svar på begäran om allmän handling.",
        legalBasisNote: "2 kap. tryckfrihetsförordningen",
      },
    }),
    prisma.monitoringSource.upsert({
      where: { id: "seed-source-court" },
      update: {},
      create: {
        id: "seed-source-court",
        name: "Domstolsregister",
        sourceKind: SourceKind.COURT_RECORD,
        baseUrl: "https://rattsinfosok.domstol.se/",
        description: "Offentliga domar och beslut.",
        legalBasisNote: "Offentlighetsprincipen",
      },
    }),
    prisma.monitoringSource.upsert({
      where: { id: "seed-source-procurement" },
      update: {},
      create: {
        id: "seed-source-procurement",
        name: "Upphandlingsregister",
        sourceKind: SourceKind.PROCUREMENT,
        baseUrl: "https://www.upphandlingsmyndigheten.se/",
        description: "Offentliga upphandlingar och avtal.",
      },
    }),
  ]);

  const authorities = await Promise.all([
    prisma.authority.upsert({
      where: { slug: "polismyndigheten" },
      update: {},
      create: {
        name: "Polismyndigheten",
        slug: "polismyndigheten",
        level: "Riksmyndighet",
        region: "Nationell",
        regionCode: "SE",
        category: AuthorityCategory.POLICE,
        summary: "Riksmyndighet med fokus på ingripanden, diarier och tillsynsärenden.",
        sources: { connect: sources.map((source) => ({ id: source.id })) },
      },
    }),
    prisma.authority.upsert({
      where: { slug: "skatteverket" },
      update: {},
      create: {
        name: "Skatteverket",
        slug: "skatteverket",
        level: "Riksmyndighet",
        region: "Nationell",
        regionCode: "SE",
        category: AuthorityCategory.AGENCY,
        summary: "Skattemyndighet med högt tryck kring beslut, omprövningar och register.",
        sources: { connect: [{ id: sources[0].id }, { id: sources[2].id }] },
      },
    }),
    prisma.authority.upsert({
      where: { slug: "stockholm-stad" },
      update: {},
      create: {
        name: "Stockholms stad",
        slug: "stockholm-stad",
        level: "Kommun",
        region: "Stockholm",
        regionCode: "SE-AB",
        category: AuthorityCategory.MUNICIPALITY,
        summary: "Kommun med omfattande diarier, klagomål och upphandlingsflöden.",
        sources: { connect: [{ id: sources[0].id }, { id: sources[2].id }] },
      },
    }),
    prisma.authority.upsert({
      where: { slug: "integritetsskyddsmyndigheten" },
      update: {},
      create: {
        name: "Integritetsskyddsmyndigheten",
        slug: "integritetsskyddsmyndigheten",
        level: "Riksmyndighet",
        region: "Nationell",
        category: AuthorityCategory.REGULATOR,
        summary: "Tillsynsmyndighet för dataskydd och registerärenden.",
        sources: { connect: [{ id: sources[0].id }] },
      },
    }),
    prisma.authority.upsert({
      where: { slug: "justitieombudsmannen" },
      update: {},
      create: {
        name: "Justitieombudsmannen",
        slug: "justitieombudsmannen",
        level: "Riksmyndighet",
        region: "Nationell",
        category: AuthorityCategory.OTHER,
        summary: "JO granskar myndighetsutövning och tar emot anmälningar.",
        sources: { connect: [{ id: sources[0].id }, { id: sources[1].id }] },
      },
    }),
  ]);

  const officials = await Promise.all(
    [
      ["Anna Lindqvist", "Polisintendent", authorities[0].id],
      ["Erik Holm", "Skattejurist", authorities[1].id],
      ["Maria Svensson", "Kommundirektör", authorities[2].id],
      ["Jonas Berg", "Biträdande dataskyddsinspektör", authorities[3].id],
      ["Sara Nyström", "JO-handläggare", authorities[4].id],
      ["Olof Ek", "Polisassistent", authorities[0].id],
      ["Helena Ruus", "Upphandlingschef", authorities[2].id],
      ["Niklas Åkerman", "Skattehandläggare", authorities[1].id],
      ["Fatima Noor", "Enhetschef", authorities[3].id],
      ["Per Dahl", "Utredare", authorities[4].id],
    ].map(([fullName, title, authorityId], index) =>
      prisma.official.upsert({
        where: { id: `seed-official-${index + 1}` },
        update: {},
        create: {
          id: `seed-official-${index + 1}`,
          fullName: fullName as string,
          title: title as string,
          authorityId: authorityId as string,
          riskNote: `${fullName} har flera registrerade signaler i demo-datasetet.`,
        },
      }),
    ),
  );

  for (const [authority, severity, title] of [
    [authorities[0], AlertSeverity.HIGH, "Fördröjt diarieutdrag"],
    [authorities[1], AlertSeverity.MEDIUM, "Lång handläggningstid i omprövning"],
    [authorities[2], AlertSeverity.CRITICAL, "Upprepade klagomål om tjänsteutövning"],
  ] as const) {
    await prisma.alert.create({
      data: {
        authorityId: authority.id,
        severity,
        title,
        summary: `Demo-alert kopplad till ${authority.name}.`,
      },
    });
  }

  for (const [authority, official, title, summary] of [
    [authorities[0], officials[0], "Fördröjt svar på registerutdrag", "Handläggningen har dragit ut utan tydligt besked."],
    [authorities[2], officials[2], "Felaktig handläggning av bygglov", "Beslutet verkar strida mot kommunens egna riktlinjer."],
    [authorities[1], officials[1], "Otydlig beskattning av förmån", "Skattebeslutet saknar tillräcklig motivering."],
  ] as const) {
    await prisma.complaint.create({
      data: {
        authorityId: authority.id,
        officialId: official.id,
        title,
        summary,
        status: ComplaintStatus.SUBMITTED,
      },
    });
  }

  await Promise.all([
    prisma.report.create({
      data: {
        title: "Mönster i försenade diarieutdrag",
        slug: "monster-forsenade-diarieutdrag",
        summary: "Flera myndigheter svarar långsamt på begäran om allmän handling.",
        bodyMarkdown: "## Bakgrund\nDemo-rapport för att visa publiceringsflödet.",
        status: ReportStatus.PUBLISHED,
        authorityId: authorities[0].id,
        authorId: analyst.id,
        publishedAt: new Date(),
      },
    }),
    prisma.report.create({
      data: {
        title: "Kommunalt klagomålsmönster",
        slug: "kommunalt-klagomalmonster",
        summary: "Ökande antal klagomål kopplade till tjänsteutövning.",
        status: ReportStatus.LEGAL_REVIEW,
        authorityId: authorities[2].id,
        authorId: analyst.id,
      },
    }),
  ]);

  await prisma.authorityFailureReport.createMany({
    data: [
      {
        authorityId: authorities[0].id,
        officialId: officials[0].id,
        title: "Polisingripande utan tydlig diarieföring",
        summary: "Flera vittnesmål pekar på bristande dokumentation efter ingripande.",
        anonymousAlias: "Signal 17",
        lifecycleStatus: IntakeLifecycleStatus.PUBLISHED,
        aiSeverity: SeverityLevel.HIGH,
        aiPriorityScore: 82,
        aiSummary: "AI-triage: hög prioritet p.g.a. upprepade klagomål och video.",
        moderationDecision: ModerationDecision.APPROVED,
        legalReviewDecision: ModerationDecision.APPROVED,
        publishedAt: new Date(),
      },
      {
        authorityId: authorities[2].id,
        title: "Kommunen nekar registerutdrag i bulk",
        summary: "Registrator hänvisar till generella mallar utan saklig prövning.",
        anonymousAlias: "DiarieJakten",
        lifecycleStatus: IntakeLifecycleStatus.LEGAL_REVIEW,
        aiSeverity: SeverityLevel.MEDIUM,
        aiPriorityScore: 64,
        aiSummary: "AI-triage: medelhög prioritet, tydligt mönster i svar.",
      },
    ],
  });

  await prisma.reverseSurveillanceSubmission.create({
    data: {
      authorityId: authorities[0].id,
      officialId: officials[5].id,
      title: "Motbild från ingripande i tunnelbanan",
      summary: "Video visar avvikelse mellan polisens händelserapport och publikt material.",
      anonymousAlias: "Tunnelvittne",
      lifecycleStatus: IntakeLifecycleStatus.LEGAL_REVIEW,
      redactionPolicy: "mask-bystanders",
      sharePack: {
        riskSummary: "Kräver manuell verifiering innan delning.",
        socialCaption: "Nytt videospår i granskningskön.",
      },
    },
  });

  await prisma.officialConfidenceVote.createMany({
    data: [
      { authorityId: authorities[0].id, officialId: officials[0].id, direction: TrustVoteDirection.DOWN },
      { authorityId: authorities[2].id, officialId: officials[2].id, direction: TrustVoteDirection.DOWN },
      { authorityId: authorities[1].id, direction: TrustVoteDirection.UP },
    ],
  });

  await prisma.confidenceTestimonial.create({
    data: {
      authorityId: authorities[0].id,
      officialId: officials[0].id,
      headline: "Långsam återkoppling",
      body: "Flera månaders väntan på svar trots tydligt diarienummer.",
      moderationDecision: ModerationDecision.APPROVED,
    },
  });

  const wikiPage = await prisma.loopholeWikiPage.upsert({
    where: { slug: "langsam-registerutdrag" },
    update: {},
    create: {
      slug: "langsam-registerutdrag",
      title: "Begäran om registerutdrag i bulk",
      summary: "Hur du begär ut handlingar från flera myndigheter samtidigt.",
      category: "Byråkrati",
      tags: ["register", "foi", "batch"],
      status: WikiPageStatus.PUBLISHED,
      revisions: {
        create: {
          revisionNumber: 1,
          title: "Begäran om registerutdrag i bulk",
          bodyMarkdown:
            "## Steg 1\nIdentifiera registratorer.\n\n## Steg 2\nSkicka identiska begäran med tydliga diarienummer.\n\n## Steg 3\nFölj upp med JO om svaret uteblir.",
          moderationDecision: ModerationDecision.APPROVED,
          authorUserId: analyst.id,
        },
      },
      votes: {
        create: { value: 12, userId: analyst.id },
      },
    },
  });

  await prisma.loopholeWikiPage.upsert({
    where: { slug: "gdpr-mot-myndighet" },
    update: {},
    create: {
      slug: "gdpr-mot-myndighet",
      title: "GDPR-begäran mot myndighet",
      summary: "Mall och taktik för registerutdrag enligt dataskyddsregler.",
      category: "Integritet",
      tags: ["gdpr", "imy"],
      status: WikiPageStatus.PUBLISHED,
      revisions: {
        create: {
          revisionNumber: 1,
          title: "GDPR-begäran mot myndighet",
          bodyMarkdown: "Använd tydlig identitet, specificera behandling och begär svar inom lagstadgad tid.",
          moderationDecision: ModerationDecision.APPROVED,
          authorUserId: admin.id,
        },
      },
    },
  });

  const now = new Date();
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const authority of authorities) {
    await prisma.authorityScorecard.create({
      data: {
        authorityId: authority.id,
        windowStart,
        windowEnd: now,
        methodologyVersion: "watchdog-v1",
        transparencyScore: 40 + Math.floor(Math.random() * 40),
        responseTimeScore: 35 + Math.floor(Math.random() * 45),
        complaintsScore: 30 + Math.floor(Math.random() * 50),
        resolutionScore: 25 + Math.floor(Math.random() * 55),
        overallScore: 35 + Math.floor(Math.random() * 45),
        explanation: {
          inputs: { complaints: 3, reports: 1 },
          formulas: ["overall = weighted(transparency, response, complaints, resolution)"],
          note: "Demo-scorecard genererat av seed.",
        },
      },
    });
  }

  await prisma.automatedAppealJob.create({
    data: {
      userId: analyst.id,
      authorityId: authorities[1].id,
      sourceTitle: "Omprövningsbeslut Skatteverket",
      sourceSummary: "Demo-beslut för att visa AI-överklagandeflödet.",
      parsedDecisionSummary: "Beslutet gäller avslag på omprövning av inkomstdeklaration.",
      aiRiskSummary: "Låg juridisk risk om underlaget stämmer.",
      status: AppealAutomationStatus.DRAFTED,
      generatedArtifacts: {
        create: [
          {
            artifactKind: AppealArtifactKind.APPEAL,
            title: "Överklagande till förvaltningsrätten",
            subjectLine: "Överklagande av omprövningsbeslut",
            body: "Jag överklagar härmed beslutet och begär prövning av samtliga omständigheter.",
          },
        ],
      },
    },
  });

  console.log(`Seed complete. Admin: admin@spegeln.se / SpegelnDemo2026!`);
  console.log(`Wiki demo page: ${wikiPage.slug}`);
  console.log(`Officials: ${officials.length}, Authorities: ${authorities.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
