package com.hireblind.processing.exception;

public class MalformedLlmResponseException extends RuntimeException {
    public MalformedLlmResponseException(String message, Throwable cause) {
        super(message, cause);
    }
    public MalformedLlmResponseException(String message) {
        super(message);
    }
}
