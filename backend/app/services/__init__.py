"""
KadaiGPT - Services Package
"""

from .email_service import email_service, EmailTemplate, EmailService

__all__ = [
    "email_service",
    "EmailTemplate",
    "EmailService"
]
