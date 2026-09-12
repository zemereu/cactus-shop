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

    // Public — doar produse active
    @GetMapping
    public List<Cactus> getCacti(
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String mainCategory,
            @RequestParam(required = false, defaultValue = "Toți") String category,
            @RequestParam(required = false, defaultValue = "") String search) {

        return cactusService.getActiveCacti(productType, mainCategory, category, search);
    }

    // Admin — toate produsele (inclusiv inactive)
    @GetMapping("/all")
    public List<Cactus> getAllCacti() {
        return cactusService.getAllCacti();
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

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateCactus(@PathVariable Long id) {
        try {
            Cactus saved = cactusService.reactivateCactus(id);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> hardDeleteCactus(@PathVariable Long id) {
        try {
            cactusService.hardDeleteCactus(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
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