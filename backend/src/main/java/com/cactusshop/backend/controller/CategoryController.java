package com.cactusshop.backend.controller;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "https://cactshop.netlify.app")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> addCategory(@RequestBody CategoryRequestDTO request) {

        if (request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Numele categoriei este obligatoriu.");
        }

        // Construim entitatea NOUĂ — fără id, Spring/Hibernate îl alocă automat
        Category category = new Category();
        category.setName(request.getName().trim());

        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public void deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
    }
}