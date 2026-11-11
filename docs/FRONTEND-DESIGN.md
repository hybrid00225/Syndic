# Charte de design front — Syndic Alpha

> **But** : un front de **qualité Dribbble/Pinterest**, avec un point de vue fort. Ce document est **contraignant** : toute UI doit le respecter. Objectif inverse absolu = « template SaaS généré par IA ».
> Statut : 🟨 direction artistique à arrêter avec l'utilisateur (section 3). Les règles 1-2 sont définitives.

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
