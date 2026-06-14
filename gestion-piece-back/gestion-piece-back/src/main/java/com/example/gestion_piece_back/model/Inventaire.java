package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "inventaires")
public class Inventaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_debut")
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(name = "statut")
    private String statut; // "En cours", "Validé", "Refusé", "Annulé"

    @Column(name = "responsable")
    private String responsable;

    @OneToMany(mappedBy = "inventaire", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<LigneInventaire> lignes;

    @PrePersist
    protected void onCreate() {
        if (dateDebut == null) {
            dateDebut = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "En cours";
        }
    }
}
