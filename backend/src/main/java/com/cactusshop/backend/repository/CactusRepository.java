package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {

    // Caută după Categorie ȘI Nume (ignorând literele mari/mici)
    List<Cactus> findByCategoryAndNameContainingIgnoreCase(String category, String name);

    // Caută doar după Nume (pentru categoria "Toți")
    List<Cactus> findByNameContainingIgnoreCase(String name);
}