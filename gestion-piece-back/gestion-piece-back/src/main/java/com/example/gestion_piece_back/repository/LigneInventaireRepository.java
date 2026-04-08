package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.LigneInventaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LigneInventaireRepository extends JpaRepository<LigneInventaire, Long> {
}
