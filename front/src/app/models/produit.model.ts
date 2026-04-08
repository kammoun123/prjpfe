export interface Produit {
    idProduit?: number;
    reference: string;
    designation: string;
    ficheTechniqueUrl?: string;
    quantiteStock: number;
    seuilAlerte: number;
    idCategorie?: number;
    photoUrl?: string;
}
