export interface Notification {
    idNotification?: number;
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
