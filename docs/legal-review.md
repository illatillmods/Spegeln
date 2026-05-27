# Juridisk granskning — checklista

Denna checklista följer release gates i [launch-plan.md](./launch-plan.md). Den ska genomföras av kvalificerad juridisk rådgivare innan publik lansering.

## Integritet och GDPR

- [ ] Integritetspolicy (`/integritet`) matchar faktisk databehandling
- [ ] Rätt till radering/export (`/integritet`) testad mot backend
- [ ] Samtycken för marknadsföring vs driftmeddelanden är tydligt separerade
- [ ] Anonym rapportering dokumenterar bevarandetid och hashning av fingeravtryck

## Publiceringsgränser (disclosure)

- [ ] `src/lib/disclosure-policy.ts` och UI-copy är synkade
- [ ] Privata hemadresser maskas konsekvent i profil- och sökvyer
- [ ] Familjemedlemmar och privatliv blockeras — inte visas
- [ ] Reverse Surveillance-material kräver legal review före delning

## Betalning och marknadsföring

- [ ] `/prissattning` anger tydligt att kontant ger 50% rabatt och krypto 25%
- [ ] Stripe-checkout och manuella betalningsflöden har korrekt kvittotext
- [ ] Premiumlås (t.ex. skatteplanering) beskriver vad som ingår utan vilseledande löften

## Civic action-moduler

- [ ] Massutskick: avsändaridentitet och spårbarhet dokumenterad
- [ ] Automatiserad överklagare: AI-genererade dokument märks som utkast
- [ ] Folkets domstol: vittnesmål modereras; inga ogrundade anklagelser publiceras

## Public API

- [ ] OpenAPI (`/api/public/openapi`) exponerar endast avsedda fält
- [ ] Rate limits och access tiers dokumenterade i `/api-dokumentation`

## Sign-off

| Område | Granskare | Datum | Status |
|--------|-----------|-------|--------|
| Integritet/GDPR | | | |
| Publicering | | | |
| Betalning | | | |
| Civic moduler | | | |
