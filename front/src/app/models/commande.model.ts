import { CommandeLigne } from './commande-ligne.model';
import { Fournisseur } from './fournisseur.model';

export interface Commande {
    id?: number;
    idDemandeOrigine?: number;
    fournisseurId: number;
    dateCommande?: Date;
    dateReceptionPrevue?: Date;
    statut: string; // "EN_COURS", "LIVREE", "PARTIELLEMENT_LIVREE"
    observation?: string;
    fournisseur?: Fournisseur;
    lignes?: CommandeLigne[];
}
