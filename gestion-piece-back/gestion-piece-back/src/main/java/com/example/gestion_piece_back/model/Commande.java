package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "commandes_fournisseurs")
public class Commande {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_demande_origine")
    private Long idDemandeOrigine;

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "fournisseur_id")
    private Long fournisseurId;

    @Column(name = "quantite")
    private Integer quantite;

    @Column(name = "date_commande")
    private LocalDateTime dateCommande;

    @Column(name = "date_reception_prevue")
    private java.time.LocalDate dateReceptionPrevue;

    @Column(name = "statut")
    private String statut; // "EN_COURS", "LIVREE"

    @ManyToOne
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    private Produit produit;

    @ManyToOne
    @JoinColumn(name = "fournisseur_id", insertable = false, updatable = false)
    private Fournisseur fournisseur;
}
