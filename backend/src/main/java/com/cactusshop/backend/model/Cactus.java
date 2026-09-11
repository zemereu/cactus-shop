package com.cactusshop.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cacti")
public class Cactus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private double price;

    // "Plantă" | "Semințe" — nivelul de sus, tip de produs
    private String productType;

    // "Cactuși" | "Suculente" — nivelul din mijloc
    private String mainCategory;

    // genul, ex: "Mammillaria", "Lithops" — nivelul de jos
    private String category;

    private String description;

    @Column(length = 1000)
    private String imageUrl;

    public Cactus() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }

    public String getMainCategory() { return mainCategory; }
    public void setMainCategory(String mainCategory) { this.mainCategory = mainCategory; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}