package com.cactusshop.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class CactusRequestDTO {

    @NotBlank(message = "Numele produsului este obligatoriu.")
    private String name;

    @Positive(message = "Prețul trebuie să fie mai mare decât 0.")
    private double price;

    @NotBlank(message = "Subcategoria (genul) este obligatorie.")
    private String category;

    @NotBlank(message = "Categoria principală este obligatorie.")
    private String mainCategory;

    private String description;
    private String imageUrl;

    public CactusRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getMainCategory() { return mainCategory; }
    public void setMainCategory(String mainCategory) { this.mainCategory = mainCategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}