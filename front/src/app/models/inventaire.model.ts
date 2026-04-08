export interface Inventaire {
  id?: number | string;
  idInventaire?: number | string;
  dateDebut: Date | string;
  dateFin?: Date | string;
  statut: 'En cours' | 'Validé' | 'Refusé' | 'Annulé';
}
