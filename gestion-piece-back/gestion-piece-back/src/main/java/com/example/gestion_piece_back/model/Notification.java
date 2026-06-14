package com.example.gestion_piece_back.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titre")
    private String titre;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "type_notification")
    private String typeNotification;

    @Column(name = "role_cible")
    private String roleCible;

    @Column(name = "statut")
    private String statut; // "NON_LUE" or "LUE"

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (statut == null) {
            statut = "NON_LUE";
        }
    }
}
