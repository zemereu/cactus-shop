package com.cactusshop.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(org.springframework.web.ErrorResponseException.class)
    public ResponseEntity<?> handleHttpError(
            org.springframework.web.ErrorResponseException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(buildBody(
                ex instanceof org.springframework.web.server.ResponseStatusException status
                        && status.getReason() != null
                        ? status.getReason()
                        : "Cererea nu poate fi procesată."));
    }

    @ExceptionHandler(
            org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<?> handleMissingResource(Exception ex) {
        return ResponseEntity.status(404)
                .body(buildBody("Resursa nu există."));
    }

    @ExceptionHandler({
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.multipart.support.MissingServletRequestPartException.class
    })
    public ResponseEntity<?> handleMissingParameter(Exception ex) {
        return ResponseEntity.badRequest()
                .body(buildBody("Lipsește un parametru obligatoriu."));
    }

    @ExceptionHandler(
            org.springframework.dao.OptimisticLockingFailureException.class)
    public ResponseEntity<?> handleConflict(Exception ex) {
        return ResponseEntity.status(409).body(buildBody(
                "Produsul a fost modificat între timp. Reîncarcă lista înainte de editare."));
    }

    @ExceptionHandler(
            org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleConstraint(Exception ex) {
        return ResponseEntity.status(409).body(buildBody(
                "Datele depășesc limitele permise sau există deja."));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleState(IllegalStateException ex) {
        return ResponseEntity.status(409).body(buildBody(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {
        Map<String, Object> body = buildBody("Parametru invalid.");
        body.put("details", Map.of(
                ex.getName(), "Valoarea nu are formatul așteptat."));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> handleUploadTooLarge(
            MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(buildBody("Imaginea depășește limita de 5 MB."));
    }

    private Map<String, Object> buildBody(String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", message);
        return body;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleMalformedRequest(
            HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody("Cererea trimisă are un format invalid."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Date invalide trimise.");
        body.put("details", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<?> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(buildBody("Metodă HTTP neacceptată pentru acest endpoint."));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<?> handleMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(buildBody(
                        "Tip de conținut neacceptat. Folosește application/json."));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildBody("Resursa cerută nu a fost găsită."));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(
            IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(ex.getMessage() == null
                        ? "Date invalide."
                        : ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("Eroare necontrolată", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildBody(
                        "A apărut o eroare internă. Te rugăm să încerci din nou mai târziu."));
    }
}