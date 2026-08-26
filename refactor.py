import os
import re

def refactor_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Add get_session to imports from core.database
    if 'from core.database import engine' in content:
        content = content.replace('from core.database import engine', 'from core.database import engine, get_session')
    
    # 2. Add session: Session = Depends(get_session) to route signatures
    # We need to find `def <func_name>(...):` and if its body starts with `    with Session(engine) as session:`,
    # we inject the parameter and unindent the body.
    
    # It's easier to process line by line
    lines = content.splitlines()
    new_lines = []
    
    i = 0
    in_with_block = False
    with_block_indent = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Check if this line is `    with Session(engine) as session:`
        match = re.match(r'^(\s+)with Session\(engine\) as session:', line)
        if match:
            indent = match.group(1)
            # Find the preceding def statement to inject `session: Session = Depends(get_session)`
            # The def statement might be multiple lines above, ending with `:\n`
            
            # Backtrack in new_lines to find the `def ` or the end of the signature
            # Actually, just finding the closing `):` or `) -> ...:`
            for j in range(len(new_lines)-1, -1, -1):
                if re.search(r'\):\s*$', new_lines[j]) or re.search(r'\) -> [^:]+:\s*$', new_lines[j]):
                    # Inject `session: Session = Depends(get_session)` before the closing parenthesis
                    # This is tricky because it might be `current_user: CurrentUser = Depends(get_current_user)) -> ...:`
                    # Let's use a simpler regex replacement for the signature end.
                    
                    # We will replace `)` with `, session: Session = Depends(get_session))`
                    # Wait, what if it's `def foo():`?
                    
                    # More robust: find the last `)` before `:`
                    idx = new_lines[j].rfind(')')
                    if idx != -1:
                        prefix = new_lines[j][:idx]
                        suffix = new_lines[j][idx:]
                        # Only add comma if there are other params (prefix doesn't end with '(')
                        if not prefix.strip().endswith('('):
                            prefix += ', '
                        new_lines[j] = prefix + 'session: Session = Depends(get_session)' + suffix
                    break

            i += 1
            # Unindent the next lines until we hit a line with less or equal indent (ignoring empty lines)
            while i < len(lines):
                next_line = lines[i]
                if next_line.strip() == '':
                    new_lines.append('')
                    i += 1
                    continue
                    
                next_indent = len(next_line) - len(next_line.lstrip())
                if next_indent <= len(indent):
                    break
                    
                # Remove 4 spaces
                if next_line.startswith(indent + '    '):
                    new_lines.append(next_line[4:])
                else:
                    new_lines.append(next_line)
                i += 1
            continue
            
        new_lines.append(line)
        i += 1
        
    with open(filepath, 'w') as f:
        f.write('\n'.join(new_lines) + '\n')
        
for f in ['backend/api/routes/documents.py', 'backend/api/routes/study.py', 'backend/api/routes/user.py']:
    refactor_file(f)
