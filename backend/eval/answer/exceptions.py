class InfrastructureError(Exception):
    """Raised when an API rate limit or other provider-level exhaustion occurs."""
    pass

class ConfigMismatchError(Exception):
    """Raised when attempting to resume a run with a different configuration."""
    pass

class UncertifiedBaselineError(Exception):
    """Raised when C4/C5 are pointed at a C3 run that is not CERTIFIED_C3_BASELINE."""
    pass
