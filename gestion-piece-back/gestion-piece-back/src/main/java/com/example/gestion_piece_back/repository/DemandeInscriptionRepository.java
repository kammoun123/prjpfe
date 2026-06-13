package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.DemandeInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DemandeInscriptionRepository extends JpaRepository<DemandeInscription, Long> {
    Optional<DemandeInscription> findByEmail(String email);
}
