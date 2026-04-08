export interface DemandeItem {
    idDemandeItem?: number;
    produitId: number; // Renamed from pieceId to match user's feedback
    quantite: number;
    designation: string;
}

export interface DemandeProduitMulti {
    idDemande?: number;
    dateDemande: string;
    statut: string;
    items: DemandeItem[];
    motif: string;
    urgence: string;
    technicienId: number;
}
