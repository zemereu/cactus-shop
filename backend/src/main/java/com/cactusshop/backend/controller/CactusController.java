package com.cactusshop.backend.controller;

import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.repository.CactusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cacti")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class CactusController {

    @Autowired
    private CactusRepository cactusRepository;

    @GetMapping
    public List<Cactus> getCacti(
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        // Dacă utilizatorul vrea toate categoriile, căutăm doar după text
        if (category.equals("Toți")) {
            return cactusRepository.findByNameContainingIgnoreCase(search);
        }
        // Altfel, căutăm și după categorie, și după text
        else {
            return cactusRepository.findByCategoryAndNameContainingIgnoreCase(category, search);
        }
    }

    @PostMapping
    public Cactus addCactus(@RequestBody Cactus cactus) {
        return cactusRepository.save(cactus);
    }

    // NOU: Endpoint-ul pentru ștergere
    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusRepository.deleteById(id);
    }
}