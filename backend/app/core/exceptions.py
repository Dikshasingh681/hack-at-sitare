"""
Application-specific exceptions and their HTTP mapping.
"""


class CursorPMError(Exception):
    """Base exception for all application errors."""

    status_code: int = 500

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class AIProviderError(CursorPMError):
    """Raised when the Groq API call fails or returns an unusable response."""

    status_code = 502


class AIResponseParsingError(CursorPMError):
    """Raised when the AI response cannot be parsed into the expected schema."""

    status_code = 502


class InvalidInputError(CursorPMError):
    """Raised when the request payload fails domain-level validation."""

    status_code = 422


class ConfigurationError(CursorPMError):
    """Raised when required configuration (e.g. API key) is missing."""

    status_code = 500
