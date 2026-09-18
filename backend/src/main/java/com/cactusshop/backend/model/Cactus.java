package com.cactusshop.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cacti", indexes = {
        @Index(name = "idx_cactus_active", columnList = "active")
})
public class Cactus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    // "Plantă" | "Semințe" — nivelul de sus, tip de produs
    private String productType;

    // "Cactuși" | "Suculente" — nivelul din mijloc
    private String mainCategory;

    // genul, ex: "Mammillaria", "Lithops" — nivelul de jos
    private String category;

    private String description;

    @Column(length = 1000)
    private String imageUrl;

    private int stock = 0;

    private boolean active = true;

    public Cactus() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

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

    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}