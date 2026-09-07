package com.cactusshop.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "orders") // Folosim "orders" pentru că "order" este un cuvânt rezervat în SQL
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String address;
    private double totalPrice;

    @Column(length = 2000) // Oferim spațiu suficient pentru o listă lungă de produse
    private String purchasedItems;

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public String getPurchasedItems() { return purchasedItems; }
    public void setPurchasedItems(String purchasedItems) { this.purchasedItems = purchasedItems; }
}