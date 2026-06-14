package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "commandes")
public class Commande {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_demande_origine")
    private Long idDemandeOrigine;

    @Column(name = "fournisseur_id")
    private Long fournisseurId;

    @Column(name = "date_commande")
    private LocalDateTime dateCommande;

    @Column(name = "date_reception_prevue")
    private java.time.LocalDate dateReceptionPrevue;

    @Column(name = "statut")
    private String statut; // "EN_COURS", "LIVREE", "PARTIELLEMENT_LIVREE"

    @Column(name = "observation")
    private String observation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fournisseur_id", insertable = false, updatable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Fournisseur fournisseur;

    @OneToMany(mappedBy = "commande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<CommandeLigne> lignes;
}
