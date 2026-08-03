# Droit de rétractation — état d'avancement

> Note interne de suivi (pas une doc publique du site) — à déplacer/supprimer une fois la
> feature mergée des deux côtés. Rédigée le 2026-08-03 en relisant le code réel des deux
> dépôts (`richie` branche `feature/withdraw_cnil`, `joanie` branche `feature/withdrawal_right`)
> et l'historique de la conversation qui a mené à son implémentation.

## Contexte

Le décret n°2026-3 impose que les acheteurs de certificats/credentials puissent exercer
leur droit de rétractation légal (14 jours, article L221-18 du Code de la consommation)
directement depuis l'IHM, sans passer par un formulaire PDF manuel. Issue de référence :
richie#2834. Implémentation backend en cours côté Joanie :
[PR openfun/joanie#1349](https://github.com/openfun/joanie/pull/1349), branche
`feature/withdrawal_right`.

Deux parcours distincts selon le type de produit :
- **Credential** (achat direct d'un programme) : la rétractation annule la commande
  **immédiatement** (`ORDER_STATE_CANCELED`).
- **Certificate** (examen sur un cours déjà suivi gratuitement) : la rétractation passe
  la commande en **`pending_withdraw`**, en attente de confirmation par un administrateur
  via un endpoint admin dédié.

## Ce qui a été fait côté richie (frontend)

Fichiers modifiés/créés sur la branche `feature/withdraw_cnil` :

- **`types/Joanie.ts`** : ajout de `has_waived_withdrawal_right`, `eligible_to_withdraw`,
  `withdrawal_date_limit` sur `Order` (et sur le `Pick` `OrderEnrollment`), et de l'état
  `PENDING_WITHDRAW` dans l'enum `OrderState`.
- **`api/joanie.ts`** : nouvelle route/méthode `orders.withdraw(id)` →
  `POST /orders/:id/withdraw/`, qui renvoie la commande mise à jour (calquée sur
  `cancel`/`submit_for_signature`).
- **`utils/OrderHelper/index.ts`** : `PENDING_WITHDRAW` ajouté à `ACTIVE_ORDER_STATES`
  (pour ne pas faire disparaître le statut "commande active" pendant l'attente de
  confirmation admin) et à `orderStatusMap` (mappé sur `OrderStatus.PENDING` pour rester
  exhaustif vis-à-vis du typage TypeScript).
- **`utils/test/factories/joanie.ts`** : valeurs par défaut ajoutées pour les 3 nouveaux
  champs sur `OrderEnrollmentFactory`/`AbstractOrderFactory` (nécessaire pour que le build
  passe, aucune assertion de test écrite dessus).
- **`OrderWithdrawalModal`** (nouveau composant, modale commune aux deux points d'entrée) :
  - Infos pré-remplies : nom/email (`useSession()`), programme + référence, référence de
    commande.
  - Lien "update your account" adapté au backend d'authentification : Keycloak
    (`AuthenticationApi.account.updateUrl()`) ou OpenEdX
    (`${context.authentication.endpoint}/account/settings`), toujours affiché.
  - Appel direct à `useJoanieApi().user.orders.withdraw(order.id)`, état local
    idle/loading/error (pas de mutation react-query dédiée, pattern calqué sur
    `OrderPaymentRetryModal`).
  - Succès → invalidation de la query `orders` puis modale de succès générique
    (`useModals().messageModal`).
  - Erreur → distinction unique 422 (délai expiré) vs tout le reste (erreur générique
    "contactez le support").
- **`OrganizationBlock/index.tsx`** (page détail de commande, credential) : nouveau bloc
  "Rétractation" (`dashboard-splitted-card__item`), affiché uniquement si
  `!order.has_waived_withdrawal_right && order.eligible_to_withdraw`.
- **`ProductCertificateFooter/index.tsx`** (page `/dashboard/courses`, certificate) :
  - Ligne avec icône argent (`IconTypeEnum.MONEY`) + description + bouton, même
    condition d'affichage que ci-dessus.
  - Statut `pending_withdraw` explicitement géré dans `OrderCertificateStatus` : icône
    horloge + message "Your withdrawal request has been recorded and is being processed."
  - Correctif de mise en page : la ligne rétractation passe désormais sur sa propre ligne
    (`flex-wrap: wrap` + conteneur `flex-basis: 100%`) au lieu de s'afficher collée au
    statut de certification.
- **`DashboardItem/_styles.scss`** et **`scss/components/_index.scss`** : styles associés
  (typographie de la modale, wrapping de la ligne rétractation).

## Ce qui a été fait côté joanie (backend)

### Déjà committé/pushé sur `origin/feature/withdrawal_right`

- Propriétés `Order.eligible_to_withdraw` / `Order.withdrawal_date_limit` (modèle,
  `products.py`), calculées à partir des dates de cours (16 jours par défaut,
  `JOANIE_WITHDRAWAL_PERIOD_DAYS`), exposées en lecture sur le serializer **client**.
- Endpoint client `POST /api/v1.0/orders/{id}/withdraw/` : pas de body, renvoie la
  commande sérialisée (200), erreurs 422 explicites (délai dépassé, échéance atteinte,
  pas de payment schedule).
- Nouvel état `pending_withdraw` dans `OrderFlow` (transition
  `COMPLETED → PENDING_WITHDRAW` pour les certificates uniquement, condition
  `eligible_to_withdraw`).
- Endpoint admin `POST /admin/orders/{id}/confirm_withdrawal/` (ébauche).
- Vues de debug + templates mjml pour les mails `withdrawal_request`/
  `withdrawal_confirmation` (ébauche, marquée WIP dans les premiers commits).
- Colonnes CSV export admin pour les dates de rétractation (stub `# WIP` au départ).
- Tests API sur l'endpoint client `withdraw` (`test_api_order/test_withdraw.py`) :
  8 cas couvrant anonyme, non-authentifié sur commande d'autrui, succès credential,
  succès certificate, erreurs (délai dépassé, pas de schedule).

### Fait mais pas encore committé (présent uniquement dans l'arbre de travail local)

Ces correctifs expliquent pourquoi Joanie démarre correctement en local malgré les
`# WIP`/bugs visibles dans les commits pushés :

- **Bug de syntaxe corrigé** dans `flows/order.py` (le `:` en trop après
  `PRODUCT_TYPE_CERTIFICATE` a été retiré).
- **Envoi réel des emails** câblé : `utils/emails.py` a maintenant
  `send_withdrawal_request()`/`send_withdrawal_confirmation()`, appelées depuis les deux
  hooks `_post_transition_success` de `OrderFlow` (au lieu des `pass` vides).
- **`Order.confirm_withdrawal()`** dispose maintenant de vraies gardes métier (uniquement
  les certificates non gratuits, uniquement si l'état est `pending_withdraw`) et déclenche
  effectivement `self.flow.cancel()` après confirmation — auparavant la méthode ne faisait
  que poser un timestamp sans changer l'état.
- **Endpoint admin `confirm_withdrawal`** mis à jour en cohérence (garde
  `product.type != CERTIFICATE or is_free`, réponse `200` sans body).
- **Stubs CSV** (`get_withdrawn_confirmation_at`/`get_withdrawn_requested_at`) renvoient
  maintenant les dates formatées au lieu de `None`.
- **Vues de debug** entièrement implémentées : 4 classes
  (`DebugWithdrawalRequestViewHtml/Txt`, `DebugWithdrawalConfirmationViewHtml/Txt`) avec
  génération d'une commande de test via `OrderGeneratorFactory` + `order.withdraw()`, et
  leurs URLs enregistrées (`__debug__/mail/withdrawal-*`).
- Ajustements mineurs sur les templates `.mjml` source.

## Reste à faire

### Backend (Joanie)

- **Committer et pousser** les correctifs ci-dessus — actuellement uniquement locaux,
  donc invisibles pour quiconque d'autre tant qu'ils ne sont pas dans un commit.
- **Tests manquants** : rien ne couvre encore `Order.confirm_withdrawal()` (les nouvelles
  gardes métier) ni l'endpoint admin `confirm_withdrawal` — c'était déjà noté dans un
  commentaire du code source d'origine et ce n'est toujours pas fait.
- Vérifier que les templates compilés (`core/templates/mail/html|text/withdrawal_*`)
  sont bien à jour avec les derniers éditos `.mjml` (`make mails-build` à relancer si les
  fichiers compilés n'ont pas été régénérés après les derniers ajustements du mjml).
- Considérer le contrat API comme stabilisé côté équipe frontend une fois la PR mergée
  (noms de champs, formats de réponse) — actuellement encore en l'état "PR en cours".

### Frontend (richie)

- **Aucun test automatisé** écrit sur toute cette feature (exclu explicitement de cette
  itération) : `OrderWithdrawalModal` (succès, erreur 422 vs générique, lien
  Keycloak/OpenEdX), gating `eligible_to_withdraw`/`has_waived_withdrawal_right` dans
  `OrganizationBlock` et `ProductCertificateFooter`.
- **Traductions** : tous les messages n'ont qu'un `defaultMessage` anglais — la
  formulation française exacte issue du décret/de l'issue devra être poussée via Crowdin.
- Pas de story Storybook pour `OrderWithdrawalModal`.
- Pas de test e2e sur le parcours complet.
- **Trou fonctionnel assumé** : côté commande credential (page détail), une fois
  rétracté l'order passe en `CANCELED` — un état atteignable par bien d'autres causes
  (non-paiement, annulation admin...). Aucun message "vous vous êtes rétracté" n'a été
  ajouté là pour ne pas induire en erreur sur les autres cas d'annulation. Pour l'ajouter
  proprement, il faudrait que Joanie expose `withdrawn_confirmation_at`/
  `withdrawn_requested_at` sur le serializer **client** (actuellement admin uniquement).

## Nice to have

- Rappeler la date limite (`withdrawal_date_limit`) directement dans la modale de
  confirmation, pas seulement sur la carte/ligne extérieure qui ouvre la modale.
- Revue du wording exact par l'équipe légale/compliance (feature à obligation
  réglementaire).
- Vérifier si le droit de rétractation s'applique aux `BatchOrder` (achats B2B) — jamais
  exploré dans cette itération, à confirmer plutôt qu'à supposer hors périmètre.
- Une page d'index listant les vues de debug mail (`__debug__/mail/...`) faciliterait la
  découverte, mais reste cosmétique.
