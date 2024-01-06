export interface ErrorBlock {
    Id?: string,
    ErrorMessage?: string
}

export interface ShortUrlRequest {
    originalUrl?: string
}

export interface ShortUrlResponse {
    id?: string,
    shortUrl?: string
}