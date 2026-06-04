import { Produit } from './produit.model';
import { DemandePieceLigne } from './demande-piece-ligne.model';

export interface DemandeProduit {
    id?: number;
    idDemande?: number;
    dateDemande?: Date;
    statut: string;
    technicienId: number;
    dateLivraisonPrevue?: Date;
    observation?: string;
    lignes?: DemandePieceLigne[];
}
