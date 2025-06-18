import os
import asyncio
import json
import time
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import httpx
from typing import Dict, List, Optional, Any
import logging
import stripe
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import BaseModel
import hashlib
import base64


current_user_id: Optional[str] = None

class StripeCheckoutRequest(BaseModel):
    plan: str  # 'standard' or 'premium'
    user_id: str

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("server")

load_dotenv()

BASE_URL = os.getenv("BASE_URL", "http://localhost:2024")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # This is the anon key
SUPABASE_EMAIL = os.getenv("SUPABASE_EMAIL", "austinnafe@aol.com")
SUPABASE_PASSWORD = os.getenv("SUPABASE_PASSWORD", "password123")
ASSISTANT_NAME = os.getenv("ASSISTANT_NAME", "My New Assistant")
GRAPH_ID = os.getenv("GRAPH_ID", "agent")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_BASIC_PRICE_ID = os.getenv("STRIPE_BASIC_PRICE_ID")
STRIPE_PREMIUM_PRICE_ID = os.getenv("STRIPE_PREMIUM_PRICE_ID")

security = HTTPBearer()

# Cache for auth token
auth_token_cache = None
token_expiry = None

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)



# =============================================================================
# Functioms to get headers and auth token and make requests to langgraph API
# =============================================================================

# =============================================================================
async def get_supabase_auth_token():
    """Get or refresh Supabase auth token"""
    global auth_token_cache, token_expiry
    
    if auth_token_cache and token_expiry and time.time() < token_expiry:
        logger.info("Using cached auth token")
        return auth_token_cache
    
    try:
        logger.info("Generating new Supabase auth token...")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            auth_resp = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "email": SUPABASE_EMAIL,
                    "password": SUPABASE_PASSWORD
                }
            )
            
            if auth_resp.status_code != 200:
                logger.error(f"Failed to authenticate with Supabase: {auth_resp.text}")
                raise HTTPException(500, detail="Failed to authenticate with Supabase")
            
            auth_data = auth_resp.json()
            access_token = auth_data.get("access_token")
            expires_in = auth_data.get("expires_in", 3600)
            
            if not access_token:
                logger.error("No access token received from Supabase")
                raise HTTPException(500, detail="No access token received")
            
            auth_token_cache = access_token
            token_expiry = time.time() + expires_in - 300
            
            logger.info(f"Successfully generated auth token, expires in {expires_in} seconds")
            return access_token
            
    except Exception as e:
        logger.error(f"Error getting Supabase auth token: {str(e)}")
        raise HTTPException(500, detail=f"Auth error: {str(e)}")

async def get_headers():
    """Get headers with fresh auth token"""
    token = await get_supabase_auth_token()
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Cache for assistant ID
assistant_id_cache = None

async def get_or_create_assistant(client: httpx.AsyncClient) -> str:
    """Get existing assistant or create a new one if it doesn't exist"""
    global assistant_id_cache
    
    if assistant_id_cache:
        logger.info(f"Using cached assistant ID: {assistant_id_cache}")
        return assistant_id_cache

    try:
        headers = await get_headers()
        
        # Search for existing assistant
        logger.info("Searching for existing assistant...")
        search_resp = await client.post(
            f"{BASE_URL}/assistants/search",
            headers=headers,
            json={"limit": 100, "offset": 0},
            timeout=10.0
        )
        
        if search_resp.status_code != 200:
            logger.error(f"Assistant search failed: {search_resp.text}")
            raise HTTPException(500, detail=f"Assistant search failed: {search_resp.text}")

        assistants = search_resp.json()
        logger.info(f"Found {len(assistants)} assistants")
        
        # Look for assistant with matching name
        for assistant in assistants:
            if assistant.get("name") == ASSISTANT_NAME:
                assistant_id_cache = assistant["assistant_id"]
                logger.info(f"Found existing assistant: {assistant_id_cache}")
                return assistant_id_cache

        # Create a new assistant if not found
        logger.info(f"Creating new assistant '{ASSISTANT_NAME}'...")
        create_resp = await client.post(
            f"{BASE_URL}/assistants",
            headers=headers,
            json={
                "graph_id": GRAPH_ID,
                "config": {},
                "metadata": {},
                "if_exists": "do_nothing",
                "name": ASSISTANT_NAME,
                "description": "Created via FastAPI"
            },
            timeout=15.0
        )
        
        if create_resp.status_code != 200:
            logger.error(f"Failed to create assistant: {create_resp.text}")
            raise HTTPException(500, detail=f"Failed to create assistant: {create_resp.text}")
        
        assistant_id_cache = create_resp.json()["assistant_id"]
        logger.info(f"Created new assistant with ID: {assistant_id_cache}")
        return assistant_id_cache
        
    except httpx.TimeoutException:
        logger.error("Timeout connecting to LangGraph API")
        raise HTTPException(504, detail="Timeout connecting to LangGraph API")
    except Exception as e:
        logger.error(f"Error getting/creating assistant: {str(e)}")
        raise HTTPException(500, detail=f"Error: {str(e)}")

