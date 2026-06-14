package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.Inventaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventaireRepository extends JpaRepository<Inventaire, Long> {
}
