package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CactusRequestDTO;
import com.cactusshop.backend.model.Cactus;
import com.cactusshop.backend.service.CactusService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cacti")
public class CactusController {

    @Autowired
    private CactusService cactusService;

    @GetMapping
    public List<Cactus> getCacti(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String mainCategory,
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        return cactusService.getCacti(productType, mainCategory, category, search);
    }

    @PostMapping
    public ResponseEntity<Cactus> addCactus(@Valid @RequestBody CactusRequestDTO request) {
        Cactus saved = cactusService.addCactus(request);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCactus(@PathVariable Long id) {
        cactusService.deleteCactus(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCactus(@PathVariable Long id,
                                          @Valid @RequestBody CactusRequestDTO request) {
        try {
            Cactus saved = cactusService.updateCactus(id, request);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}