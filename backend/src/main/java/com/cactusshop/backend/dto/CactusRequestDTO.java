package com.cactusshop.backend.dto;

// Ce trimite adminul la crearea unui produs nou.
// Fără câmp 'id' — serverul îl alocă mereu automat,
// niciodată nu-l lăsăm pe client să-l aleagă (previne suprascrierea
// accidentală sau intenționată a unui produs existent).
public class CactusRequestDTO {

    private String name;
    private double price;
    private String category;
    private String description;
    private String imageUrl;

    public CactusRequestDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}