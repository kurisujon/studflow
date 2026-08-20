class InfrastructureError(Exception):
    """Raised when an API rate limit or other provider-level exhaustion occurs."""
    pass

class ConfigMismatchError(Exception):
    """Raised when attempting to resume a run with a different configuration."""
    pass
