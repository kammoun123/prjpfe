export interface Fournisseur {
    idFournisseur?: number;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    statut: string; // "ACTIF" ou "INACTIF"
}
