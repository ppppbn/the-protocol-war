"""
Secure sandbox for executing user-uploaded scripts.
Uses subprocess isolation with timeout and restricted globals.

Security measures:
- Restricted builtins (no file/network/system access)
- Blocked dangerous imports
- Execution timeout
- Error message sanitization
"""
import subprocess
import sys
import json
import os
import ast
import re
from typing import Tuple, Optional, List


# Blocked import patterns - these should never be allowed
BLOCKED_IMPORTS = [
    'os', 'sys', 'subprocess', 'socket', 'requests', 'urllib',
    'http', 'ftplib', 'smtplib', 'telnetlib', 'ssl',
    'shutil', 'pathlib', 'glob', 'tempfile', 'io',
    'pickle', 'marshal', 'shelve',
    'ctypes', 'multiprocessing', 'threading', 'concurrent',
    'asyncio', 'signal', 'resource',
    'builtins', '__builtins__', 'importlib', 'imp',
    'code', 'codeop', 'compile', 'exec', 'eval',
    'open', 'file', 'input',
]

# Regex to detect blocked patterns in code
BLOCKED_PATTERNS = [
    r'\bopen\s*\(',
    r'\bexec\s*\(',
    r'\beval\s*\(',
    r'\bcompile\s*\(',
    r'__import__',
    r'__builtins__',
    r'__class__',
    r'__subclasses__',
    r'__globals__',
    r'__code__',
]


