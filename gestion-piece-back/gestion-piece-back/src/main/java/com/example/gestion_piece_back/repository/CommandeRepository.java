package com.example.gestion_piece_back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.gestion_piece_back.model.Commande;

@Repository
public interface CommandeRepository extends JpaRepository<Commande, Long> {
}
