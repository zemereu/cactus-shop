package com.cactusshop.backend.dto;

import java.util.List;

// Ce trimite clientul la crearea unei comenzi.
// NU are câmp 'id' (serverul îl alocă) și NU are 'totalPrice'
// (serverul îl calculează din prețurile reale ale produselor,
// nu are încredere în ce trimite browser-ul).
public class OrderRequestDTO {

    private String customerName;
    private String address;
    private List<Long> cactusIds; // id-ul fiecărui produs din coș (repetat dacă e cumpărat de mai multe ori)

    public OrderRequestDTO() {}

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public List<Long> getCactusIds() { return cactusIds; }
    public void setCactusIds(List<Long> cactusIds) { this.cactusIds = cactusIds; }
}