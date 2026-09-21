package com.cactusshop.backend.service;

import com.cactusshop.backend.dto.CategoryRequestDTO;
import com.cactusshop.backend.model.Category;
import com.cactusshop.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Cacheable(value = "categories", key = "#mainCategory != null ? #mainCategory : 'all'")
    public List<Category> getCategories(String mainCategory) {
        if (mainCategory == null || mainCategory.isBlank()) {
            return categoryRepository.findAll();
        }
        return categoryRepository.findByMainCategory(mainCategory);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public Category addCategory(CategoryRequestDTO request) {
        Category category = new Category();
        category.setName(request.name().trim());
        category.setMainCategory(request.mainCategory().trim());
        return categoryRepository.save(category);
    }

    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}