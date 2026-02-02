"""
KadaiGPT - AI Agents API Router
Endpoints for interacting with autonomous AI agents
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import json

from ..agents.core.base_agent import AgentOrchestrator, AgentGoal
from ..agents.core.store_manager_agent import StoreManagerAgent
from ..agents.core.inventory_agent import InventoryAgent
from ..agents.core.customer_agent import CustomerEngagementAgent, CustomerMessage

router = APIRouter(prefix="/agents", tags=["AI Agents"])

# Store agent instances (in production, would use dependency injection)
agent_instances: Dict[int, AgentOrchestrator] = {}


# ==================== Request/Response Models ====================

class AgentQueryRequest(BaseModel):
    """Request to query an agent"""
    message: str
    agent_type: str = "store_manager"  # store_manager, inventory, customer
    context: Optional[Dict] = None


class AgentQueryResponse(BaseModel):
    """Response from agent query"""
    success: bool
    agent: str
    response: Any
    actions_taken: int
    processing_time_ms: int


class WhatsAppIncomingMessage(BaseModel):
    """Incoming WhatsApp message"""
    phone: str
    message: str
    message_type: str = "text"
    timestamp: Optional[datetime] = None


class BulkCampaignRequest(BaseModel):
    """Request to send bulk campaign"""
    campaign_type: str  # general, loyalty, birthday, winback
    customer_phones: List[str]


class ProactiveSuggestionResponse(BaseModel):
    """Proactive suggestions from agents"""
    suggestions: List[Dict]
    timestamp: datetime


# ==================== Helper Functions ====================

def get_orchestrator(store_id: int) -> AgentOrchestrator:
    """Get or create agent orchestrator for a store"""
    if store_id not in agent_instances:
        orchestrator = AgentOrchestrator(store_id)
        
        # Initialize agents
        store_manager = StoreManagerAgent(store_id, "KadaiGPT Store")
        inventory_agent = InventoryAgent(store_id)
        customer_agent = CustomerEngagementAgent(store_id, "KadaiGPT Store")
        
        orchestrator.register_agent(store_manager)
        orchestrator.register_agent(inventory_agent)
        orchestrator.register_agent(customer_agent)
        
        agent_instances[store_id] = orchestrator
    
    return agent_instances[store_id]


# ==================== Endpoints ====================

@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(request: AgentQueryRequest, store_id: int = 1):
    """
    Send a natural language query to an AI agent.
    The agent will process the request and take appropriate actions.
    """
    start_time = datetime.now()
    
    try:
        orchestrator = get_orchestrator(store_id)
        
        # Get the appropriate agent
        agent_map = {
            "store_manager": "StoreManager",
            "inventory": "InventoryAgent",
            "customer": "CustomerAgent"
        }
        
        agent_name = agent_map.get(request.agent_type, "StoreManager")
        agent = orchestrator.get_agent(agent_name)
        
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent '{request.agent_type}' not found")
        
        # Create goal and run agent
        goal = AgentGoal(
            id=f"query_{datetime.now().timestamp()}",
            description=request.message,
            priority=1
        )
        
        # Add context to agent memory
        if request.context:
            agent.memory.context.update(request.context)
        
        result = await agent.run(goal)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return AgentQueryResponse(
            success=True,
            agent=agent_name,
            response=result,
            actions_taken=len(agent.action_history),
            processing_time_ms=int(processing_time)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_agents_status(store_id: int = 1):
    """Get status of all AI agents for a store"""
    orchestrator = get_orchestrator(store_id)
    
    return {
        "store_id": store_id,
        "agents": orchestrator.get_all_statuses(),
        "active_goals": len(orchestrator.active_goals),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/suggestions")
async def get_proactive_suggestions(store_id: int = 1):
    """
    Get proactive suggestions from the Store Manager agent.
    These are autonomous insights the AI thinks you should know about.
    """
    orchestrator = get_orchestrator(store_id)
    store_manager = orchestrator.get_agent("StoreManager")
    
    if not store_manager:
        raise HTTPException(status_code=404, detail="Store Manager agent not found")
    
    suggestions = await store_manager.get_proactive_suggestions()
    
    return ProactiveSuggestionResponse(
        suggestions=suggestions,
        timestamp=datetime.now()
    )


@router.post("/whatsapp/incoming")
async def handle_whatsapp_message(message: WhatsAppIncomingMessage, store_id: int = 1):
    """
    Handle incoming WhatsApp message.
    The Customer Engagement agent will process and generate a response.
    """
    orchestrator = get_orchestrator(store_id)
    customer_agent = orchestrator.get_agent("CustomerAgent")
    
    if not customer_agent:
        raise HTTPException(status_code=404, detail="Customer Agent not found")
    
    # Create CustomerMessage
    msg = CustomerMessage(
        phone=message.phone,
        message=message.message,
        timestamp=message.timestamp or datetime.now(),
        message_type=message.message_type
    )
    
    # Process message
    response = await customer_agent.process_incoming_message(msg)
    
    return {
        "status": "processed",
        "response": response,
        "phone": message.phone,
        "timestamp": datetime.now().isoformat()
    }


@router.post("/whatsapp/campaign")
async def send_bulk_campaign(request: BulkCampaignRequest, store_id: int = 1):
    """Send a bulk marketing campaign via WhatsApp"""
    orchestrator = get_orchestrator(store_id)
    customer_agent = orchestrator.get_agent("CustomerAgent")
    
    if not customer_agent:
        raise HTTPException(status_code=404, detail="Customer Agent not found")
    
    # Prepare customer list
    customers = [{"phone": phone} for phone in request.customer_phones]
    
    # Send campaign
    results = await customer_agent.send_bulk_campaign(
        request.campaign_type,
        customers
    )
    
    return results


@router.get("/inventory/analysis")
async def get_inventory_analysis(store_id: int = 1):
    """
    Get comprehensive inventory analysis from the Inventory Agent.
    Includes stock levels, predictions, and anomalies.
    """
    orchestrator = get_orchestrator(store_id)
    inventory_agent = orchestrator.get_agent("InventoryAgent")
    
    if not inventory_agent:
        raise HTTPException(status_code=404, detail="Inventory Agent not found")
    
    # Run daily analysis
    analysis = await inventory_agent.run_daily_analysis()
    
    return analysis


@router.get("/inventory/predictions")
async def get_stock_predictions(days_ahead: int = 7, store_id: int = 1):
    """Get stock predictions for upcoming days"""
    orchestrator = get_orchestrator(store_id)
    inventory_agent = orchestrator.get_agent("InventoryAgent")
    
    if not inventory_agent:
        raise HTTPException(status_code=404, detail="Inventory Agent not found")
    
    predictions = await inventory_agent._predict_stock_needs(days_ahead)
    
    return predictions


@router.get("/inventory/reorder")
async def get_reorder_suggestions(store_id: int = 1):
    """Get optimized reorder list"""
    orchestrator = get_orchestrator(store_id)
    inventory_agent = orchestrator.get_agent("InventoryAgent")
    
    if not inventory_agent:
        raise HTTPException(status_code=404, detail="Inventory Agent not found")
    
    reorder_list = await inventory_agent._generate_reorder_list()
    
    return reorder_list


@router.get("/customer/analytics")
async def get_engagement_analytics(store_id: int = 1):
    """Get customer engagement analytics"""
    orchestrator = get_orchestrator(store_id)
    customer_agent = orchestrator.get_agent("CustomerAgent")
    
    if not customer_agent:
        raise HTTPException(status_code=404, detail="Customer Agent not found")
    
    analytics = await customer_agent.get_engagement_analytics()
    
    return analytics


# ==================== WebSocket for Real-time Updates ====================

class ConnectionManager:
    """Manage WebSocket connections"""
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, store_id: int):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, store_id: int):
        if store_id in self.active_connections:
            self.active_connections[store_id].remove(websocket)
    
    async def broadcast(self, store_id: int, message: Dict):
        if store_id in self.active_connections:
            for connection in self.active_connections[store_id]:
                await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: int):
    """
    WebSocket endpoint for real-time agent updates.
    Clients receive live updates on agent activities, alerts, and suggestions.
    """
    await manager.connect(websocket, store_id)
    
    try:
        orchestrator = get_orchestrator(store_id)
        
        while True:
            # Wait for incoming messages
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process the message based on type
            if message_data.get("type") == "query":
                # Send query to agent
                agent = orchestrator.get_agent("StoreManager")
                if agent:
                    result = await agent.process_natural_language(message_data.get("message", ""))
                    await websocket.send_json({
                        "type": "agent_response",
                        "data": result
                    })
            
            elif message_data.get("type") == "get_suggestions":
                agent = orchestrator.get_agent("StoreManager")
                if agent:
                    suggestions = await agent.get_proactive_suggestions()
                    await websocket.send_json({
                        "type": "suggestions",
                        "data": suggestions
                    })
            
            elif message_data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, store_id)
    except Exception as e:
        manager.disconnect(websocket, store_id)
        print(f"WebSocket error: {e}")
