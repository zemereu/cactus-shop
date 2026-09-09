package com.cactusshop.backend.dto;

// Ce trimite adminul la crearea unei categorii noi.
// Fără câmp 'id', din același motiv ca la CactusRequestDTO.
public class CategoryRequestDTO {

    private String name;

    public CategoryRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}