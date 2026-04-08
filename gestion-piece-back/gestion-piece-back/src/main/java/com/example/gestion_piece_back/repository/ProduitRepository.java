package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.Produit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ProduitRepository extends JpaRepository<Produit, Long> {
    @Modifying
    @Transactional
    @Query("UPDATE Produit p SET p.quantiteStock = 0 WHERE p.quantiteStock < 0")
    void resetNegativeStocks();
}
