package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "produits")
public class Produit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long idProduit;

    @Column(name = "reference")
    private String reference;

    @Column(name = "designation")
    private String designation;

    @Column(name = "fiche_technique_url")
    private String ficheTechniqueUrl;

    @Column(name = "quantite_stock")
    @jakarta.validation.constraints.Min(0)
    private Integer quantiteStock;

    @Column(name = "seuil_alerte")
    private Integer seuilAlerte;

    @Column(name = "id_categorie")
    private Long idCategorie;

    @Column(name = "photo_url")
    private String photoUrl;

    @ManyToOne
    @JoinColumn(name = "id_categorie", insertable = false, updatable = false)
    private Categorie categorie;
}
