import { Commande } from './commande.model';
import { Produit } from './produit.model';

export interface CommandeLigne {
    id?: number;
    commandeId?: number;
    produitId: number;
    quantite: number;
    statut: string; // "EN_COURS", "LIVREE", "PARTIELLEMENT_LIVREE"
    observation?: string;
    produit?: Produit;
    commande?: Commande;
}
