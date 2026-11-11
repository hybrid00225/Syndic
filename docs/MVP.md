# MVP — ZenAPI (Première version livrable)

> Objectif du MVP : **un syndic peut gérer son patrimoine, appeler les fonds et encaisser les paiements**, avec un suivi des impayés. C'est le cycle qui crée de la valeur dès le jour 1.
> Tout ce qui n'est pas listé « DANS LE MVP » est **explicitement reporté** (anti-dérive du périmètre).

Dernière mise à jour : 2026-11-11.

---

## 🎯 Persona & scénario cible

Un **gestionnaire de copropriété** se connecte, crée une copropriété avec ses lots, enregistre les copropriétaires et leurs quotes-parts, définit les tantièmes, **génère un appel de fonds trimestriel** (PDF par copropriétaire), puis **enregistre les paiements** reçus (y compris Mobile Money) et **suit qui n'a pas payé**.

---

## ✅ DANS LE MVP

### Socle (Vague 0)
- Authentification + sessions sécurisées.
- RBAC minimal : rôles `Admin syndic`, `Gestionnaire`, `Comptable/Caissier`.
- Multi-tenant : `syndic_id` + scoping copropriété, **isolation par RLS**.
- Journal d'audit *append-only* (traçabilité de toute opération sensible).
- Design System de base + 1er écrans soignés (qualité Dribbble/Pinterest).

### 1. Patrimoine
- CRUD **Copropriétés** → **Bâtiments** → **Niveaux** → **Lots**.
- Lot : désignation (appartement, parking, cave…), superficie, statut (occupé, vacant, loué…).

### 2. Copropriétaires & propriété
- CRUD **Copropriétaires** (personne physique **et** morale).
- **Détention de propriété M:N** : un copropriétaire ↔ plusieurs lots, un lot ↔ plusieurs copropriétaires, avec `quote_part`, `nature_droit`, `date_debut`, `date_fin`. **Jamais de lien 1:1.**

### 3. Clés de répartition & tantièmes
- Définition de **clés de répartition** (charges générales, ascenseur, eau…).
- Tantièmes par lot et par clé, **versionnés par période**.

### 4. Appels de fonds
- Génération (ordinaire, périodique ou ponctuel), **calcul de la contribution par lot via les tantièmes**.
- Numéro unique, statuts (émis / partiellement payé / payé / impayé / annulé).
- **Document consolidé par copropriétaire** (plusieurs lots → un relevé) + **PDF**.
- Un appel validé n'est plus modifiable → correction par annulation/avoir.

### 5. Encaissements & paiements
- Enregistrement d'un paiement (espèces, virement, **Mobile Money**, chèque).
- **Affectation distincte** du paiement aux appels/dettes (paiement ≠ affectation).
- Paiement partiel, trop-perçu (avance/crédit), paiement groupé multi-lots.
- **Idempotence** sur confirmations Mobile Money (anti double-comptage).
- **Reçu PDF** généré après validation.

### 6. Impayés (suivi)
- Solde par copropriétaire/lot, **jours de retard**, liste des impayés.
- Relance **manuelle** (génération d'un courrier/email de relance).

---

## ❌ HORS MVP (reporté aux vagues suivantes)

- Comptabilité OHADA complète (journaux, grand livre, balance, partie double).
- Assemblées générales & votes · Conseil syndical.
- GMAO / maintenance · Équipements · Sinistres & assurances.
- Factures fournisseurs · Trésorerie/rapprochement bancaire · Clôtures d'exercice.
- Mutations complexes de propriété · Revenus locatifs.
- Portail copropriétaire en self-service · App mobile Expo.
- Notifications SMS/WhatsApp · Relances automatiques · Gestion documentaire avancée.
- CRM commercial · Offres & abonnements · Multi-pays avancé.

> Le modèle de données, lui, est conçu **dès le départ** pour accueillir ces modules (M:N, versions, audit) — on ne se bloque pas pour plus tard.

---

## 🔒 Règles d'acceptation (invariants non négociables)

Ces règles doivent être **couvertes par des tests automatiques** :

1. Un utilisateur d'une copropriété ne peut **jamais** lire les données d'une autre (RLS).
2. Tous les montants sont en `NUMERIC`/centimes — **aucun flottant**.
3. La propriété est **M:N** avec quote-part/nature/dates — pas de lien direct 1:1.
4. Un calcul de répartition utilise **la version de tantièmes de la période** concernée.
5. Un appel de fonds **validé** ne peut pas être modifié silencieusement.
6. **Paiement ≠ affectation** : deux opérations distinctes et traçables.
7. Une confirmation Mobile Money reçue 2× ne crée **qu'un seul** encaissement (idempotence).
8. Toute opération sensible laisse une trace d'audit (auteur, avant/après, horodatage).

---

## 🏁 Definition of Done (MVP)

- [ ] Un gestionnaire peut créer une copro complète (bâtiments → lots).
- [ ] Il peut enregistrer copropriétaires + quotes-parts + tantièmes.
- [ ] Il peut générer un appel de fonds et télécharger le PDF par copropriétaire.
- [ ] Il peut enregistrer des paiements et éditer les reçus.
- [ ] Il voit la liste des impayés avec jours de retard.
- [ ] Les 8 règles d'acceptation sont couvertes par des tests verts.
- [ ] Les écrans respectent le Design System (qualité visuelle validée).
