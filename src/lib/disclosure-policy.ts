export type DisclosureStatus = "Visas" | "Maskas" | "Blockeras";

export type DisclosureBoundary = {
  id: string;
  label: string;
  status: DisclosureStatus;
  reason: string;
};

export const disclosureProfileNotice =
  "Profilen publicerar offentlig information om makthavare — inkomster, roller, relationer och dokumenterade beslut. Privata hemadresser och obekräftade anklagelser blockeras så att trycket träffar rätt.";

export const disclosureIndexNotice =
  "Index och nätverksvyer bygger på samma offentliga källor som övervakningsspegeln. Poängen är att vända kameran mot makten — inte att sprida rykten.";

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
