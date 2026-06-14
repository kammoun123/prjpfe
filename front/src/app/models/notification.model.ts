export interface Notification {
    id?: number;            // backend returns 'id'
    idNotification?: number; // alias kept for compatibility
    titre?: string;
    produitId: number;
    message: string;
    dateCreation: string;
    statut: 'NON_LUE' | 'LUE';
    typeNotification: string;
    roleCible?: string;
    data?: any;
    produit?: any;
}
