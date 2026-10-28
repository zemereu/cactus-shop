package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.repository.CategoryRepository;
import com.cactusshop.backend.repository.CactusRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CactusRepository cactusRepository;

    @Cacheable(value = "categories", key = "#mainCategory != null ? #mainCategory : 'all'")
    public List<Category> getCategories(String mainCategory) {
        if (mainCategory == null || mainCategory.isBlank()) {
            return categoryRepository.findAll();
        }
        return categoryRepository.findByMainCategory(mainCategory);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public Category addCategory(CategoryRequestDTO request) {
        if (categoryRepository.existsByNameAndMainCategory(
                request.name().trim(), request.mainCategory().trim())) {
            throw new IllegalStateException("Subcategoria există deja în această categorie principală.");
        }
        Category category = new Category();
        category.setName(request.name().trim());
        category.setMainCategory(request.mainCategory().trim());
        return categoryRepository.saveAndFlush(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findLockedById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Subcategoria nu există."));
        if (cactusRepository.existsByCategoryAndMainCategory(category.getName(), category.getMainCategory())) {
            throw new IllegalStateException("Subcategoria este folosită de produse active sau inactive. Mută produsele înainte de ștergere.");
        }
        categoryRepository.delete(category);
        categoryRepository.flush();
    }
}