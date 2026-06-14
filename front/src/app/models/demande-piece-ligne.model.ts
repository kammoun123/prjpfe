import { Produit } from './produit.model';

export interface DemandePieceLigne {
    id?: number;
    demandeId?: number;
    produitId: number;
    quantite: number;
    motif: string;
    statut: string; // "EN_ATTENTE", "APPROUVEE", "REJETEE"
    observation?: string;
    produit?: Produit;
}