def validate_script(code: str) -> Tuple[bool, List[str]]:
    """
    Validate a script for syntax and security issues.
    
    Args:
        code: Python source code to validate
        
    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    
    # Check for syntax errors
    try:
        ast.parse(code)
    except SyntaxError as e:
        errors.append(f"Syntax error on line {e.lineno}: {e.msg}")
        return False, errors
    
    # Check for make_decision function
    tree = ast.parse(code)
    has_make_decision = False
    
    for node in ast.walk(tree):
        # Check for function definition
        if isinstance(node, ast.FunctionDef) and node.name == 'make_decision':
            has_make_decision = True
            # Check arguments
            args = node.args
            if len(args.args) != 3:
                errors.append("make_decision must have exactly 3 arguments: history, current_round_index, total_rounds")
        
        # Check for blocked imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                module = alias.name.split('.')[0]
                if module in BLOCKED_IMPORTS:
                    errors.append(f"Blocked import: '{alias.name}' is not allowed for security reasons")
        
        if isinstance(node, ast.ImportFrom):
            module = node.module.split('.')[0] if node.module else ''
            if module in BLOCKED_IMPORTS:
                errors.append(f"Blocked import: '{node.module}' is not allowed for security reasons")
    
    if not has_make_decision:
        errors.append("Script must define a 'make_decision' function")
    
    # Check for blocked patterns using regex
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, code):
            errors.append(f"Blocked pattern detected: code contains restricted functionality")
            break
    
    return len(errors) == 0, errors


# Template for executing a single decision
RUNNER_TEMPLATE = '''
import sys
import json
import random  # Allow random for strategies

# Restricted builtins - remove dangerous functions
SAFE_BUILTINS = {{
    'abs': abs, 'all': all, 'any': any, 'bool': bool,
    'dict': dict, 'enumerate': enumerate, 'filter': filter,
    'float': float, 'int': int, 'len': len, 'list': list,
    'map': map, 'max': max, 'min': min, 'range': range,
    'reversed': reversed, 'round': round, 'set': set,
    'sorted': sorted, 'str': str, 'sum': sum, 'tuple': tuple,
    'zip': zip, 'True': True, 'False': False, 'None': None,
    'print': lambda *args, **kwargs: None,  # Disable print
}}

# User code
user_code = {user_code!r}

# Input data
history = {history!r}
current_round = {current_round!r}
total_rounds = {total_rounds!r}

try:
    # Create namespace with safe builtins and random
    namespace = {{
        "__builtins__": SAFE_BUILTINS,
        "random": random,  # Allow random module
    }}
    
    # Execute user code - this defines make_decision in namespace
    exec(user_code, namespace)
    
    # Get the function from namespace
    make_decision = namespace.get('make_decision')
    if make_decision is None:
        raise ValueError("make_decision function not defined")
    
    # Call make_decision
    result = make_decision(history, current_round, total_rounds)
    
    # Validate result
    if result not in ['SYNC', 'HACK']:
        result = 'SYNC'  # Default to SYNC on invalid response
    
    print(json.dumps({{"success": True, "decision": result}}))
except Exception as e:
    # Sanitize error message - don't leak system info
    error_msg = str(e)
    if len(error_msg) > 100:
        error_msg = error_msg[:100] + "..."
    print(json.dumps({{"success": False, "error": error_msg, "decision": "SYNC"}}))
'''


def execute_decision(
    script_code: str,
    history: list,
    current_round: int,
    total_rounds: int,
    timeout: float = 2.0
) -> Tuple[str, Optional[str]]:
    """
    Execute a user script to get a decision.
    
    Args:
        script_code: The Python code containing make_decision function
        history: List of (own_move, opponent_move) tuples
        current_round: Current round index (0-based)
        total_rounds: Total rounds in the match
        timeout: Maximum execution time in seconds
        
    Returns:
        Tuple of (decision, error_message)
        decision is 'SYNC' or 'HACK'
        error_message is None on success
    """
    # Format the runner script
    runner_code = RUNNER_TEMPLATE.format(
        user_code=script_code,
        history=history,
        current_round=current_round,
        total_rounds=total_rounds
    )
    
    try:
        # Execute in subprocess with minimal environment
        safe_env = {
            'PATH': os.environ.get('PATH', ''),
            'PYTHONDONTWRITEBYTECODE': '1',
            'PYTHONUNBUFFERED': '1',
        }
        
        result = subprocess.run(
            [sys.executable, '-c', runner_code],
            capture_output=True,
            text=True,
            timeout=timeout,
            env=safe_env
        )
        
        # Parse output
        if result.returncode == 0 and result.stdout.strip():
            try:
                output = json.loads(result.stdout.strip())
                decision = output.get('decision', 'SYNC')
                error = output.get('error') if not output.get('success') else None
                return decision, error
            except json.JSONDecodeError:
                return 'SYNC', 'Script produced invalid output'
        else:
            # Sanitize stderr - don't leak paths
            error_msg = result.stderr[:150] if result.stderr else 'Execution failed'
            error_msg = re.sub(r'/[^\s]+/', '[path]/', error_msg)
            return 'SYNC', error_msg
            
    except subprocess.TimeoutExpired:
        return 'SYNC', 'Execution timeout (2s limit exceeded)'
    except Exception as e:
        return 'SYNC', 'Execution error'


def run_match(
    script1_code: str,
    script2_code: str,
    total_rounds: int = 100
) -> Tuple[int, int, list]:
    """
    Run a complete match between two scripts.
    
    Args:
        script1_code: Code for player 1
        script2_code: Code for player 2
        total_rounds: Number of rounds to play
        
    Returns:
        Tuple of (score1, score2, round_history)
        round_history is list of (move1, move2) tuples
    """
    # Payoff matrix
    PAYOFFS = {
        ('SYNC', 'SYNC'): (3, 3),
        ('SYNC', 'HACK'): (0, 5),
        ('HACK', 'SYNC'): (5, 0),
        ('HACK', 'HACK'): (1, 1),
    }
    
    score1, score2 = 0, 0
    history1, history2 = [], []  # Each player sees their own perspective
    round_history = []
    
    for round_idx in range(total_rounds):
        # Get decisions from both players
        move1, err1 = execute_decision(script1_code, history1, round_idx, total_rounds)
        move2, err2 = execute_decision(script2_code, history2, round_idx, total_rounds)
        
        # Calculate payoffs
        p1, p2 = PAYOFFS.get((move1, move2), (0, 0))
        score1 += p1
        score2 += p2
        
        # Update histories (from each player's perspective)
        history1.append((move1, move2))
        history2.append((move2, move1))
        round_history.append((move1, move2))
    
    return score1, score2, round_history
