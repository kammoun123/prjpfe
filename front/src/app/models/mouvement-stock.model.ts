import { Produit } from './produit.model';

export interface MouvementStock {
    id?: number;
    produitId: number;
    typeMouvement: string;
    quantite: number;
    dateMouvement: Date;
    motif: string;
    produit?: Produit;
}
