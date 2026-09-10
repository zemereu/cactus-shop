package com.cactusshop.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

// Prinde orice excepție necontrolată din controllere și returnează
// un mesaj curat, generic, în loc să lase Spring să scoată stack trace-ul
// complet (nume de clase, query-uri, structura internă a aplicației)
// direct în răspunsul HTTP către client.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Corpul JSON standard pentru orice eroare
    private Map<String, Object> buildBody(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        return body;
    }

    // Date trimise într-un format greșit (JSON malformat, tip de câmp greșit etc.)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleMalformedRequest(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody("Cererea trimisă are un format invalid."));
    }

    // Erori de validare de la @Valid (ex: @NotBlank, @Positive nerespectate).
    // Adunăm toate mesajele de eroare într-o singură listă clară, în loc
    // de formatul default, verbose, al Spring.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("error", "Date invalide trimise.");
        body.put("details", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // Metodă HTTP greșită folosită pe un endpoint (ex: GET pe un endpoint doar POST)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(buildBody("Metodă HTTP neacceptată pentru acest endpoint."));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<?> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(buildBody("Tip de conținut neacceptat. Folosește application/json."));
    }

    // O resursă căutată (ex: findById) nu a fost găsită
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildBody("Resursa cerută nu a fost găsită."));
    }

    // Argumente invalide trimise către logica internă
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody("Date invalide trimise către server."));
    }

    // Plasă de siguranță finală — orice altă excepție necontrolată.
    // NU includem ex.getMessage() sau stack trace-ul în răspuns,
    // ca să nu scurgem detalii interne (nume de clase, structuri SQL etc.)
    // către un client care ar putea fi rău-intenționat.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        // Logăm eroarea completă pe server, pentru debugging — dar NU o trimitem clientului.
        System.err.println("Eroare necontrolată: " + ex);
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody("A apărut o eroare internă. Te rugăm să încerci din nou mai târziu."));
    }
}