async def extract_assistant_message(thread_state) -> Optional[str]:
    """Extract the most recent assistant message from thread state"""
    logger.info(f"Extracting message from state. Keys: {list(thread_state.keys() if isinstance(thread_state, dict) else [])}")
    
    try:
        # Dump the thread state for debugging (limit to avoid huge logs)
        thread_state_str = json.dumps(thread_state)[:500]
        logger.info(f"Thread state preview: {thread_state_str}...")
        
        # FIXED: Check if thread_state is a list first
        if isinstance(thread_state, list):
            # Handle list format - common in LangGraph history responses
            for item in reversed(thread_state):
                if isinstance(item, dict) and "values" in item:
                    values = item["values"]
                    if isinstance(values, dict) and "messages" in values:
                        messages = values["messages"]
                        for msg in reversed(messages):
                            if msg.get("type") == "ai" and "content" in msg:
                                logger.info("Found message using List->Values->Messages format")
                                return msg["content"]
            return None
        
        # ORIGINAL LOGIC: Handle dict format
        if not isinstance(thread_state, dict):
            return None
            
        # Method 1: Check if messages are in the root
        if isinstance(thread_state.get("messages"), list):
            for msg in reversed(thread_state["messages"]):
                if msg.get("role") == "assistant":
                    logger.info("Found message using Method 1 (root messages)")
                    return msg.get("content")
                # Also check for LangGraph format with type="ai"
                elif msg.get("type") == "ai":
                    logger.info("Found message using Method 1 (root messages - type=ai)")
                    return msg.get("content")
        
        # Method 2: Check if values is an array with messages
        if isinstance(thread_state.get("values"), list):
            for item in reversed(thread_state["values"]):
                # Check if the item itself is a message
                if isinstance(item, dict) and item.get("role") == "assistant":
                    logger.info("Found message using Method 2a (values array with direct messages)")
                    return item.get("content")
                elif isinstance(item, dict) and item.get("type") == "ai":
                    logger.info("Found message using Method 2a (values array with direct messages - type=ai)")
                    return item.get("content")
                
                # Check if item contains messages
                if isinstance(item, dict) and isinstance(item.get("messages"), list):
                    for msg in reversed(item["messages"]):
                        if msg.get("role") == "assistant":
                            logger.info("Found message using Method 2b (values array with nested messages)")
                            return msg.get("content")
                        elif msg.get("type") == "ai":
                            logger.info("Found message using Method 2b (values array with nested messages - type=ai)")
                            return msg.get("content")
        
        # Method 3: Check if values is an object with messages
        if isinstance(thread_state.get("values"), dict):
            # Direct messages in values
            if isinstance(thread_state["values"].get("messages"), list):
                for msg in reversed(thread_state["values"]["messages"]):
                    if msg.get("role") == "assistant":
                        logger.info("Found message using Method 3 (values object with messages)")
                        return msg.get("content")
                    elif msg.get("type") == "ai":
                        logger.info("Found message using Method 3 (values object with messages - type=ai)")
                        return msg.get("content")
            
            # Try each key in values
            for key, value in thread_state["values"].items():
                if isinstance(value, list):
                    for item in reversed(value):
                        if isinstance(item, dict):
                            if item.get("role") == "assistant":
                                logger.info(f"Found message using Method 3b (values.{key})")
                                return item.get("content")
                            elif item.get("type") == "ai":
                                logger.info(f"Found message using Method 3b (values.{key} - type=ai)")
                                return item.get("content")
        
        # Method 4: Look for specific common output patterns
        if "output" in thread_state:
            output = thread_state["output"]
            # Check if output has messages
            if isinstance(output, dict) and isinstance(output.get("messages"), list):
                for msg in reversed(output["messages"]):
                    if msg.get("role") == "assistant":
                        logger.info("Found message using Method 4a (output.messages)")
                        return msg.get("content")
                    elif msg.get("type") == "ai":
                        logger.info("Found message using Method 4a (output.messages - type=ai)")
                        return msg.get("content")
            
            # Sometimes output is directly the message content
            if isinstance(output, str):
                logger.info("Found message using Method 4b (output string)")
                return output
            
            # Check if output has a content field
            if isinstance(output, dict) and "content" in output:
                logger.info("Found message using Method 4c (output.content)")
                return output["content"]
        
        logger.warning("Could not find assistant message using any method")
        return None
        
    except Exception as e:
        logger.error(f"Error extracting message: {str(e)}", exc_info=True)
        return None
# =============================================================================
# USER AUTHENTICATION HELPERS
# =============================================================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase JWT token and return user info"""
    try:
        token = credentials.credentials
        logger.info(f"Verifying token: {token[:20]}...")
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if resp.status_code != 200:
                logger.error(f"Supabase token verification failed: {resp.status_code} - {resp.text}")
                raise HTTPException(401, detail="Invalid or expired token")
            
            user_data = resp.json()
            logger.info(f"Token verified for user: {user_data.get('email')}")
            return user_data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(401, detail="Authentication failed")

async def get_current_user_optional(request: Request):
    """Get current user if token is provided, otherwise return None"""
    try:
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if resp.status_code == 200:
                return resp.json()
            return None
            
    except Exception as e:
        logger.debug(f"Optional auth check failed: {str(e)}")
        return None


async def extract_user_id_from_token(token: str) -> Optional[str]:
    """Extract user ID from Supabase JWT token without verification"""
    try:
        # Split the JWT token (header.payload.signature)
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        # Decode the payload (second part)
        payload_part = parts[1]
        
        # Add padding if needed
        missing_padding = len(payload_part) % 4
        if missing_padding:
            payload_part += '=' * (4 - missing_padding)
            
        # Decode base64
        payload_bytes = base64.urlsafe_b64decode(payload_part)
        payload = json.loads(payload_bytes)
        
        return payload.get("sub")  # Supabase puts user ID in 'sub' field
    except Exception as e:
        logger.error(f"Error extracting user ID from token: {e}")
        return None
# =============================================================================
# ADD ALL YOUR API ENDPOINTS HERE FIRST (BEFORE STATIC FILE MOUNTS)
# =======`  ========================================================================

# =============================================================================
# LANGGRAPH API ENDPOINTS (SINGLE VERSIONS ONLY)
# =============================================================================

