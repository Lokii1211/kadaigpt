"""
KadaiGPT - AI Agents Package
Export all agents for easy import
"""

from app.agents.print_agent import PrintAgent, print_agent
from app.agents.ocr_agent import OCRAgent, ocr_agent
from app.agents.offline_agent import OfflineAgent, offline_agent
from app.agents.inventory_agent import InventoryAgent, inventory_agent

__all__ = [
    "PrintAgent", "print_agent",
    "OCRAgent", "ocr_agent", 
    "OfflineAgent", "offline_agent",
    "InventoryAgent", "inventory_agent"
]
