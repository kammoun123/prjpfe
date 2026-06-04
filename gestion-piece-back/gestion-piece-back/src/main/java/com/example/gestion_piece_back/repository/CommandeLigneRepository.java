package com.example.gestion_piece_back.repository;

import com.example.gestion_piece_back.model.CommandeLigne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommandeLigneRepository extends JpaRepository<CommandeLigne, Long> {
    List<CommandeLigne> findByCommandeId(Long commandeId);
}
