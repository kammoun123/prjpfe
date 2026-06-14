package com.example.gestion_piece_back.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.gestion_piece_back.model.MouvementStock;
import java.util.List;

@Repository
public interface MouvementStockRepository extends JpaRepository<MouvementStock, Long> {
    List<MouvementStock> findByProduitId(Long produitId);

    List<MouvementStock> findByTypeMouvement(String typeMouvement);
}