# Add this debug endpoint to see what LangGraph is actually returning
@app.get("/api/debug/langgraph-test")
async def debug_langgraph_test():
    """Test LangGraph connectivity and response format"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_headers()
            
            # Test 1: Create a simple thread
            thread_resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
            if thread_resp.status_code != 200:
                return {"error": "Failed to create thread", "details": thread_resp.text}
            
            thread_id = thread_resp.json()["thread_id"]
            logger.info(f"Test thread created: {thread_id}")
            
            # Test 2: Get assistant
            assistant_id = await get_or_create_assistant(client)
            logger.info(f"Test assistant: {assistant_id}")
            
            # Test 3: Send a simple test message
            run_payload = {
                "assistant_id": assistant_id,
                "input": {"messages": [{"role": "user", "content": "Hello, this is a test message. Please respond with 'Test successful'."}]}
            }
            
            run_resp = await client.post(
                f"{BASE_URL}/threads/{thread_id}/runs",
                headers=headers,
                json=run_payload
            )
            
            if run_resp.status_code != 200:
                return {"error": "Failed to start run", "details": run_resp.text}
            
            run_id = run_resp.json()["run_id"]
            logger.info(f"Test run started: {run_id}")
            
            # Test 4: Wait for completion (simplified)
            for attempt in range(10):
                await asyncio.sleep(2)
                
                status_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/runs/{run_id}",
                    headers=headers
                )
                
                if status_resp.status_code == 200:
                    run_data = status_resp.json()
                    status = run_data.get("status", "unknown")
                    logger.info(f"Test run status: {status}")
                    
                    if status in ["success", "completed"]:
                        break
                    elif status == "error":
                        return {"error": "Run failed", "run_data": run_data}
            
            # Test 5: Try to get response using all methods
            debug_results = {
                "thread_id": thread_id,
                "run_id": run_id,
                "final_status": status,
                "extraction_attempts": {}
            }
            
            # Method 1: Thread state
            try:
                state_resp = await client.get(f"{BASE_URL}/threads/{thread_id}/state", headers=headers)
                if state_resp.status_code == 200:
                    thread_state = state_resp.json()
                    debug_results["extraction_attempts"]["thread_state"] = {
                        "success": True,
                        "keys": list(thread_state.keys()) if isinstance(thread_state, dict) else "not_dict",
                        "raw_data": json.dumps(thread_state)[:1000] + "..." if len(json.dumps(thread_state)) > 1000 else json.dumps(thread_state)
                    }
                    
                    # Try extraction
                    extracted = await extract_assistant_message(thread_state)
                    debug_results["extraction_attempts"]["thread_state"]["extracted_message"] = extracted
                else:
                    debug_results["extraction_attempts"]["thread_state"] = {
                        "success": False,
                        "error": state_resp.text
                    }
            except Exception as e:
                debug_results["extraction_attempts"]["thread_state"] = {
                    "success": False,
                    "error": str(e)
                }
            
            # Method 2: History
            try:
                history_resp = await client.get(f"{BASE_URL}/threads/{thread_id}/history", headers=headers)
                if history_resp.status_code == 200:
                    history_data = history_resp.json()
                    debug_results["extraction_attempts"]["history"] = {
                        "success": True,
                        "type": str(type(history_data)),
                        "raw_data": json.dumps(history_data)[:1000] + "..." if len(json.dumps(history_data)) > 1000 else json.dumps(history_data)
                    }
                else:
                    debug_results["extraction_attempts"]["history"] = {
                        "success": False,
                        "error": history_resp.text
                    }
            except Exception as e:
                debug_results["extraction_attempts"]["history"] = {
                    "success": False,
                    "error": str(e)
                }
            
            # Method 3: Run result
            try:
                result_resp = await client.get(f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/result", headers=headers)
                if result_resp.status_code == 200:
                    result_data = result_resp.json()
                    debug_results["extraction_attempts"]["run_result"] = {
                        "success": True,
                        "raw_data": json.dumps(result_data)[:1000] + "..." if len(json.dumps(result_data)) > 1000 else json.dumps(result_data)
                    }
                else:
                    debug_results["extraction_attempts"]["run_result"] = {
                        "success": False,
                        "error": result_resp.text
                    }
            except Exception as e:
                debug_results["extraction_attempts"]["run_result"] = {
                    "success": False,
                    "error": str(e)
                }
            
            return debug_results
            
    except Exception as e:
        return {"error": f"Debug test failed: {str(e)}"}


@app.post("/api/langgraph/thread")
async def create_thread():
    """Create a new thread"""
    try:
        logger.info("Creating new thread...")
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_headers()
            resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
            if resp.status_code != 200:
                logger.error(f"Failed to create thread: {resp.text}")
                raise HTTPException(500, detail=f"LangGraph error: {resp.text}")
            return resp.json()
    except httpx.TimeoutException:
        logger.error("Timeout creating thread")
        raise HTTPException(504, detail="Timeout connecting to LangGraph API")
    except Exception as e:
        logger.error(f"Error creating thread: {e}")
        raise HTTPException(500, detail=str(e))



@app.post("/api/langgraph/chat")
async def langgraph_chat(request: Request):
    """Send a message and get a response"""
    global current_user_id
    
    try:
        body = await request.json()
        user_message = body.get("message", "").strip()
        thread_id = body.get("thread_id")

        # SIMPLE USER AUTHENTICATION - ADD THESE 7 LINES
        current_user_id = None
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            current_user_id = await extract_user_id_from_token(token)
            if current_user_id:
                os.environ["CURRENT_USER_ID"] = current_user_id

        if not user_message:
            raise HTTPException(400, detail="No message provided")

        logger.info(f"Processing chat request: thread_id={thread_id}, message={user_message[:20]}...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = await get_headers()
            
            # Create a new thread if one wasn't provided
            if not thread_id:
                logger.info("No thread_id provided, creating new thread")
                resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
                
                if resp.status_code != 200:
                    logger.error(f"Failed to create thread: {resp.text}")
                    raise HTTPException(500, detail=f"Could not create thread: {resp.text}")
                
                thread_id = resp.json()["thread_id"]
                logger.info(f"Created new thread: {thread_id}")
            else:
                # Verify the thread exists
                check_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/state", 
                    headers=headers
                )
                
                if check_resp.status_code == 404:
                    logger.warning(f"Thread {thread_id} not found, creating new thread")
                    resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
                    thread_id = resp.json()["thread_id"]
                    logger.info(f"Created new thread: {thread_id}")
                # Get or create assistant
                assistant_id = await get_or_create_assistant(client)

                # Start a run (inject current_user_id just for this tool invocation)
                logger.info(f"Starting run with assistant {assistant_id} on thread {thread_id}")
                if current_user_id:
                    # prepend a one-off system message carrying the user id
                    run_payload = {
                        "assistant_id": assistant_id,
                        "input": {
                            "messages": [
                                {
                                    "role": "system",
                                    "content": f"TOOL_CALL_CONTEXT: current_user_id={current_user_id}"
                                },
                                {"role": "user", "content": user_message}
                            ]
                        }
                    }
                else:
                    run_payload = {
                        "assistant_id": assistant_id,
                        "input": {"messages": [{"role": "user", "content": user_message}]}
                    }

                run_resp = await client.post(
                    f"{BASE_URL}/threads/{thread_id}/runs",
                    headers=headers,
                    json=run_payload
                )

            
            
            if run_resp.status_code != 200:
                logger.error(f"Run failed: {run_resp.text}")
                raise HTTPException(500, detail=f"Run failed: {run_resp.text}")
            
            run_id = run_resp.json()["run_id"]
            logger.info(f"Started run: {run_id}")

            # Try the wait endpoint first (if available in your LangGraph API)
            try:
                logger.info(f"Trying wait endpoint for run {run_id}")
                wait_resp = await client.post(
                    f"{BASE_URL}/threads/{thread_id}/runs/wait",
                    headers=headers,
                    json={"run_id": run_id},
                    timeout=30.0
                )
                
                if wait_resp.status_code == 200:
                    logger.info("Wait endpoint successful")
                    wait_data = wait_resp.json()
                    
                    # Try to extract message from wait response
                    assistant_message = await extract_assistant_message(wait_data)
                    if assistant_message:
                        logger.info("Found message in wait response")
                        return {
                            "response": assistant_message,
                            "thread_id": thread_id,
                            "status": "completed"
                        }
            except Exception as e:
                logger.info(f"Wait endpoint failed or not available: {str(e)}")
                # Continue with polling method
            
            # Poll for run completion
            max_attempts = 30
            attempt = 0
            
            while attempt < max_attempts:
                attempt += 1
                logger.info(f"Checking run status (attempt {attempt}/{max_attempts})")
                
                run_check = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/runs/{run_id}",
                    headers=headers
                )
                
                if run_check.status_code != 200:
                    logger.warning(f"Failed to check run status: {run_check.text}")
                    await asyncio.sleep(2)
                    continue
                
                run_data = run_check.json()
                status = run_data.get("status", "unknown")
                logger.info(f"Run status: {status}")
                
                if status in ["success", "completed"]:
                    logger.info(f"Run completed with status: {status}")
                    break
                elif status in ["error", "failed", "cancelled", "expired"]:
                    error_msg = run_data.get("error", f"Run failed with status: {status}")
                    logger.error(f"Run failed: {error_msg}")
                    raise HTTPException(500, detail=error_msg)
                
                await asyncio.sleep(2)
            
            if attempt >= max_attempts:
                logger.warning("Max attempts reached waiting for run to complete")
                raise HTTPException(504, detail="Timeout waiting for assistant response")

            # Try different methods to get the response in order of preference
            
            # Method 1: Get thread state (most reliable)
            logger.info(f"Getting thread state for {thread_id}")
            try:
                state_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/state",
                    headers=headers
                )
                
                if state_resp.status_code == 200:
                    thread_state = state_resp.json()
                    assistant_message = await extract_assistant_message(thread_state)
                    
                    if assistant_message:
                        logger.info(f"Found message in thread state: {assistant_message[:50]}...")
                        return {
                            "response": assistant_message,
                            "thread_id": thread_id,
                            "status": "completed"
                        }
                else:
                    logger.warning(f"Failed to get thread state: {state_resp.text}")
            except Exception as e:
                logger.warning(f"Error getting thread state: {str(e)}")
            
            # Method 2: Get latest message from history
            logger.info(f"Getting message history for thread {thread_id}")
            try:
                history_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/history",
                    headers=headers
                )
                
                if history_resp.status_code == 200:
                    history_data = history_resp.json()
                    logger.info(f"Got history data type: {type(history_data)}")
                    
                    assistant_message = await extract_assistant_message(history_data)
                    if assistant_message:
                        logger.info("Found message in history")
                        return {
                            "response": assistant_message,
                            "thread_id": thread_id,
                            "status": "completed"
                        }
                else:
                    logger.warning(f"Failed to get history: {history_resp.text}")
            except Exception as e:
                logger.warning(f"Failed to get message from history: {str(e)}")
            
            # Method 3: Try to get run results directly
            logger.info(f"Getting run result for {run_id}")
            try:
                run_result_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/result",
                    headers=headers
                )
                
                if run_result_resp.status_code == 200:
                    run_result = run_result_resp.json()
                    logger.info(f"Got run result: {type(run_result)}")
                    
                    assistant_message = await extract_assistant_message(run_result)
                    if assistant_message:
                        logger.info("Found message in run result")
                        return {
                            "response": assistant_message,
                            "thread_id": thread_id,
                            "status": "completed"
                        }
                else:
                    logger.warning(f"Failed to get run result: {run_result_resp.text}")
            except Exception as e:
                logger.warning(f"Failed to get message from run result: {str(e)}")
            
            # Fallback response if no message was found
            logger.error("Could not find assistant message through any method")
            return {
                "response": "I processed your message, but couldn't retrieve my response. Please try again.",
                "thread_id": thread_id,
                "status": "completed_with_issues"
            }
            
    except httpx.TimeoutException:
        logger.error("Timeout waiting for response from LangGraph API")
        raise HTTPException(504, detail="Timeout waiting for assistant response")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(500, detail=str(e))
    finally:
        # Clean up environment variable
        if "CURRENT_USER_ID" in os.environ:
            del os.environ["CURRENT_USER_ID"]

async def debug_langgraph_response(thread_id: str, run_id: str):
    """Debug endpoint to see raw LangGraph responses"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_headers()
            
            debug_data = {
                "thread_id": thread_id,
                "run_id": run_id,
                "responses": {}
            }
            
            # Try all possible endpoints
            endpoints = {
                "thread_state": f"{BASE_URL}/threads/{thread_id}/state",
                "thread_history": f"{BASE_URL}/threads/{thread_id}/history", 
                "run_status": f"{BASE_URL}/threads/{thread_id}/runs/{run_id}",
                "run_result": f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/result"
            }
            
            for name, url in endpoints.items():
                try:
                    resp = await client.get(url, headers=headers)
                    debug_data["responses"][name] = {
                        "status_code": resp.status_code,
                        "data": resp.json() if resp.status_code == 200 else resp.text
                    }
                except Exception as e:
                    debug_data["responses"][name] = {
                        "error": str(e)
                    }
            
            return debug_data
            
    except Exception as e:
        return {"error": f"Debug failed: {str(e)}"}
