package com.example.demo.web;

import io.github.resilience4j.bulkhead.BulkheadFullException;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import java.util.concurrent.TimeoutException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TimeoutException.class)
    public ResponseEntity<Map<String, Object>> handleTimeout(TimeoutException e) {
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
                .body(Map.of("ok", false, "message", "Request timed out: " + e.getMessage()));
    }

    @ExceptionHandler(CallNotPermittedException.class)
    public ResponseEntity<Map<String, Object>> handleCircuitBreaker(CallNotPermittedException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("ok", false, "message", "Circuit breaker is open: " + e.getMessage()));
    }

    @ExceptionHandler(BulkheadFullException.class)
    public ResponseEntity<Map<String, Object>> handleBulkhead(BulkheadFullException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("ok", false, "message", "Bulkhead is full: " + e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception e) {
        if (e.getMessage() != null && e.getMessage().contains("TIMEOUT")) {
            return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
                    .body(Map.of("ok", false, "message", "Request timed out: " + e.getMessage()));
        }
        // Log the exception in a real app
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("ok", false, "message", "Dependency failure: " + e.getMessage()));
    }
}
