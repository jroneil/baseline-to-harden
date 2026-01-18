package com.example.demo.resilience;

import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class ResilientWrapper {

    private final CircuitBreaker circuitBreaker;
    private final Bulkhead bulkhead;

    public <T> T execute(Supplier<T> supplier) {
        // Wrap with Circuit Breaker and Bulkhead
        Supplier<T> decorated = Bulkhead.decorateSupplier(bulkhead,
                CircuitBreaker.decorateSupplier(circuitBreaker, supplier));

        try {
            // Use CompletableFuture for the timeout to ensure it works across R4J versions
            return CompletableFuture.supplyAsync(decorated)
                    .get(200, TimeUnit.MILLISECONDS);
        } catch (java.util.concurrent.TimeoutException e) {
            throw new RuntimeException("TIMEOUT", e);
        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException)
                throw (RuntimeException) cause;
            throw new RuntimeException(cause);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
