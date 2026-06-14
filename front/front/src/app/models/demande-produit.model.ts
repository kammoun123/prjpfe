import { Produit } from './produit.model';

export interface DemandeProduit {
    id?: number;
    idDemande?: number;
    dateDemande?: Date;
    statut: string;
    produitId: number;
    quantite: number;
    motif: string;
    technicienId: number;
    produit?: Produit;
}
