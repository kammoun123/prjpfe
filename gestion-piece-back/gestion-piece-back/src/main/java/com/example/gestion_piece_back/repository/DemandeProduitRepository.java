package com.example.gestion_piece_back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.gestion_piece_back.model.DemandeProduit;

@Repository
public interface DemandeProduitRepository extends JpaRepository<DemandeProduit, Long> {
}