@app.get("/api/langgraph/thread/{thread_id}/exists")
async def check_thread_exists(thread_id: str):
    """Check if a thread exists"""
    try:
        logger.info(f"Checking if thread exists: {thread_id}")
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_headers()
            resp = await client.get(
                f"{BASE_URL}/threads/{thread_id}/state", 
                headers=headers
            )
            
            if resp.status_code == 200:
                return {"exists": True, "thread_id": thread_id}
            elif resp.status_code == 404:
                return {"exists": False, "thread_id": thread_id}
            else:
                logger.warning(f"Unexpected status checking thread: {resp.status_code}")
                return {"exists": False, "thread_id": thread_id, "error": resp.text}
                
    except Exception as e:
        logger.error(f"Error checking thread: {str(e)}")
        return {"exists": False, "thread_id": thread_id, "error": str(e)}


    """Send a message and get a response"""
    try:
        body = await request.json()
        user_message = body.get("message", "").strip()
        thread_id = body.get("thread_id")

        if not user_message:
            raise HTTPException(400, detail="No message provided")

        logger.info(f"Processing chat request: thread_id={thread_id}, message={user_message[:20]}...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = await get_headers()
            
            # Create a new thread if one wasn't provided
            if not thread_id:
                logger.info("No thread_id provided, creating new thread")
                resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
                
                if resp.status_code != 200:
                    logger.error(f"Failed to create thread: {resp.text}")
                    raise HTTPException(500, detail=f"Could not create thread: {resp.text}")
                
                thread_id = resp.json()["thread_id"]
                logger.info(f"Created new thread: {thread_id}")
            else:
                # Verify the thread exists
                check_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/state", 
                    headers=headers
                )
                
                if check_resp.status_code == 404:
                    logger.warning(f"Thread {thread_id} not found, creating new thread")
                    resp = await client.post(f"{BASE_URL}/threads", headers=headers, json={})
                    thread_id = resp.json()["thread_id"]
                    logger.info(f"Created new thread: {thread_id}")

            # Add user message to thread history
            logger.info(f"Adding user message to thread {thread_id}")
            history_resp = await client.post(
                f"{BASE_URL}/threads/{thread_id}/history",
                headers=headers,
                json={"role": "user", "content": user_message}
            )
            
            if history_resp.status_code != 200:
                logger.warning(f"Failed to add message to history: {history_resp.text}")
                # Continue anyway, as the run input will include the message

            # Get or create assistant
            assistant_id = await get_or_create_assistant(client)
            
            # Start a run
            logger.info(f"Starting run with assistant {assistant_id} on thread {thread_id}")
            run_payload = {
                "assistant_id": assistant_id,
                "input": {"messages": [{"role": "user", "content": user_message}]}
            }

            run_resp = await client.post(
                f"{BASE_URL}/threads/{thread_id}/runs",
                headers=headers,
                json=run_payload
            )
            
            if run_resp.status_code != 200:
                logger.error(f"Run failed: {run_resp.text}")
                raise HTTPException(500, detail=f"Run failed: {run_resp.text}")
            
            run_id = run_resp.json()["run_id"]
            logger.info(f"Started run: {run_id}")

            # Try the wait endpoint first (if available in your LangGraph API)
            try:
                logger.info(f"Trying wait endpoint for run {run_id}")
                wait_resp = await client.post(
                    f"{BASE_URL}/threads/{thread_id}/runs/wait",
                    headers=headers,
                    json={"run_id": run_id},
                    timeout=30.0
                )
                
                if wait_resp.status_code == 200:
                    logger.info("Wait endpoint successful")
                    wait_data = wait_resp.json()
                    
                    # Try to extract message from wait response
                    if isinstance(wait_data, dict) and isinstance(wait_data.get("messages"), list):
                        for msg in reversed(wait_data["messages"]):
                            if msg.get("role") == "assistant":
                                logger.info("Found message in wait response")
                                return {
                                    "response": msg.get("content"),
                                    "thread_id": thread_id,
                                    "status": "completed"
                                }
            except Exception as e:
                logger.info(f"Wait endpoint failed or not available: {str(e)}")
                # Continue with polling method
            
            # Poll for run completion
            max_attempts = 30
            attempt = 0
            
            while attempt < max_attempts:
                attempt += 1
                logger.info(f"Checking run status (attempt {attempt}/{max_attempts})")
                
                run_check = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/runs/{run_id}",
                    headers=headers
                )
                
                if run_check.status_code != 200:
                    logger.warning(f"Failed to check run status: {run_check.text}")
                    await asyncio.sleep(2)
                    continue
                
                run_data = run_check.json()
                status = run_data.get("status", "unknown")
                logger.info(f"Run status: {status}")
                
                if status in ["success", "completed"]:  # Accept both statuses
                    logger.info(f"Run completed with status: {status}")
                    break
                elif status in ["error", "failed", "cancelled", "expired"]:
                    logger.error(f"Run failed with status: {status}")
                    raise HTTPException(500, detail=f"Run failed with status: {status}")
                else:
                    logger.info(f"Run still in progress, status: {status}")  # Add this for debuggingption(500, detail=f"Run failed: {run_data.get('error', 'Unknown error')}")
                
                await asyncio.sleep(2)
            
            if attempt >= max_attempts:
                logger.warning("Max attempts reached waiting for run to complete")
                raise HTTPException(504, detail="Timeout waiting for assistant response")

            # Try different methods to get the response
            
            # Method 1: Get latest message from history
            logger.info(f"Getting message history for thread {thread_id}")
            try:
                history_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/history",
                    headers=headers
                )
                
                if history_resp.status_code == 200:
                    history_data = history_resp.json()
                    logger.info(f"Got history data type: {type(history_data)}")
                    
                    # Handle different response formats
                    if isinstance(history_data, list):
                        # Look for the latest assistant message
                        assistant_messages = []
                        
                        # Process each block
                        for block in history_data:
                            if isinstance(block.get("values"), list):
                                for val in block["values"]:
                                    if val.get("role") == "assistant":
                                        assistant_messages.append(val)
                        
                        # Get the latest message
                        if assistant_messages:
                            latest_msg = assistant_messages[-1]
                            logger.info("Found message in history")
                            return {
                                "response": latest_msg.get("content"),
                                "thread_id": thread_id,
                                "status": "completed"
                            }
                    
                    elif isinstance(history_data, dict) and "messages" in history_data:
                        # Look for the latest assistant message
                        for msg in reversed(history_data["messages"]):
                            if msg.get("role") == "assistant":
                                logger.info("Found message in history dict")
                                return {
                                    "response": msg.get("content"),
                                    "thread_id": thread_id,
                                    "status": "completed"
                                }
            except Exception as e:
                logger.warning(f"Failed to get message from history: {str(e)}")
                # Continue with other methods
            
            # Method 2: Get thread state
            logger.info(f"Getting thread state for {thread_id}")
            state_resp = await client.get(
                f"{BASE_URL}/threads/{thread_id}/state",
                headers=headers
            )
            
            if state_resp.status_code != 200:
                logger.error(f"Failed to get thread state: {state_resp.text}")
                raise HTTPException(500, detail=f"Failed to get thread state: {state_resp.text}")
            
            thread_state = state_resp.json()
            assistant_message = await extract_assistant_message(thread_state)
            
            if assistant_message:
                logger.info(f"Found message in thread state: {assistant_message[:50]}...")
                return {
                    "response": assistant_message,
                    "thread_id": thread_id,
                    "status": "completed"
                }
            
            # Method 3: Try to get run results directly
            logger.info(f"Getting run result for {run_id}")
            try:
                run_result_resp = await client.get(
                    f"{BASE_URL}/threads/{thread_id}/runs/{run_id}/result",
                    headers=headers
                )
                
                if run_result_resp.status_code == 200:
                    run_result = run_result_resp.json()
                    logger.info(f"Got run result: {type(run_result)}")
                    
                    # Try to extract message
                    if isinstance(run_result, dict):
                        # Check for common result patterns
                        if "content" in run_result:
                            logger.info("Found message in run result (content)")
                            return {
                                "response": run_result["content"],
                                "thread_id": thread_id,
                                "status": "completed"
                            }
                        elif "message" in run_result:
                            logger.info("Found message in run result (message)")
                            return {
                                "response": run_result["message"],
                                "thread_id": thread_id,
                                "status": "completed"
                            }
                        elif "output" in run_result:
                            output = run_result["output"]
                            if isinstance(output, str):
                                logger.info("Found message in run result (output string)")
                                return {
                                    "response": output,
                                    "thread_id": thread_id,
                                    "status": "completed"
                                }
                            elif isinstance(output, dict) and "content" in output:
                                logger.info("Found message in run result (output.content)")
                                return {
                                    "response": output["content"],
                                    "thread_id": thread_id,
                                    "status": "completed"
                                }
            except Exception as e:
                logger.warning(f"Failed to get message from run result: {str(e)}")
                # Continue with fallback
            
            # Fallback response if no message was found
            logger.warning("Could not find assistant message through any method")
            return {
                "response": "I processed your message, but couldn't retrieve my response. Please try again.",
                "thread_id": thread_id,
                "status": "completed_with_issues"
            }
            
    except httpx.TimeoutException:
        logger.error("Timeout waiting for response from LangGraph API")
        raise HTTPException(504, detail="Timeout waiting for assistant response")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(500, detail=str(e))
