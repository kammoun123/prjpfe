package com.example.gestion_piece_back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestion_piece_back.model.Fournisseur;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {
}
