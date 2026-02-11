

# 💴 Persoonlijke Financiën App — "BudgetFlow"

Een persoonlijke budgettering- en financiën-app in Japandi-stijl: clean, minimalistisch, zachte kleuraccenten, afgeronde hoeken, geen harde lijnen of kaders. Gedeeld met je partner.

---

## 🔐 Authenticatie & Gebruikers
- Inloggen met e-mail en wachtwoord (Supabase Auth)
- Twee gebruikers (jij en je partner) die dezelfde financiële data delen
- Profielpagina met naam en eventueel avatar

---

## 🏦 Rekeningen
- Overzicht van al je bankrekeningen (meerdere bunq-rekeningen)
- Per rekening het huidige saldo en recente transacties zichtbaar
- Rekeningen handmatig toevoegen/beheren (naam, alias, rekeningnummer)

---

## 💳 Transacties
- Transacties komen binnen via Zapier → Supabase met de velden: bedrag, datum, omschrijving, tegenrekening IBAN, rekeningnummer, alias tegenrekening
- **Transactielijst** met zoeken, sorteren en filteren op:
  - Rekening
  - Categorie (incl. "zonder categorie")
  - Periode (maand, kwartaal, jaar, custom)
  - Bedrag (inkomsten/uitgaven)
- Per transactie: categorie toewijzen, notitie toevoegen
- Bulk-acties: meerdere transacties tegelijk een categorie geven

---

## 🏷️ Categorieën & Subcategorieën
- Categorieën aanmaken met naam, kleur en icoon
- Subcategorieën onder een hoofdcategorie
- Overzichtspagina om categorieën te beheren (toevoegen, bewerken, verwijderen)
- Categorieën voor zowel inkomsten als uitgaven

---

## 📊 Budgetten
- Maandelijkse of jaarlijkse budgetten aanmaken
- Budgetten voor inkomsten én uitgaven
- Per budget specifieke categorieën aanvinken die erbij horen
- **Roll-over functionaliteit**: ongebruikt budget schuift door naar de volgende periode
- Voortgangsbalk per budget (besteed vs. beschikbaar)
- Overzichtspagina met alle budgetten en hun status

---

## 📈 Dashboard
- Aanpasbaar dashboard met diverse widgets:
  - **Staafdiagrammen** (uitgaven per categorie, per maand)
  - **Lijngrafieken** (inkomsten vs. uitgaven over tijd)
  - **Taartdiagrammen** (verdeling uitgaven per categorie)
  - **Tabellen** (top uitgaven, budget overzicht)
  - **KPI-kaarten** (totaal inkomsten, totaal uitgaven, netto, spaarbedrag)
- Filters op het dashboard: periode, categorie, rekening
- Vergelijking: budget vs. werkelijke uitgaven

---

## 🗄️ Database (Supabase)
- Nieuw Supabase project verbinden
- Tabellen: accounts (rekeningen), transactions, categories, subcategories, budgets, budget_categories, transaction_notes
- Row Level Security zodat beide partners dezelfde data zien
- Zapier webhook ontvangt bunq transacties en schrijft naar de transactions-tabel

---

## 🎨 Design & Stijl
- **Japandi-stijl**: warm, minimalistisch, organisch
- Zachte neutrale achtergrondkleuren (warm wit, beige tinten)
- Zachte kleuraccenten voor categorieën en grafieken
- Afgeronde hoeken, geen harde borders of kaders
- Subtiele schaduwen in plaats van lijnen
- Clean typografie met veel witruimte
- Sidebar-navigatie, rustig en overzichtelijk

---

## 📱 Navigatie
- Zijbalk met: Dashboard, Transacties, Budgetten, Categorieën, Rekeningen, Instellingen
- Responsive design voor desktop (primair) en tablet

