package com.cactusshop.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_email", columnList = "email")
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Token unic pentru lookup public — nu e ghicibil ca un ID secvențial
    @Column(unique = true, nullable = false, updatable = false)
    private String orderToken = UUID.randomUUID().toString();

    private String customerName;
    private String email;
    private String address;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(length = 2000)
    private String purchasedItems;

    // "Neplătită" | "Plătită - în pregătire" | "Expediată" | "Livrată"
    private String status = "Neplătită";
    private LocalDateTime createdAt = LocalDateTime.now();

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderToken() { return orderToken; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getPurchasedItems() { return purchasedItems; }
    public void setPurchasedItems(String purchasedItems) { this.purchasedItems = purchasedItems; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}