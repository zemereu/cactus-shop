package com.cactusshop.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_email", columnList = "email"),
        @Index(name = "idx_order_customer", columnList = "customer_id")
})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, updatable = false)
    private String orderToken = UUID.randomUUID().toString();

    @JsonIgnore
    @Column(unique = true, updatable = false)
    private UUID idempotencyKey;

    @JsonIgnore
    @Column(length = 64, updatable = false)
    private String requestHash;

    private String customerName;
    private String email;
    private String address;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", updatable = false)
    private Customer customer;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(columnDefinition = "text")
    private String purchasedItems;

    @JsonIgnore
    @ElementCollection
    @CollectionTable(
            name = "order_quantities",
            joinColumns = @JoinColumn(name = "order_id")
    )
    @MapKeyColumn(name = "cactus_id")
    @Column(name = "quantity", nullable = false)
    private Map<Long, Integer> quantities = new HashMap<>();

    private String status = "Neplătită";

    private LocalDateTime createdAt = LocalDateTime.now(Clock.systemUTC());

    public Order() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderToken() {
        return orderToken;
    }

    public UUID getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(UUID idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public void setRequestHash(String requestHash) {
        this.requestHash = requestHash;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getPurchasedItems() {
        return purchasedItems;
    }

    public void setPurchasedItems(String purchasedItems) {
        this.purchasedItems = purchasedItems;
    }

    public Map<Long, Integer> getQuantities() {
        return quantities;
    }

    public void setQuantities(Map<Long, Integer> quantities) {
        this.quantities = quantities;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}