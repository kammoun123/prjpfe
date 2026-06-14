package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
    java.util.List<Utilisateur> findByRole(String role);
}
