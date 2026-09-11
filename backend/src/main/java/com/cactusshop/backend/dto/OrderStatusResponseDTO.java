package com.cactusshop.backend.dto;

// Răspunsul public la verificarea unei comenzi — expune DOAR ce are nevoie
// clientul să vadă, nu toată entitatea Order (nu-i treaba altcuiva, de ex,
// să vadă adresa exactă printr-un id ghicit — de asta cerem și email la lookup).
public class OrderStatusResponseDTO {
    private Long id;
    private String status;
    private String purchasedItems;
    private double totalPrice;

    public OrderStatusResponseDTO(Long id, String status, String purchasedItems, double totalPrice) {
        this.id = id;
        this.status = status;
        this.purchasedItems = purchasedItems;
        this.totalPrice = totalPrice;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public String getPurchasedItems() { return purchasedItems; }
    public double getTotalPrice() { return totalPrice; }
}