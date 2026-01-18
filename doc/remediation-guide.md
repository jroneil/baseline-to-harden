# Application Remediation & Resilience Guide

This guide explains how to use the insights from the Reliability Lab to diagnose and fix real-world application performance and stability issues.

---

## 1. Diagnostic Signals: What the Lab Teaches

### A. The "Slow Hang" (Baseline + Slow)
- **Signal**: P99 latency spikes, but no errors.
- **Problem**: Thread Pool Exhaustion. A slow dependency is "pinning" server threads. If you have 200 threads and 200 users call a slow service, the 201st user is blocked—even for fast endpoints.
- **Remediation**: 
    1.  **Implement Timeouts**: Hard-cap the wait time (e.g., 200ms in this lab).
    2.  **Add Bulkheads**: Isolate the slow dependency to its own small thread pool so it can't starve the rest of the app.

### B. The "Failure Storm" (Baseline + Fail)
- **Signal**: High volume of 502/504 errors in dashboard.
- **Problem**: Cascading Failure. Your app keeps trying to call a broken dependency, wasting resources and timing out users repeatedly.
- **Remediation**:
    1.  **Circuit Breaker**: Stop calling the dependency once it crosses a failure threshold.
    2.  **Graceful Degradation**: Return a cached response or a default "safe" value instead of an error.

### C. The "Quick Rejection" (Hardened + CB Open)
- **Signal**: Consistent ~1ms latency with 503 status code.
- **Explanation**: This is a *good* sign. Your system is "short-circuiting" to protect itself.
- **Remediation**: Don't just fix the code—investigate *why* the breaker tripped. Check the downstream service's logs using the **Correlation ID** found in the lab trace.

---

## 2. Real-World Use Cases

### Use Case 1: Third-Party Payment Gateway
*   **Problem**: The payment provider is slow during peak sales (Black Friday).
*   **Pattern**: **Timeout + Bulkhead**. 
*   **Result**: Even if payments take 5 seconds, your "Product Search" and "Add to Cart" stay fast because they aren't sharing the same thread pool resources as the payment logic.

### Use Case 2: Legacy Mainframe/Database
*   **Problem**: A legacy DB crashes under high read load.
*   **Pattern**: **Circuit Breaker**.
*   **Result**: When the DB starts failing, the app stops sending queries immediately. This gives the Database Administrator (DBA) breathing room to fix the issue without a continuous "DDoS" from the app.

### Use Case 3: Content Recommendation Engine
*   **Problem**: The "Related Products" API is flaky but not critical to the user checkout flow.
*   **Pattern**: **Timeout + Fallback**.
*   **Result**: If the API takes >100ms, the app returns an empty list or a pre-defined set of "Top Sellers" instead of throwing an error to the user.

---

## 3. Step-by-Step Fix Action Plan

If your application metrics look like the **Baseline** scenarios in this lab, follow these steps:

1.  **Identify the Boundary**: Pinpoint exactly where your code leaves your JVM (HTTP call, DB query, Cache hit).
2.  **Set an Aggressive Timeout**: Look at your P95 latency and set the timeout slightly above it. **Never** use the default (which is often infinite).
3.  **Wrap in a Breaker**: Configure a Circuit Breaker with a sliding window. 50% failure over 10-20 requests is a common starting point.
4.  **Log the Correlation ID**: Ensure your `Correlation-Id` is passed in all headers (as seen in `lib/api.ts` and `CorrelationIdHelper.java`). This allows you to link a failure in your UI back to a specific line of code in the logs.
5.  **Monitor & Tune**: Use the status metrics (like the **CB Status Widget**) to observe how the breaker behaves in production and adjust thresholds accordingly.
