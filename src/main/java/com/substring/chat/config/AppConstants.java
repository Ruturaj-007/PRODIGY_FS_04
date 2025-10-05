package com.substring.chat.config;

public class AppConstants {
    // Allowed origins for CORS
    public static final String FRONT_END_BASE_URL = "http://localhost:8080";

    // WebSocket endpoints
    public static final String WEBSOCKET_ENDPOINT = "/ws";
    public static final String WEBSOCKET_BROKER = "/topic";
    public static final String WEBSOCKET_APP_PREFIX = "/app";

    // Message limits
    public static final int MAX_MESSAGE_LENGTH = 2000;
    public static final int MAX_ROOM_ID_LENGTH = 50;
    public static final int MAX_USERNAME_LENGTH = 30;

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 50;
    public static final int MAX_PAGE_SIZE = 100;
}