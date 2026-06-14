package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.DemandeProduit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DemandeProduitRepository extends JpaRepository<DemandeProduit, Long> {
    List<DemandeProduit> findByStatut(String statut);
    List<DemandeProduit> findByTechnicienId(Long technicienId);
}
