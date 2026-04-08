package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "demandes")
public class DemandeProduit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_demande")
    private Long idDemande;

    @Column(name = "date_demande")
    private LocalDateTime dateDemande;

    @Column(name = "statut")
    private String statut;

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "quantite")
    private Integer quantite;

    @Column(name = "motif")
    private String motif;

    @Column(name = "technicien_id")
    private Long technicienId;

    @ManyToOne
    @JoinColumn(name = "produit_id", insertable = false, updatable = false)
    private Produit produit;
}