@app.get("/api/langgraph/history")
async def get_history(thread_id: str):
    """Get conversation history for a thread"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = await get_headers()
            
            # First check if thread exists
            thread_check = await client.get(
                f"{BASE_URL}/threads/{thread_id}/state", 
                headers=headers
            )
            
            if thread_check.status_code == 404:
                logger.info(f"Thread {thread_id} not found")
                return {"thread_id": thread_id, "messages": [], "exists": False}
            
            # Get history
            resp = await client.get(
                f"{BASE_URL}/threads/{thread_id}/history", 
                headers=headers
            )
            
            if resp.status_code == 404:
                # No history yet
                return {"thread_id": thread_id, "messages": [], "exists": True}
            elif resp.status_code != 200:
                logger.error(f"History request failed: {resp.text}")
                raise HTTPException(500, detail=resp.text)
            
            data = resp.json()
            messages = []
            
            if isinstance(data, list):
                for block in data:
                    for val in block.get("values", []):
                        if isinstance(val, dict) and "role" in val and "content" in val:
                            messages.append({
                                "role": val["role"], 
                                "content": val["content"]
                            })
            
            return {
                "thread_id": thread_id, 
                "messages": messages,
                "exists": True
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(500, detail=str(e))

@app.delete("/api/langgraph/thread/{thread_id}")
async def delete_thread(thread_id: str):
    """Delete a thread"""
    try:
        logger.info(f"Deleting thread: {thread_id}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = await get_headers()
            resp = await client.delete(
                f"{BASE_URL}/threads/{thread_id}", 
                headers=headers
            )
            
            if resp.status_code not in [200, 204, 404]:
                logger.error(f"Failed to delete thread: {resp.text}")
                raise HTTPException(500, detail=resp.text)
            
            return {"thread_id": thread_id, "status": "deleted"}
            
    except Exception as e:
        logger.error(f"Error deleting thread: {str(e)}")
        raise HTTPException(500, detail=str(e))

# =============================================================================
# AUTH ENDPOINTS (SINGLE VERSIONS ONLY)
# =============================================================================

@app.get("/api/auth/user")
async def get_user_info(user=Depends(get_current_user)):
    """Get current user info from Supabase token"""
    try:
        logger.info(f"Getting user info for: {user.get('email')}")
        return {
            "success": True,
            "user": {
                "id": user.get("id"),
                "email": user.get("email"),
                "full_name": user.get("user_metadata", {}).get("full_name", ""),
                "created_at": user.get("created_at"),
                "last_sign_in_at": user.get("last_sign_in_at"),
                "email_confirmed_at": user.get("email_confirmed_at"),
                "phone": user.get("phone"),
                "user_metadata": user.get("user_metadata", {})
            }
        }
    except Exception as e:
        logger.error(f"Error getting user info: {str(e)}")
        raise HTTPException(500, detail="Failed to get user information")

@app.post("/api/auth/verify-token")
async def verify_token(request: Request):
    """Verify if a Supabase token is valid"""
    try:
        body = await request.json()
        token = body.get("token")
        
        if not token:
            raise HTTPException(400, detail="Token required")
        
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if resp.status_code == 200:
                user_data = resp.json()
                return {
                    "valid": True,
                    "user": {
                        "id": user_data.get("id"),
                        "email": user_data.get("email"),
                        "full_name": user_data.get("user_metadata", {}).get("full_name", "")
                    }
                }
            else:
                return {"valid": False, "error": "Invalid token"}
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(500, detail="Token verification failed")

@app.post("/api/auth/signout")
async def signout(user=Depends(get_current_user)):
    """Sign out user (Supabase handles this client-side, but we can log it)"""
    try:
        logger.info(f"User signing out: {user.get('email')}")
        return {"success": True, "message": "Signed out successfully"}
    except Exception as e:
        logger.error(f"Signout error: {str(e)}")
        return {"success": True, "message": "Signed out"}

# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@app.get("/api/health")
async def health_check():
    """Check API health"""
    try:
        start_time = time.time()
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = await get_headers()
            resp = await client.get(f"{BASE_URL}/health", headers=headers)
            elapsed = time.time() - start_time
            
            status = "healthy" if resp.status_code == 200 else "degraded"
            return {
                "status": status, 
                "langgraph_api": status,
                "response_time_ms": round(elapsed * 1000)
            }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "langgraph_api": "unhealthy", "error": str(e)}

@app.get("/api/test/json-test")
def test_json():
    import json  # Force import here
    test_data = {"message": "JSON is working", "test": True}
    return test_data  # FastAPI auto-converts to JSON

# =============================================================================
# DOCUMENTS ENDPOINTS  
# =============================================================================

def get_app_directory():
    """Get the application directory, works on both local and Render"""
    app_dir = Path(__file__).parent.resolve()
    logger.info(f"Detected app directory: {app_dir}")
    return app_dir

APP_DIR = get_app_directory()

POSSIBLE_DOC_PATHS = [
    APP_DIR / "static" / "documents",
    APP_DIR / "documents",
    APP_DIR / "static",
    APP_DIR,
    Path("/opt/render/project/src/backend/static/documents"),
    Path("/opt/render/project/src/backend/documents"),
    Path("/opt/render/project/src/static/documents"),
    Path(os.getcwd()) / "static" / "documents",
    Path(os.getcwd()) / "documents",
    Path(os.getcwd()),
]

@app.get("/api/documents/static")
async def list_static_documents():
    """List all static documents available for Q&A - Render compatible"""
    try:
        logger.info("=== DOCUMENTS DEBUG ===")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"App directory: {APP_DIR}")
        logger.info(f"Environment: {os.environ.get('RENDER', 'local')}")
        
        documents = []
        found_paths = []
        
        for i, doc_path in enumerate(POSSIBLE_DOC_PATHS):
            logger.info(f"[{i+1}] Checking: {doc_path}")
            
            try:
                if doc_path.exists():
                    logger.info(f"  ✅ Path exists: {doc_path}")
                    
                    if doc_path.is_dir():
                        all_files = list(doc_path.iterdir())
                        logger.info(f"  📁 Directory contains {len(all_files)} items")
                        
                        doc_files = [f for f in all_files if f.is_file() and f.suffix.lower() in 
                                   ['.pdf', '.docx', '.txt', '.doc', '.xlsx', '.pptx', '.md', '.json']]
                        
                        if doc_files:
                            logger.info(f"  📄 Found {len(doc_files)} document files")
                            found_paths.append(str(doc_path))
                            
                            for file_path in doc_files:
                                try:
                                    file_size = file_path.stat().st_size
                                    documents.append({
                                        "filename": file_path.name,
                                        "file_size": file_size,
                                        "file_type": file_path.suffix,
                                        "type": "static",
                                        "path": str(file_path),
                                        "relative_path": str(file_path.relative_to(APP_DIR)) if APP_DIR in file_path.parents else str(file_path)
                                    })
                                    logger.info(f"    📄 {file_path.name} ({file_size} bytes)")
                                except Exception as e:
                                    logger.error(f"    ❌ Error reading {file_path}: {e}")
                        else:
                            other_files = [f.name for f in all_files if f.is_file()][:5]
                            logger.info(f"  📂 No docs, but found other files: {other_files}")
                    
                    elif doc_path.is_file():
                        if doc_path.suffix.lower() in ['.pdf', '.docx', '.txt', '.doc', '.xlsx', '.pptx', '.md']:
                            file_size = doc_path.stat().st_size
                            documents.append({
                                "filename": doc_path.name,
                                "file_size": file_size,
                                "file_type": doc_path.suffix,
                                "type": "static",
                                "path": str(doc_path)
                            })
                            found_paths.append(str(doc_path))
                            logger.info(f"  📄 Single document: {doc_path.name}")
                else:
                    logger.info(f"  ❌ Path does not exist: {doc_path}")
                    
            except Exception as e:
                logger.error(f"  💥 Error checking path {doc_path}: {e}")
        
        if documents:
            logger.info(f"✅ SUCCESS: Found {len(documents)} documents")
            return {
                "success": True,
                "documents": documents,
                "total": len(documents),
                "message": f"Found {len(documents)} documents",
                "found_paths": found_paths,
                "environment": "render" if os.environ.get('RENDER') else "local"
            }
        
        # No documents found - provide mock data
        logger.warning("❌ No documents found, providing mock data")
        
        mock_documents = [
            {
                "filename": "Real_Estate_Purchase_Agreement.pdf",
                "file_size": 156789,
                "file_type": ".pdf",
                "type": "mock",
                "content_preview": "Standard real estate purchase agreement template"
            },
            {
                "filename": "Property_Disclosure_Statement.docx", 
                "file_size": 89456,
                "file_type": ".docx",
                "type": "mock",
                "content_preview": "Required property disclosure form"
            },
            {
                "filename": "Market_Analysis_Q2_2025.xlsx",
                "file_size": 234567,
                "file_type": ".xlsx", 
                "type": "mock",
                "content_preview": "Current market trends and analysis"
            }
        ]
        
        return {
            "success": True,
            "documents": mock_documents,
            "total": len(mock_documents),
            "message": "Using mock documents (no static files found)",
            "debug_info": {
                "environment": "render" if os.environ.get('RENDER') else "local",
                "working_directory": os.getcwd(),
                "app_directory": str(APP_DIR),
                "paths_searched": [str(p) for p in POSSIBLE_DOC_PATHS]
            }
        }
        
    except Exception as e:
        logger.error(f"Error in documents endpoint: {str(e)}")
        return {
            "success": False,
            "documents": [],
            "total": 0,
            "error": str(e),
            "message": "Error accessing documents"
        }


# =============================================================================
# STRIPE PAYMENT ENDPOINTS - CLEAN VERSION
# =============================================================================

# Validate Stripe configuration on startup
if not stripe.api_key:
    logger.error("❌ STRIPE_SECRET_KEY is not set! Check your .env file or Render environment variables.")
else:
    logger.info(f"✅ Stripe API key configured: {stripe.api_key[:10]}...")
    
    # Test basic Stripe connectivity
    try:
        test_result = stripe.Customer.list(limit=1)
        logger.info("✅ Stripe API connection successful")
    except Exception as e:
        logger.error(f"❌ Stripe API test failed: {e}")

@app.post("/api/stripe/create-checkout")
async def create_stripe_checkout(
    request_data: StripeCheckoutRequest,
    fastapi_request: Request,
    user=Depends(get_current_user)
):
    """Create Stripe checkout session with detailed debugging"""
    
    # Log that we reached the endpoint
    logger.info("🚀 STRIPE CHECKOUT ENDPOINT REACHED!")
    logger.info(f"📥 Request data: {request_data.dict()}")
    logger.info(f"👤 User: {user.get('email', 'no email')}")
    
    try:
        # Step 1: Basic validation
        logger.info("🔍 Step 1: Basic validation")
        if not stripe.api_key:
            logger.error("❌ STRIPE_SECRET_KEY not configured")
            return {
                "success": False,
                "error": "Stripe not configured", 
                "step": "validation"
            }

        # Step 2: User authorization
        logger.info("🔍 Step 2: User authorization")
        if user.get("id") != request_data.user_id:
            logger.error(f"❌ Auth mismatch: {user.get('id')} vs {request_data.user_id}")
            return {
                "success": False,
                "error": "Not authorized", 
                "step": "auth"
            }

        user_email = user.get("email")
        if not user_email:
            logger.error("❌ No user email")
            return {
                "success": False,
                "error": "No user email", 
                "step": "email"
            }

        # Step 3: Plan validation
        logger.info("🔍 Step 3: Plan validation")
        plan_config = {
            "standard": {"price": 24900, "name": "SelfNVest Marketing Kit"},
            "premium": {"price": 99900, "name": "Premium Package"}
        }
        
        if request_data.plan not in plan_config:
            logger.error(f"❌ Invalid plan: {request_data.plan}")
            return {
                "success": False,
                "error": f"Invalid plan: {request_data.plan}", 
                "step": "plan"
            }
        
        plan_info = plan_config[request_data.plan]
        logger.info(f"✅ Plan validated: {plan_info}")

        # Step 4: Test Stripe connectivity
        logger.info("🔍 Step 4: Testing Stripe connectivity")
        try:
            test_customers = stripe.Customer.list(limit=1)
            logger.info(f"✅ Stripe test successful: {len(test_customers.data)} customers")
        except Exception as e:
            logger.error(f"❌ Stripe test failed: {e}")
            return {
                "success": False,
                "error": f"Stripe connection failed: {str(e)}", 
                "step": "stripe_test"
            }

        # Step 5: Build URLs
        logger.info("🔍 Step 5: Building URLs")
        base_url = f"{fastapi_request.url.scheme}://{fastapi_request.url.netloc}"
        success_url = f"{base_url}/pages/success.html?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{base_url}/pages/pricing.html?cancelled=true"
        logger.info(f"✅ URLs built: success={success_url}, cancel={cancel_url}")

        # Step 6: Create checkout session
        logger.info("🔍 Step 6: Creating checkout session")
        checkout_payload = {
            "payment_method_types": ["card"],
            "line_items": [{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": plan_info["name"],
                        "description": f"SelfNVest {request_data.plan.title()} Plan"
                    },
                    "unit_amount": plan_info["price"],
                },
                "quantity": 1,
            }],
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "user_id": request_data.user_id,
                "user_email": user_email,
                "plan": request_data.plan,
                "plan_name": plan_info["name"]
            }
        }

        logger.info(f"📋 Checkout payload created")
        
        session = stripe.checkout.Session.create(**checkout_payload)
        logger.info(f"✅ Session created: {session.id}")
        
        # Step 7: Return response
        response_data = {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id,
            "plan": request_data.plan,
            "amount": plan_info["price"],
            "debug": "All steps completed successfully"
        }
        
        logger.info(f"🎯 FINAL RESPONSE: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"💥 UNEXPECTED ERROR: {str(e)}", exc_info=True)
        
        # Return error in JSON format
        error_response = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "debug": "Exception occurred"
        }
        
        logger.info(f"🚨 ERROR RESPONSE: {error_response}")
        return error_response

@app.get("/api/stripe/simple-test")
async def simple_stripe_test():
    """Simple test to verify JSON responses work"""
    logger.info("🧪 Simple test endpoint called")
    
    try:
        if not stripe.api_key:
            return {"success": False, "error": "No Stripe key"}
        
        return {
            "success": True,
            "message": "Simple test passed",
            "stripe_configured": bool(stripe.api_key),
            "key_prefix": stripe.api_key[:10] if stripe.api_key else None
        }
    except Exception as e:
        logger.error(f"Simple test error: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/auth/test")
async def test_auth(user=Depends(get_current_user)):
    """Test authentication"""
    logger.info("🔐 Auth test endpoint called")
    
    return {
        "success": True,
        "user_id": user.get("id"),
        "user_email": user.get("email"),
        "message": "Authentication working"
    }

@app.get("/api/stripe/test-config")
async def test_stripe_config():
    """Test Stripe configuration and connectivity"""
    try:
        if not stripe.api_key:
            return {
                "success": False,
                "error": "No Stripe API key configured",
                "details": "Set STRIPE_SECRET_KEY in environment variables"
            }
        
        # Test basic Stripe API call
        test_customers = stripe.Customer.list(limit=1)
        
        key_type = "unknown"
        if stripe.api_key.startswith('sk_test_'):
            key_type = "test"
        elif stripe.api_key.startswith('sk_live_'):
            key_type = "live"
        
        return {
            "success": True,
            "message": "Stripe configuration working",
            "key_type": key_type,
            "api_key_prefix": stripe.api_key[:10] + "...",
            "customers_count": len(test_customers.data),
            "test_result": "API call successful"
        }
        
    except stripe.error.StripeError as e:
        return {
            "success": False,
            "error": f"Stripe API error: {str(e)}",
            "error_type": type(e).__name__
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Configuration error: {str(e)}"
        }

@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        logger.info("Received Stripe webhook")
        
        # Verify webhook signature if secret is available
        if STRIPE_WEBHOOK_SECRET:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            except ValueError as e:
                logger.error(f"Invalid payload: {e}")
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Invalid signature: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # For development - parse JSON directly
            event = json.loads(payload.decode('utf-8'))
            logger.warning("No webhook secret - skipping signature verification")
        
        logger.info(f"Webhook event type: {event['type']}")
        
        # Handle successful payment
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            # Get user info from metadata
            user_id = session['metadata'].get('user_id')
            user_email = session['metadata'].get('user_email')
            plan = session['metadata'].get('plan')
            plan_name = session['metadata'].get('plan_name')
            
            logger.info(f"Payment completed for user {user_email} (ID: {user_id}), plan: {plan}")
            
            # Update user subscription
            try:
                await update_user_subscription(user_id, plan, session)
                logger.info(f"✅ Successfully updated user {user_id} to {plan} tier")
            except Exception as e:
                logger.error(f"❌ Failed to update user subscription: {str(e)}")
        
        elif event['type'] == 'payment_intent.payment_failed':
            logger.warning(f"Payment failed: {event['data']['object']['id']}")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def update_user_subscription(user_id: str, plan: str, stripe_session):
    """Update user subscription status in Supabase"""
    try:
        SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not SUPABASE_SERVICE_ROLE_KEY:
            logger.error("Missing SUPABASE_SERVICE_ROLE_KEY")
            return False
        
        subscription_data = {
            'subscription_plan': plan,
            'subscription_status': 'active',
            'subscription_tier': plan,
            'stripe_customer_id': stripe_session.get('customer'),
            'stripe_session_id': stripe_session['id'],
            'payment_date': datetime.utcnow().isoformat(),
            'amount_paid': stripe_session.get('amount_total', 0) / 100
        }
        
        # Update user metadata via Supabase Admin API
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers={
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "user_metadata": subscription_data
                }
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Successfully updated user {user_id} subscription")
                return True
            else:
                logger.error(f"❌ Failed to update user metadata: {response.status_code} - {response.text}")
                return False
            
    except Exception as e:
        logger.error(f"❌ Error updating user subscription: {str(e)}")
        return False

@app.get("/api/user/subscription/{user_id}")
async def get_user_subscription(user_id: str, user=Depends(get_current_user)):
    """Get user's current subscription status"""
    try:
        # Verify authorization
        if user.get("id") != user_id:
            raise HTTPException(403, detail="Not authorized for this user")
        
        # Get subscription info from user metadata
        user_metadata = user.get("user_metadata", {})
        
        return {
            "user_id": user_id,
            "subscription_status": user_metadata.get("subscription_status", "none"),
            "subscription_plan": user_metadata.get("subscription_plan", "none"),
            "subscription_tier": user_metadata.get("subscription_tier", "free"),
            "stripe_customer_id": user_metadata.get("stripe_customer_id"),
            "payment_date": user_metadata.get("payment_date")
        }
        
    except Exception as e:
        logger.error(f"Error getting subscription: {str(e)}")
        raise HTTPException(500, detail=f"Error: {str(e)}")

