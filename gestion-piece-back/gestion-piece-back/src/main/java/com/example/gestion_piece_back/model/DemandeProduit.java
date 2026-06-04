package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "demandes")
public class DemandeProduit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_demande")
    private LocalDateTime dateDemande;

    @Column(name = "statut")
    private String statut; // "EN_ATTENTE", "APPROUVEE", "REJETEE"

    @Column(name = "date_livraison_prevue")
    private java.time.LocalDate dateLivraisonPrevue;

    @Column(name = "technicien_id")
    private Long technicienId;

    @Column(name = "observation")
    private String observation;

    @Column(name = "id_demande")
    private Long idDemande;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DemandePieceLigne> lignes;
}