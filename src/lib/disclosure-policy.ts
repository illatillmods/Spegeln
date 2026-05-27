export type DisclosureStatus = "Visas" | "Maskas" | "Blockeras";

export type DisclosureBoundary = {
  id: string;
  label: string;
  status: DisclosureStatus;
  reason: string;
};

export const disclosureProfileNotice =
  "Profilen visar verifierade uppgifter från offentliga källor och plattformens granskade spår. Privata hemadresser och obekräftade anklagelser publiceras inte.";

export const disclosureIndexNotice =
  "Index och nätverksvyer bygger på samma publiceringsgränser: offentliga roller, dokumenterade kopplingar och godkända källor — inte rykten eller rå tipsfritext.";

export function getDisclosureBoundaries(): DisclosureBoundary[] {
  return [
    {
      id: "official-role",
      label: "Tjänsteroll, myndighetskoppling och offentligt redovisade uppdrag",
      status: "Visas",
      reason:
        "Visas eftersom uppgifterna är nödvändiga för att granska offentlig maktutövning och redan förekommer i öppna register, diarier eller andra officiella handlingar.",
    },
    {
      id: "business-links",
      label: "Bolagsroller, styrelseposter, upphandlingar och verksamhetsadresser",
      status: "Visas",
      reason:
        "Visas när kopplingen finns i offentlig registrering eller offentligt beslut. Syftet är att belysa intressekonflikter och beslutsnära relationer.",
    },
    {
      id: "private-addresses",
      label: "Privata hemadresser och exakt boendeinformation",
      status: "Maskas",
      reason:
        "Kapas bort så att fokus stannar på offentlig roll, verksamhetsadress och beslutsnära spår i stället för privatliv.",
    },
    {
      id: "documented-relationships",
      label: "Dokumenterade relationer och nätverk kopplade till maktutövning",
      status: "Visas",
      reason:
        "Relationer som går att verifiera via offentliga register, diarier, bolagsdata eller publicerade rapporter kan visas när de är relevanta för granskning.",
    },
    {
      id: "sensitive-or-unverified",
      label: "Obekräftade anklagelser, tipsfritext och känsliga uppgifter utan källstöd",
      status: "Blockeras",
      reason:
        "Osäkrad fritext och råa anklagelser stannar utanför tills de går att knyta till verifierade källor. Poängen är att publicera mönster som biter, inte bara brus.",
    },
  ];
}
