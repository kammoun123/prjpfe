package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.DemandePieceLigne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DemandePieceLigneRepository extends JpaRepository<DemandePieceLigne, Long> {
    List<DemandePieceLigne> findByDemandeId(Long demandeId);
}
