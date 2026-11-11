# Charte de design front — Syndic Alpha

> **But** : un front de **qualité Dribbble/Pinterest**, avec un point de vue fort. Ce document est **contraignant** : toute UI doit le respecter. Objectif inverse absolu = « template SaaS généré par IA ».

## 0. Definition of Done — à appliquer D'OFFICE sur chaque écran (sans qu'on le demande)

> Consolidé à partir des retours de l'utilisateur. Un dev UX senior **anticipe** tout ceci. Ne jamais livrer un écran sans l'avoir vérifié.

**Composition / visuel**
- [ ] **Pleine largeur**, jamais de contenu enfermé dans une colonne centrée `max-w-* mx-auto` (= look IA). Utiliser l'espace, composition **asymétrique** (contenu + rail).
- [ ] Widgets **riches, pas « tout blanc »** : tuiles teintées, tuile héro pleine, chips d'icônes colorés, badges/tendances, accents. De la couleur et de la hiérarchie.
- [ ] Aucun des **12 interdits** (§1) : pas de split violet, pas de logo-icône, pas de « tout centré », etc.
- [ ] Lisible en **clair ET sombre**.

**Affordances UX (réflexes senior, §3bis)**
- [ ] Champs mot de passe → **œil afficher/masquer** ; connexion → **mot de passe oublié** + **se souvenir de moi**.
- [ ] États **chargement / vide / erreur / succès** soignés. Jamais de **bouton mort** (feature sans backend → message honnête « bientôt »).
- [ ] **Confirmations** pour actions destructives/irréversibles.
- [ ] Navbar complète : **langue · thème (clair/sombre/système) · notifications · profil**. Sidebar : **repliable + filtre + menu utilisateur**.
- [ ] Accessibilité : labels, `aria-label` sur boutons icône, focus visible, contrastes AA, clavier.

**Positionnement produit (marché NON restreint)**
- [ ] **Ne jamais restreindre le marché** : pas de « Afrique de l'Ouest », pas de **« franc » / « FCFA »** codés en dur. Le produit est **international, multi-pays, multi-devises** (devise par copropriété). Copie neutre, montants via `formatMontant(montant, devise)`.

**Qualité FR**
- [ ] Orthographe française correcte (accents), formats `fr-FR`.

