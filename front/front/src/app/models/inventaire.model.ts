export interface LigneInventaire {
  id?: number | string;
  produit?: any;
  piece?: any;
  idProduit?: number;
  id_produit?: number;
  quantiteTheorique: number;
  quantite_theorique?: number;
  quantiteReelle: number;
  quantite_reelle?: number;
  quantitePhysique?: number;
  quantite_physique?: number;
  ecart: number;
}

export interface Inventaire {
  id?: number | string;
  idInventaire?: number | string;
  dateDebut: Date | string;
  dateFin?: Date | string;
  statut: 'En cours' | 'Validé' | 'Refusé' | 'Annulé';
  description?: string;
  lignes?: LigneInventaire[];
}
