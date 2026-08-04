# Jagdzeiten-Daten

Verifiziert am **01.08.2026** gegen die offiziellen Landes- und Bundesquellen.
Bei Konflikten zwischen schonzeiten.de und der offiziellen Rechtsgrundlage gilt die offizielle Quelle.

## Schema

Jede Datei enthält 26 Einträge mit identischen `k`-Slugs in gleicher Reihenfolge:

- `k` – Slug (identisch zu `nrw.json`)
- `n` / `sub` – Name / Untertitel
- `ic` – Silhouetten-Icon
- `grp` – Kategorie
- `win` – Jagdzeitfenster `[StartMonat, StartTag, EndMonat, EndTag]` (1-basiert); `[]` = ganzjährig geschont
- `src` – Rechtsgrundlage
- `cond` – nur bedingt bejagbar (führende Bachen etc.)
- `hint` / `note` – Hinweis / Anmerkung
- `deck` – im Standard-Deck vorbelegt

## Quellen je Bundesland

| Datei | Rechtsgrundlage | Stand |
| --- | --- | --- |
| `nrw.json` | LJZeitVO NRW | § 1 (vorhanden, unverändert) |
| `niedersachsen.json` | DVO-NJagdG § 2/§ 3, sonst JagdzeitV § 1 | § 3 in der derzeit gültigen Fassung |
| `hessen.json` | HJagdV § 2 i. d. F. des GVBl. 2026 Nr. 14 (in Kraft 01.04.2026) | geändert 03.03.2026 |
| `brandenburg.json` | BbgJagdDV § 5 i. d. F. des GVBl. I/26 Nr. 8 (in Kraft 25.03.2026) | geändert 24.03.2026 |
| `berlin.json` | JagdA/ZV BE § 2/§ 3 i. d. F. der Dritten ÄndVO v. 22.08.2025 (GVBl. Nr. 25, in Kraft 06.09.2025) | geändert 22.08.2025 |

Bundesbaseline für Arten ohne landesrechtliche Abweichung: JagdzeitV 1977 § 1 (gesetze-im-internet.de).
Arten mit `win: []` sind im jeweiligen Land ganzjährig geschont.

## Abweichungen schonzeiten.de ↔ offizielle Quelle

- **Brandenburg (Rot-/Dam-/Rehwild):** schonzeiten.de zeigt 31.01. als Jagdzeitende, die offizielle
  BbgJagdDV § 5 Tabelle (GVBl. I/26 Nr. 8) lautet seit 25.03.2026 auf **15.01.** Wir verwenden 15.01.
- **Brandenburg (Rot-/Dam-/Rehwild Fenster):** schonzeiten.de zeigt für Schmalspießer, Schmaltier,
  Rehbock und Schmalreh noch das alte Zwei-Fenster-Format (z. B. 16.04.–31.05. + 01.08.–31.01.).
  Die offizielle Neufassung von § 5 Abs. 2 (GVBl. I/26 Nr. 8) setzt ein einziges durchlaufendes Fenster
  (16.04.–15.01.) ohne Juni/Juli-Schonzeit. Wir verwenden das offizielle Einzelfenster.
- **Brandenburg (Fuchs):** schonzeiten.de zeigt Altfuchs 01.07.–31.01. (Stand DVO 01.06.2024).
  GVBl. I/26 Nr. 8 streicht den Fuchs aus der § 5-Tabelle; mangels separater Schonzeitaufhebung
  gilt der Bundesstandard **16.07.–28.02.** (JagdzeitV § 1 Nr. 6). Jungfüchse bleiben ganzjährig
  (§ 22 (4) BJG i.V.m. BbgJagdDV).
- **Berlin (Rehwild):** schonzeiten.de zeigt noch die Bundesjagdzeiten (Bock 01.05.–15.10.),
  seit der Dritten ÄndVO 2025 gilt aber **Bock/Schmalreh 01.04.–31.05. + 01.08.–31.01.**,
  Ricken/Kitze 01.09.–31.01. Wir verwenden die neue Fassung.
- **Berlin (Waschbär):** schonzeiten.de zeigt 01.10.–31.01., seit 22.08.2025 gilt **ganzjährig**.
  Mink/Marderhund bleiben dagegen bei 01.10.–31.01. (keine 26er-Kategorien).
- **Berlin (Dachs):** schonzeiten.de zeigt 01.08.–31.10., offiziell ist der Dachs gemäß
  § 3 JagdA/ZV BE **ganzjährig geschont**. Wir führen `win: []`.
- **Hessen (Dachs/Fuchs/Waschbär/Stockente):** schonzeiten.de zeigt Stand vor 2026; GVBl. 2026 Nr. 14
  verlängert Dachs auf 31.12., Jungdachs auf 01.06.–31.12., Fuchs und Waschbär auf ganzjährig.
- **Hessen (Damhirsch/Damwild-Alttier):** schonzeiten.de zeigt korrekt 01.08.–31.01. (HJagdV § 2 Abs. 2),
  abweichend vom Bundesstandard 01.09.–31.01. (JagdzeitV § 1 Nr. 2). Wir verwenden die HJagdV-Fassung.
- **Niedersachsen (Damwild-Alttier / Rotwild-Kälber):** Windows weichen je nach Quellenversion um
  01.08. vs. 01.09. ab; verwendet wird die DVO-NJagdG § 3 Fassung mit der längeren Jagdzeit.

## Offline-Fallback

Wo die offizielle Rechtsgrundlage tatsächlich unklar ist, gilt im UI-Hinweis:
„UNVERIFIED — gegen die jeweilige LJagdzeitVO prüfen." (aktuell für keine der 26 Kategorien erforderlich)
