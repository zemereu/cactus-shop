package com.cactusshop.backend.model;

import jakarta.persistence.*;

@Entity // Indică faptul că acest obiect va deveni un tabel în PostgreSQL
@Table(name = "cacti")
public class Cactus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private double price;
    private String category;
    private String description;

    // Constructor gol (necesar pentru Spring)
    public Cactus() {}

    // Getteri și Setteri pentru a permite accesul la date
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}