@app.get("/api/stripe/session/{session_id}")
async def get_stripe_session(session_id: str, user=Depends(get_current_user)):
    """Get Stripe session details for verification"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Verify this session belongs to the current user
        if session.metadata.get('user_id') != user.get('id'):
            raise HTTPException(403, detail="Not authorized for this session")
        
        return {
            "session_id": session.id,
            "payment_status": session.payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency,
            "customer_email": session.customer_details.email if session.customer_details else None,
            "metadata": session.metadata
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Session retrieval error: {str(e)}")
        raise HTTPException(500, detail=f"Server error: {str(e)}")

# # =============================================================================`



# Serve static files
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")
app.mount("/images", StaticFiles(directory=os.path.join(frontend_path, "images")), name="images")
app.mount("/pages", StaticFiles(directory=os.path.join(frontend_path, "pages")), name="pages")







# =============================================================================
# MAIN ROUTES
# =============================================================================

@app.get("/", response_class=FileResponse)
async def serve_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/{filename:path}")
async def serve_static_files(filename: str):
    if filename.endswith('.html'):
        file_path = os.path.join(frontend_path, filename)
        if os.path.exists(file_path):
            return FileResponse(file_path)
        else:
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
    else:
        raise HTTPException(status_code=404, detail="File not found")

# =============================================================================
# PAGE ROUTES
# =============================================================================

@app.get("/pages/schedule.html", response_class=FileResponse)
async def serve_schedule():
    schedule_path = os.path.join(frontend_path, "schedule.html")
    if os.path.exists(schedule_path):
        return FileResponse(schedule_path)
    else:
        raise HTTPException(status_code=404, detail="Schedule page not found")

@app.get("/pages/listings.html", response_class=FileResponse)
async def serve_listings():
    listings_path = os.path.join(frontend_path, "listings.html")
    if os.path.exists(listings_path):
        return FileResponse(listings_path)
    else:
        raise HTTPException(status_code=404, detail="Listings page not found")

@app.get("/pages/assistant.html", response_class=FileResponse)
async def serve_assistant():
    assistant_path = os.path.join(frontend_path, "assistant.html")
    if os.path.exists(assistant_path):
        return FileResponse(assistant_path)
    else:
        raise HTTPException(status_code=404, detail="Assistant page not found")

@app.get("/pages/auth.html", response_class=FileResponse)
async def serve_auth():
    auth_path = os.path.join(frontend_path, "pages", "auth.html")
    if os.path.exists(auth_path):
        return FileResponse(auth_path)
    else:
        raise HTTPException(status_code=404, detail="Auth page not found")

@app.get("/pages/login.html", response_class=FileResponse)
async def serve_login():
    login_path = os.path.join(frontend_path, "pages", "login.html")
    if os.path.exists(login_path):
        return FileResponse(login_path)
    else:
        raise HTTPException(status_code=404, detail="Login page not found")

@app.get("/pages/profile.html", response_class=FileResponse)
async def serve_profile():
    profile_path = os.path.join(frontend_path, "pages", "profile.html")
    if os.path.exists(profile_path):
        return FileResponse(profile_path)
    else:
        raise HTTPException(status_code=404, detail="Profile page not found")

@app.get("/pages/property-detail.html", response_class=FileResponse)
async def serve_property_detail():
    property_detail_path = os.path.join(frontend_path, "pages", "property-detail.html")
    if os.path.exists(property_detail_path):
        return FileResponse(property_detail_path)
    else:
        raise HTTPException(status_code=404, detail="Property detail page not found")
# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
