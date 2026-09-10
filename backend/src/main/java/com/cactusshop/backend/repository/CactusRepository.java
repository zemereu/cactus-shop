package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {

    // Filtrare completă: categorie principală + gen + text căutat
    List<Cactus> findByMainCategoryAndCategoryAndNameContainingIgnoreCase(
            String mainCategory, String category, String name);

    // Filtrare doar după categorie principală + text (toate genurile, "Toți")
    List<Cactus> findByMainCategoryAndNameContainingIgnoreCase(
            String mainCategory, String name);

    // Căutare generală, fără filtrare pe categorie (păstrat pentru compatibilitate)
    List<Cactus> findByNameContainingIgnoreCase(String name);
}