### Patron OBLIGATOIRE des interfaces de liste (toutes les listes)
Ordre imposé, de haut en bas :
1. **Fil d'Ariane** (`PageHeader`) → titre → sous-titre + action principale à droite.
2. **Widgets** (tuiles KPI) — synthèse en haut.
3. **Filtre avancé** : recherche + filtres (statut, etc.) + **bascule de vue**.
4. **Vue TABLE par défaut** (colonnes + lignes) ; **+ vue cartes** en option.
5. **Cartes riches** (beaucoup d'infos : mini-stats, badges, méta).
6. **Actions par ligne/carte en icônes** : **Voir · Modifier · Supprimer/Archiver**, chacune avec **Tooltip**, action destructive → **confirm()**.

### Formulaires
- **La plupart des formulaires = PAGES** dédiées (création/édition), pas des modals. Modal réservé aux formulaires **simples** (1-3 champs).
- Chaque **suppression / enregistrement / modification / validation** → **popup `confirm()` customisé** indiquant l'**impact** + l'**étape suivante**.

### Tooltips & onboarding
- **Aucun bouton sans tooltip** (surtout les boutons icône) — composant `Tooltip`.
- **Widgets** : tooltip explicatif de ce qu'ils montrent.
- **Helpers d'onboarding** : checklist « pour bien démarrer », états vides pédagogiques, info-bulles contextuelles.

> Primitives dispo : `PageHeader`, `StatTile`, `Tooltip`, `useConfirm()`/`ConfirmProvider`, `Button asChild`. Réutiliser, ne pas réinventer.

---

---

## 1. Les 12 interdits (anti-générique) — NON négociables

Ces tics trahissent le design « IA par défaut ». **Interdits :**

1. ❌ **Login split 50/50** panneau dégradé à gauche + formulaire centré à droite.
2. ❌ **Violet/indigo par défaut** comme couleur de marque (c'est LA couleur des templates).
3. ❌ **Logo = icône de librairie** (lucide building/box…). Il faut un **wordmark** dessiné.
4. ❌ **Dégradé linéaire plat** en fond de héros, sans intention ni texture.
5. ❌ **Même border-radius partout** (tout en `rounded-lg`). La courbure doit être un choix.
6. ❌ **Inputs bordés arrondis génériques** + **glow bleu/violet** au focus.
7. ❌ **Toggle pilule gris** pour les onglets. Préférer indicateur souligné / texte.
8. ❌ **Tout centré**, espacements uniformes, zéro tension de composition.
9. ❌ Typo **Inter/Geist seule**, sans face d'affichage de caractère (pas de hiérarchie typographique forte).
10. ❌ Copie **cliché** : « Welcome back », « Bon retour », emojis de titres.
11. ❌ **Cartes blanches posées sur gris** partout, ombres molles identiques, aucune profondeur réelle.
12. ❌ Palette **sans neutre chaud** : gris froids Tailwind par défaut (`slate`/`zinc`) sans caractère.

---

## 2. Les principes (ce qu'on vise à la place)

1. **Un parti pris assumé** : un concept directeur (section 3) qui se sent sur chaque écran.
2. **Typographie à caractère** : une **face d'affichage** distinctive (titres, wordmark) + une grotesque nette pour l'UI. La typo fait 50 % de la personnalité.
3. **Palette signature + neutres chauds** : une couleur de marque **non violette**, des neutres chauds (ivoire/os, encre), un accent précis. Couleurs sémantiques intégrées à l'identité.
4. **Composition éditoriale** : asymétrie, grille, filets fins, tension, vide intentionnel — pas « tout centré ».
5. **Texture & profondeur** : grain subtil, filets (hairlines), ombres étagées crédibles, verre/calques avec intention.
6. **Détails sur-mesure** : états de focus propres à la marque, iconographie cohérente, micro-interactions (Framer Motion) discrètes et utiles.
7. **Densité maîtrisée** : un logiciel de compta montre BEAUCOUP de chiffres → hiérarchie claire, chiffres tabulaires, jamais le fouillis.
8. **Ancrage domaine** : syndic + finance + Afrique de l'Ouest → chaleur, rigueur, architecture. Pas un SaaS hors-sol.

---

## 3. Direction artistique — ✅ RETENUE : « CRM clair · vert »

> Choisie par l'utilisateur (référence d'ambiance : un CRM clair à accents verts, type « Amanah CRM »). Appliquée dans le Design System (`apps/web`).

- **Ambiance** : **clair, aéré, professionnel, data-riche**. Fond blanc cassé légèrement verdâtre, cartes blanches, bordures fines, ombres subtiles. **Pas sombre, pas papier/éditorial.**
- **Couleur de marque = VERT profond** (émeraude) — `--primary: 156 64% 24%` (clair), `154 52% 46%` (sombre). Jamais de violet.
- **Sémantique** : succès vert, alerte ambre, danger brique, info bleu (barres de catégories). Chiffres en `tabular-nums` (classe `.nums`).
- **Typo** : **Hanken Grotesk** (auto-hébergée via `@fontsource-variable`, Google Fonts étant bloqué ici). Grotesque nette, un peu chaleureuse. Gros chiffres proéminents.
- **Logo** : lockup = badge vert arrondi à monogramme « S » + « Syndic Alpha » + sous-titre (composant `Wordmark`).
- **Layout** : shell classique = **sidebar** blanche à sections groupées (Vue d'ensemble / Patrimoine / Finances) + **topbar** (recherche, thème, notifications, avatar) + contenu avec fil d'Ariane, titre, **tuiles KPI**, cartes data-riches (badges de statut à point, barres de progression, mini-stats).
- **Formes** : radius moyen (~0.7rem cartes), boutons `rounded-lg`, badges pilule, dark mode complet.

> Patrons de data-richesse à réutiliser (inspiration référence) : tuile KPI (icône + gros chiffre + tendance), carte entité (en-tête + barre de progression + grille de mini-stats + badge statut + action), sparkline, badges à point coloré.

---

## 3bis. Exigences UX — « réflexes de dev senior » (contraignant)

> Ne jamais livrer un écran « nu ». Ces affordances sont attendues **d'office**, sans qu'on les demande.

**Formulaires d'authentification :**
- Champ mot de passe → **bouton afficher/masquer** (œil), `autocomplete` correct.
- Connexion → **« Mot de passe oublié ? »** + **« Se souvenir de moi »** (persistant vs session).
- **Bascule Connexion ⇄ Inscription** claire (lien de pied).
- Auth sociale si pertinente pour le domaine (**Google** oui, GitHub non pour un syndic) + séparateur « Ou ». Si pas de backend → message honnête « bientôt », jamais un bouton mort.
- Aide sous les champs (règles de mot de passe), validation native + bannière d'erreur serveur.

**Tout écran / formulaire :**
- États explicites : **chargement** (spinner + disabled), **vide** (empty state soigné + CTA), **erreur** (message clair), **succès**.
- Boutons : état disabled pendant l'action, `type` correct, pas de double-submit.
- Confirmations pour actions destructives/irréversibles (valider un appel, annuler un paiement…).
- Accessibilité : labels liés, `aria-label` sur les boutons icône, focus visible, contrastes AA, navigation clavier.
- Montants en `tabular-nums`, dates et nombres formatés (fr-FR), FCFA sans décimale.
- Responsive (le panneau marque se masque en mobile), jamais de scroll horizontal.
- Feedback après action (toast/inline), listes paginées/triables quand volumineuses.

## 4. Stack design (rappel)

Tailwind + tokens CSS (HSL/variables) · composants maison · **next/font** pour les faces choisies (self-host si besoin) · Framer Motion pour la motion. Dark mode obligatoire. Accessibilité (contrastes AA).

---

## 5. Checklist avant de livrer un écran

- [ ] Aucun des 12 interdits présent.
- [ ] Wordmark (pas une icône seule).
- [ ] Au moins une face d'affichage de caractère utilisée.
- [ ] Palette signature (non violette) + neutres chauds.
- [ ] Composition non triviale (pas tout centré).
- [ ] Focus/hover/motion sur-mesure.
- [ ] Lisible en clair ET sombre.
