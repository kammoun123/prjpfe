package com.example.gestion_piece_back.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventaires")
@Data
@NoArgsConstructor
public class Inventaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String statut; // "En cours", "Validé", "Refusé", "Annulé"

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;
    
    private String description;

    @OneToMany(mappedBy = "inventaire", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<LigneInventaire> lignes = new ArrayList<>();
}
