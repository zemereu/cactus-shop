package com.cactusshop.backend.repository;

import com.cactusshop.backend.model.Cactus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CactusRepository extends JpaRepository<Cactus, Long> {
    // Aici primești automat funcțiile de salvare (save), ștergere (delete) și căutare (findAll)!
}